import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireDatabaseRoles } from '@/lib/authz'
import {
  ActivityType,
  FollowUpCategory,
  FollowUpStatus,
  LeadAssignmentDepartment,
  LeadPrimaryOwnerDepartment,
  LeadStage,
  LeadSubStatus,
  QuotationDraftStatus,
  VisitStatus,
} from '@/generated/prisma/client'
import { buildDefaultQuotationContent } from '@/lib/quotation-templates'

type RouteContext = { params: { id: string } | Promise<{ id: string }> }

async function resolveLeadId(context: RouteContext): Promise<string | null> {
  const resolvedParams = await context.params
  const id = resolvedParams?.id
  if (typeof id !== 'string') return null
  const trimmed = id.trim()
  return trimmed.length > 0 ? trimmed : null
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireDatabaseRoles([])
    if (!authResult.ok) {
      return authResult.response
    }

    const isAdmin =
      authResult.actor.userDepartments.includes('ADMIN') ||
      authResult.actorRoles.some((r) => r.toUpperCase() === 'ADMIN')

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Only administrators can activate instant quotation.' },
        { status: 403 },
      )
    }

    const leadId = await resolveLeadId(context)
    if (!leadId) {
      return NextResponse.json(
        { success: false, error: 'Invalid lead ID' },
        { status: 400 },
      )
    }

    const body = (await req.json()) as {
      projectSqft?: unknown
      seniorCrmUserId?: unknown
      visitDate?: unknown
      followupDate?: unknown
      followupNotes?: unknown
    }

    const rawSqft = body.projectSqft
    const parsedSqft =
      typeof rawSqft === 'number'
        ? rawSqft
        : typeof rawSqft === 'string'
          ? Number(rawSqft.trim().replace(/,/g, ''))
          : NaN

    if (!Number.isFinite(parsedSqft) || parsedSqft <= 0) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid project size (sqft) greater than 0.' },
        { status: 400 },
      )
    }

    const seniorCrmUserId =
      typeof body.seniorCrmUserId === 'string' ? body.seniorCrmUserId.trim() : ''

    if (!seniorCrmUserId) {
      return NextResponse.json(
        { success: false, error: 'Please select an assigned Senior CRM.' },
        { status: 400 },
      )
    }

    const seniorUser = await prisma.user.findUnique({
      where: { id: seniorCrmUserId },
      select: { id: true, fullName: true, email: true },
    })

    if (!seniorUser) {
      return NextResponse.json(
        { success: false, error: 'Selected Senior CRM user was not found.' },
        { status: 404 },
      )
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        visits: {
          orderBy: { scheduledAt: 'desc' },
          take: 1,
        },
        quotationDrafts: {
          select: { id: true, draftKey: true },
        },
      },
    })

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found.' },
        { status: 404 },
      )
    }

    let parsedVisitDate: Date | null = null
    if (typeof body.visitDate === 'string' && body.visitDate.trim()) {
      const d = new Date(body.visitDate.trim())
      if (!Number.isNaN(d.getTime())) {
        parsedVisitDate = d
      }
    }

    let parsedFollowupDate: Date | null = null
    if (typeof body.followupDate === 'string' && body.followupDate.trim()) {
      const d = new Date(body.followupDate.trim())
      if (!Number.isNaN(d.getTime())) {
        parsedFollowupDate = d
      }
    }

    const followupNotes =
      typeof body.followupNotes === 'string' ? body.followupNotes.trim() : ''

    await prisma.$transaction(async (tx) => {
      // 1. Update Lead stage & primary owner
      await tx.lead.update({
        where: { id: leadId },
        data: {
          stage: LeadStage.QUOTATION_PHASE,
          subStatus: LeadSubStatus.QUOTATION_WORKING,
          primaryOwnerDepartment: LeadPrimaryOwnerDepartment.SR_CRM,
          primaryOwnerUserId: seniorCrmUserId,
          assignedTo: seniorCrmUserId,
        },
      })

      // 2. Record stage history
      await tx.leadStatusHistory.create({
        data: {
          leadId,
          oldStatus: lead.stage,
          newStatus: LeadStage.QUOTATION_PHASE,
          changedById: authResult.actorUserId,
        },
      })

      // 3. Log activity
      await tx.activityLog.create({
        data: {
          leadId,
          userId: authResult.actorUserId,
          type: ActivityType.STATUS_CHANGE,
          description: `Instant quotation activated by Admin. Project size: ${parsedSqft.toLocaleString()} sqft. Assigned to Senior CRM: ${seniorUser.fullName}`,
        },
      })

      // 4. Upsert Senior CRM assignment
      const existingSrAssignment = await tx.leadAssignment.findFirst({
        where: { leadId, department: LeadAssignmentDepartment.SR_CRM },
      })

      if (existingSrAssignment) {
        await tx.leadAssignment.update({
          where: { id: existingSrAssignment.id },
          data: { userId: seniorCrmUserId },
        })
      } else {
        await tx.leadAssignment.create({
          data: {
            leadId,
            userId: seniorCrmUserId,
            department: LeadAssignmentDepartment.SR_CRM,
          },
        })
      }

      // 5. Handle Visit (optional)
      if (parsedVisitDate) {
        await tx.visit.create({
          data: {
            leadId,
            assignedToId: seniorCrmUserId,
            scheduledAt: parsedVisitDate,
            projectSqft: parsedSqft,
            location: lead.location || 'Client location',
            notes: 'Visit scheduled during Admin Instant Quotation initialization',
            createdById: authResult.actorUserId,
            status: VisitStatus.SCHEDULED,
          },
        })
      } else if (lead.visits.length > 0) {
        // Update sqft on the latest existing visit if already present
        await tx.visit.update({
          where: { id: lead.visits[0].id },
          data: { projectSqft: parsedSqft },
        })
      }

      // 6. Handle Follow-up (optional or notes)
      if (parsedFollowupDate) {
        await tx.followUp.create({
          data: {
            leadId,
            assignedToId: seniorCrmUserId,
            followupDate: parsedFollowupDate,
            notes: followupNotes || 'Instant quotation follow-up scheduled by Admin',
            category: FollowUpCategory.GENERAL,
            status: FollowUpStatus.PENDING,
          },
        })
      } else if (followupNotes) {
        // Record note as a general follow-up log for today
        await tx.followUp.create({
          data: {
            leadId,
            assignedToId: seniorCrmUserId,
            followupDate: new Date(),
            notes: followupNotes,
            category: FollowUpCategory.GENERAL,
            status: FollowUpStatus.DONE,
          },
        })
      }

      // 7. Update existing quotation drafts with projectSqft, or create initial draft if none exists
      if (lead.quotationDrafts.length > 0) {
        await tx.quotationDraft.updateMany({
          where: { leadId },
          data: { projectSqft: parsedSqft },
        })
      } else {
        const defaultContent = buildDefaultQuotationContent({
          quotationType: 'STANDARD',
          projectSqft: parsedSqft,
        })

        await tx.quotationDraft.create({
          data: {
            leadId,
            draftKey: 'detail',
            createdById: authResult.actorUserId,
            projectSqft: parsedSqft,
            content: defaultContent as any,
            grandTotal: 0,
            status: QuotationDraftStatus.DRAFT,
          },
        })
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        leadId,
        quotationUrl: `/crm/admin/quotation/leads/${leadId}`,
      },
    })
  } catch (error) {
    console.error('[admin/instant-quotation] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to activate instant quotation',
      },
      { status: 500 },
    )
  }
}
