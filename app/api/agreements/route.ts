import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireDatabaseRoles } from '@/lib/authz'
import { LeadAssignmentDepartment } from '@/generated/prisma/client'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireDatabaseRoles([])
    if (!authResult.ok) return authResult.response

    const actorDepartments = new Set(authResult.actor.userDepartments ?? [])
    const isAdmin = actorDepartments.has('ADMIN')
    const isSeniorCrm = actorDepartments.has('SR_CRM')

    if (!isAdmin && !isSeniorCrm) {
      return NextResponse.json(
        { success: false, error: 'Only Admin or Senior CRM users can access the agreement page' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')?.trim() || ''
    const agreementTypeFilter = searchParams.get('agreementType')?.trim() || 'ALL'

    const where: any = {
      agreementType: { not: null },
    }

    if (isSeniorCrm && !isAdmin) {
      where.assignments = {
        some: {
          department: LeadAssignmentDepartment.SR_CRM,
          userId: authResult.actorUserId,
        },
      }
    }

    if (agreementTypeFilter && agreementTypeFilter !== 'ALL') {
      where.agreementType = agreementTypeFilter
    }

    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { location: { contains: search, mode: 'insensitive' } },
          ],
        },
      ]
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { updated_at: 'desc' },
      select: {
        id: true,
        clientId: true,
        name: true,
        phone: true,
        location: true,
        stage: true,
        subStatus: true,
        agreementType: true,
        agreementValue: true,
        budget: true,
        updated_at: true,
        created_at: true,
        assignments: {
          where: {
            department: {
              in: [
                LeadAssignmentDepartment.SR_CRM,
                LeadAssignmentDepartment.VISUALIZER_3D,
                LeadAssignmentDepartment.QUOTATION,
              ],
            },
          },
          select: {
            department: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        visits: {
          where: { status: 'COMPLETED' },
          orderBy: { scheduledAt: 'desc' },
          take: 1,
          select: {
            projectSqft: true,
            scheduledAt: true,
          },
        },
        quotationDrafts: {
          select: {
            id: true,
            draftKey: true,
            grandTotal: true,
            status: true,
          },
        },
        cadWorkSubmissions: {
          where: {
            files: {
              some: {
                fileName: { contains: 'quotation', mode: 'insensitive' },
              },
            },
          },
          select: {
            files: {
              select: {
                id: true,
                fileName: true,
                url: true,
              },
            },
          },
        },
      },
    })

    const data = leads.map((lead) => {
      const srCrm = lead.assignments.find((a) => a.department === LeadAssignmentDepartment.SR_CRM)?.user ?? null
      const visualizer = lead.assignments.find((a) => a.department === LeadAssignmentDepartment.VISUALIZER_3D)?.user ?? null
      const quotation = lead.assignments.find((a) => a.department === LeadAssignmentDepartment.QUOTATION)?.user ?? null

      const quotationFiles = (lead.cadWorkSubmissions || []).flatMap((sub: any) => sub.files || [])

      return {
        id: lead.id,
        clientId: lead.clientId,
        name: lead.name,
        phone: lead.phone,
        location: lead.location,
        stage: lead.stage,
        subStatus: lead.subStatus,
        agreementType: lead.agreementType,
        agreementValue: lead.agreementValue,
        budget: lead.budget,
        projectSqft: lead.visits[0]?.projectSqft ?? null,
        visitDate: lead.visits[0]?.scheduledAt ?? null,
        hasQuotationDraft: (lead.quotationDrafts || []).length > 0,
        quotationFiles,
        updatedAt: lead.updated_at,
        createdAt: lead.created_at,
        srCrm,
        visualizer,
        quotation,
      }
    })

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('[agreements][GET] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agreement leads' },
      { status: 500 }
    )
  }
}
