import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import {
  ActivityType,
  LeadAssignmentDepartment,
  LeadPhaseTaskStatus,
  LeadPhaseType,
  LeadStage,
  LeadSubStatus,
} from '@/generated/prisma/client'
import { requireDatabaseRoles } from '@/lib/authz'
import { logActivity, logLeadSubStatusChanged, logUserAssigned } from '@/lib/activity-log-service'
import { calculateLeadQuotationSqftSummary } from '@/lib/quotation-sqft-calculator'

export const runtime = 'nodejs'
export const preferredRegion = 'sin1'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireDatabaseRoles([])
    if (!authResult.ok) return authResult.response

    const actorDepartments = new Set(authResult.actor.userDepartments ?? [])
    const isAdmin = actorDepartments.has('ADMIN')
    const isSrCrm = actorDepartments.has('SR_CRM')
    const isQuotation = actorDepartments.has('QUOTATION') || actorDepartments.has('QUOTATION_TEAM')

    if (!isAdmin && !isSrCrm && !isQuotation) {
      return NextResponse.json(
        { success: false, error: 'Only quotation team, senior CRM, or admin can access the quotation queue' },
        { status: 403 },
      )
    }

    const { searchParams } = new URL(request.url)
    const viewFilter = searchParams.get('filter') ?? 'unassigned' // 'unassigned' | 'all'

    const where: any = {
      AND: [
        {
          OR: [
            { stage: LeadStage.QUOTATION_PHASE },
            { stage: LeadStage.BUDGET_PHASE },
            {
              subStatus: {
                in: [
                  LeadSubStatus.QUOTATION_ASSIGNED,
                  LeadSubStatus.QUOTATION_WORKING,
                  LeadSubStatus.QUOTATION_CORRECTION,
                  LeadSubStatus.CAD_COMPLETED,
                  LeadSubStatus.CAD_APPROVED,
                ],
              },
            },
          ],
        },
        viewFilter === 'unassigned'
          ? {
              assignments: {
                none: {
                  department: LeadAssignmentDepartment.QUOTATION,
                },
              },
            }
          : {},
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
        created_at: true,
        budget: true,
        assignments: {
          where: {
            department: {
              in: [
                LeadAssignmentDepartment.QUOTATION,
                LeadAssignmentDepartment.SR_CRM,
                LeadAssignmentDepartment.JR_ARCHITECT,
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
        attachments: {
          select: {
            id: true,
            fileName: true,
            url: true,
            fileType: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 6,
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
      take: 100,
    })

    const queueData = leads.map((lead: any) => {
      const fallbackSqft = lead.visits?.[0]?.projectSqft ?? 0
      const sqftSummary = calculateLeadQuotationSqftSummary(lead.quotationDrafts ?? [], fallbackSqft)
      const quotationAssignee = ((lead.assignments || []) as any[]).find(
        (a: any) => a.department === 'QUOTATION',
      )?.user ?? null
      const isAssignedToMe = quotationAssignee?.id === authResult.actorUserId

      return {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        location: lead.location,
        stage: lead.stage,
        subStatus: lead.subStatus,
        updatedAt: lead.updated_at,
        createdAt: lead.created_at,
        budget: lead.budget,
        quotationAssignee,
        isAssignedToMe,
        isUnassigned: !quotationAssignee,
        srCrmAssignee: ((lead.assignments || []) as any[]).find((a: any) => a.department === 'SR_CRM')?.user ?? null,
        jrArchitectAssignee: ((lead.assignments || []) as any[]).find((a: any) => a.department === 'JR_ARCHITECT')?.user ?? null,
        latestFirstMeeting: lead.meetingEvents?.[0] ?? null,
        projectSqft: fallbackSqft || null,
        avgDetailSqft: sqftSummary.avgDetailSqft,
        avgShortSqft: sqftSummary.avgShortSqft,
        attachments: lead.attachments ?? [],
      }
    })

    return NextResponse.json({
      success: true,
      data: queueData,
      totalCount: queueData.length,
      unassignedCount: queueData.filter((q) => q.isUnassigned).length,
    })
  } catch (error) {
    console.error('[quotation/queue][GET] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load quotation queue' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireDatabaseRoles([])
    if (!authResult.ok) return authResult.response

    const actorDepartments = new Set(authResult.actor.userDepartments ?? [])
    const isAdmin = actorDepartments.has('ADMIN')
    const isSrCrm = actorDepartments.has('SR_CRM')
    const isQuotation = actorDepartments.has('QUOTATION') || actorDepartments.has('QUOTATION_TEAM')

    if (!isAdmin && !isSrCrm && !isQuotation) {
      return NextResponse.json(
        { success: false, error: 'Only quotation team, senior CRM, or admin can claim quotation leads' },
        { status: 403 },
      )
    }

    const body = await request.json().catch(() => ({}))
    const leadId = typeof body.leadId === 'string' ? body.leadId.trim() : null
    if (!leadId) {
      return NextResponse.json({ success: false, error: 'Lead id is required' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({
        where: { id: leadId },
        select: {
          id: true,
          name: true,
          stage: true,
          subStatus: true,
          assignments: {
            where: { department: LeadAssignmentDepartment.QUOTATION },
            select: { userId: true },
          },
        },
      })

      if (!lead) throw new Error('LEAD_NOT_FOUND')

      const now = new Date()

      // 1. Assign current user as QUOTATION department
      await tx.leadAssignment.upsert({
        where: {
          leadId_department_userId: {
            leadId: lead.id,
            department: LeadAssignmentDepartment.QUOTATION,
            userId: authResult.actorUserId,
          },
        },
        create: {
          leadId: lead.id,
          userId: authResult.actorUserId,
          department: LeadAssignmentDepartment.QUOTATION,
        },
        update: {},
      })

      // 2. Update lead stage & subStatus
      const updatedLead = await tx.lead.update({
        where: { id: lead.id },
        data: {
          stage: LeadStage.QUOTATION_PHASE,
          subStatus: LeadSubStatus.QUOTATION_WORKING,
          assignedTo: authResult.actorUserId,
        },
        select: { id: true, stage: true, subStatus: true, name: true },
      })

      // 3. Upsert LeadPhaseTask
      const openTask = await tx.leadPhaseTask.findFirst({
        where: {
          leadId: lead.id,
          phaseType: LeadPhaseType.QUOTATION,
          status: { in: [LeadPhaseTaskStatus.OPEN, LeadPhaseTaskStatus.IN_REVIEW] },
        },
        select: { id: true },
      })

      if (openTask) {
        await tx.leadPhaseTask.update({
          where: { id: openTask.id },
          data: {
            assigneeUserId: authResult.actorUserId,
            status: LeadPhaseTaskStatus.OPEN,
            startedAt: now,
            updatedAt: now,
          },
        })
      } else {
        const dueAt = new Date(now)
        dueAt.setDate(dueAt.getDate() + 3)
        await tx.leadPhaseTask.create({
          data: {
            leadId: lead.id,
            phaseType: LeadPhaseType.QUOTATION,
            assigneeUserId: authResult.actorUserId,
            startedAt: now,
            dueAt,
            createdById: authResult.actorUserId,
            workDetails: 'Claimed by quotation team member from quotation queue.',
          },
        })
      }

      // 4. Log subStatus change & activity
      await logLeadSubStatusChanged(tx, {
        leadId: lead.id,
        userId: authResult.actorUserId,
        from: lead.subStatus,
        to: LeadSubStatus.QUOTATION_WORKING,
        reason: 'Lead claimed from quotation queue by quotation team member.',
      })

      await logActivity(tx, {
        leadId: lead.id,
        userId: authResult.actorUserId,
        type: ActivityType.ASSIGNMENT,
        description: `Quotation team member claimed lead from queue.`,
      })

      return updatedLead
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: `Lead ${result.name} claimed and ready for quotation work`,
    })
  } catch (error) {
    console.error('[quotation/queue][POST] Error:', error)
    if (error instanceof Error && error.message === 'LEAD_NOT_FOUND') {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 })
    }
    return NextResponse.json({ success: false, error: 'Failed to claim lead' }, { status: 500 })
  }
}
