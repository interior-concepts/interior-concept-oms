import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { LeadAssignmentDepartment, LeadSubStatus } from '@/generated/prisma/client'
import { requireDatabaseRoles } from '@/lib/authz'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const authResult = await requireDatabaseRoles([])
    if (!authResult.ok) return authResult.response

    const actorDepartments = new Set(authResult.actor.userDepartments ?? [])
    const isAdmin = actorDepartments.has('ADMIN')
    const isSrCrm = actorDepartments.has('SR_CRM')
    const isBoq = actorDepartments.has('BOQ')
    const isAdminOrSr = isAdmin || isSrCrm

    if (!isAdminOrSr && !isBoq) {
      return NextResponse.json(
        { success: false, error: 'Only BOQ team, senior CRM, or admin can access BOQ assigned tasks' },
        { status: 403 },
      )
    }

    // Admins/SR see all BOQ-assigned leads; BOQ member sees only their own
    const whereClause = isAdminOrSr
      ? {
          assignments: {
            some: {
              department: LeadAssignmentDepartment.BOQ,
            },
          },
        }
      : {
          assignments: {
            some: {
              department: LeadAssignmentDepartment.BOQ,
              userId: authResult.actorUserId,
            },
          },
        }

    const leads = await prisma.lead.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        phone: true,
        location: true,
        stage: true,
        subStatus: true,
        budget: true,
        agreementValue: true,
        updated_at: true,
        assignments: {
          where: {
            department: {
              in: [
                LeadAssignmentDepartment.BOQ,
                LeadAssignmentDepartment.SR_CRM,
                LeadAssignmentDepartment.QUOTATION,
              ],
            },
          },
          select: {
            department: true,
            user: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
        quotationDrafts: {
          select: {
            draftKey: true,
            projectSqft: true,
          },
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
        visits: {
          where: { status: 'COMPLETED' },
          select: { projectSqft: true },
          orderBy: { scheduledAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updated_at: 'desc' },
    })

    const tasks = leads.map((lead) => {
      const boqAssignee =
        ((lead.assignments ?? []) as Array<{ department: string; user: { id: string; fullName: string; email: string } }>)
          .find((a) => a.department === 'BOQ')?.user ?? null
      const srCrmAssignee =
        ((lead.assignments ?? []) as Array<{ department: string; user: { id: string; fullName: string; email: string } }>)
          .find((a) => a.department === 'SR_CRM')?.user ?? null
      const quotationAssignee =
        ((lead.assignments ?? []) as Array<{ department: string; user: { id: string; fullName: string; email: string } }>)
          .find((a) => a.department === 'QUOTATION')?.user ?? null

      const projectSqft =
        lead.quotationDrafts?.[0]?.projectSqft ??
        lead.visits?.[0]?.projectSqft ??
        null

      return {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        location: lead.location,
        stage: lead.stage,
        subStatus: lead.subStatus,
        budget: lead.budget,
        agreementValue: lead.agreementValue,
        updatedAt: lead.updated_at,
        projectSqft,
        boqAssignee,
        srCrmAssignee,
        quotationAssignee,
        canStart:
          lead.subStatus !== LeadSubStatus.BOQ_WORKING &&
          lead.subStatus !== LeadSubStatus.BOQ_COMPLETED,
        canSubmit:
          lead.subStatus === LeadSubStatus.BOQ_WORKING ||
          lead.subStatus === LeadSubStatus.BOQ_CORRECTION,
      }
    })

    return NextResponse.json({ success: true, data: tasks })
  } catch (error) {
    console.error('[boq/assigned-tasks][GET] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load BOQ assigned tasks' },
      { status: 500 },
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: { Allow: 'GET, OPTIONS' },
  })
}
