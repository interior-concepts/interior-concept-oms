import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { LeadAssignmentDepartment, LeadStage, LeadSubStatus } from '@/generated/prisma/client'
import { requireDatabaseRoles } from '@/lib/authz'
import { calculateLeadQuotationSqftSummary } from '@/lib/quotation-sqft-calculator'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const authResult = await requireDatabaseRoles([])
    if (!authResult.ok) return authResult.response

    const actorDepartments = new Set(authResult.actor.userDepartments ?? [])
    const isAdmin = actorDepartments.has('ADMIN')
    const isSrCrm = actorDepartments.has('SR_CRM')
    const isQuotation = actorDepartments.has('QUOTATION') || actorDepartments.has('QUOTATION_TEAM')
    const isAdminOrSr = isAdmin || isSrCrm

    if (!isAdminOrSr && !isQuotation) {
      return NextResponse.json(
        { success: false, error: 'Only quotation team, senior CRM, or admin can access assigned tasks' },
        { status: 403 },
      )
    }

    const { searchParams } = new URL(request.url)
    const includeHistory = searchParams.get('includeHistory') === '1'
    const viewAll = searchParams.get('all') === '1'

    const where: any = {
      AND: [
        isAdminOrSr || viewAll
          ? {
              OR: [
                { stage: LeadStage.QUOTATION_PHASE },
                { stage: LeadStage.BUDGET_PHASE },
                {
                  subStatus: {
                    in: [
                      LeadSubStatus.QUOTATION_ASSIGNED,
                      LeadSubStatus.QUOTATION_WORKING,
                      LeadSubStatus.QUOTATION_COMPLETED,
                      LeadSubStatus.QUOTATION_CORRECTION,
                      LeadSubStatus.QUOTATION_APPROVED,
                    ],
                  },
                },
                {
                  assignments: {
                    some: {
                      department: LeadAssignmentDepartment.QUOTATION,
                    },
                  },
                },
              ],
            }
          : {
              assignments: {
                some: {
                  department: LeadAssignmentDepartment.QUOTATION,
                  userId: authResult.actorUserId,
                },
              },
            },
        ...(includeHistory
          ? []
          : [
              {
                NOT: {
                  subStatus: LeadSubStatus.QUOTATION_APPROVED,
                },
              },
            ]),
      ],
    }

    const leads = await prisma.lead.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        location: true,
        stage: true,
        subStatus: true,
        updated_at: true,
        budget: true,
        assignments: {
          where: {
            department: {
              in: [LeadAssignmentDepartment.QUOTATION, LeadAssignmentDepartment.SR_CRM, LeadAssignmentDepartment.JR_ARCHITECT]
            }
          },
          select: {
            department: true,
            user: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            url: true,
            fileType: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 8,
        },
        meetingEvents: {
          where: { type: 'FIRST_MEETING' },
          select: {
            id: true,
            title: true,
            notes: true,
            startsAt: true,
          },
          orderBy: { startsAt: 'desc' },
          take: 1,
        },
        visits: {
          where: { status: 'COMPLETED' },
          select: { projectSqft: true },
          orderBy: { scheduledAt: 'desc' },
          take: 1,
        },
        quotationDrafts: {
          select: {
            draftKey: true,
            projectSqft: true,
            content: true,
          },
        },
      },
      orderBy: { updated_at: 'desc' },
    })

    const tasksData = leads.map((lead: any) => {
      const fallbackSqft = lead.visits?.[0]?.projectSqft ?? 0
      const sqftSummary = calculateLeadQuotationSqftSummary(lead.quotationDrafts ?? [], fallbackSqft)
      return {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        location: lead.location,
        stage: lead.stage,
        subStatus: lead.subStatus,
        updatedAt: lead.updated_at,
        budget: lead.budget,
        quotationAssignee: ((lead.assignments || []) as any[]).find((a: any) => a.department === 'QUOTATION')?.user ?? null,
        srCrmAssignee: ((lead.assignments || []) as any[]).find((a: any) => a.department === 'SR_CRM')?.user ?? null,
        jrArchitectAssignee: ((lead.assignments || []) as any[]).find((a: any) => a.department === 'JR_ARCHITECT')?.user ?? null,
        latestFirstMeeting: lead.meetingEvents?.[0] ?? null,
        projectSqft: fallbackSqft || null,
        avgDetailSqft: sqftSummary.avgDetailSqft,
        avgShortSqft: sqftSummary.avgShortSqft,
        detailVersionsCount: sqftSummary.detailVersionsCount,
        shortPackagesCount: sqftSummary.shortPackagesCount,
        attachments: lead.attachments ?? [],
        canStart:
          lead.subStatus !== LeadSubStatus.QUOTATION_WORKING &&
          lead.subStatus !== LeadSubStatus.QUOTATION_COMPLETED &&
          lead.subStatus !== LeadSubStatus.QUOTATION_APPROVED,
        canSubmit:
          lead.subStatus === LeadSubStatus.QUOTATION_WORKING ||
          lead.subStatus === LeadSubStatus.QUOTATION_CORRECTION,
      }
    })

    const totalDetailSqft = tasksData.reduce((sum, item) => sum + item.avgDetailSqft, 0)
    const totalShortSqft = tasksData.reduce((sum, item) => sum + item.avgShortSqft, 0)

    return NextResponse.json({
      success: true,
      data: tasksData,
      metrics: {
        totalDetailSqft,
        totalShortSqft,
        totalSqftWorked: totalDetailSqft + totalShortSqft,
      },
    })
  } catch (error) {
    console.error('[quotation/assigned-tasks][GET] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load assigned quotation tasks' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: { Allow: 'GET, OPTIONS' },
  })
}
