import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import {
  ActivityType,
  LeadAssignmentDepartment,
  LeadPhaseTaskStatus,
  LeadPhaseType,
  LeadPrimaryOwnerDepartment,
  LeadStage,
  LeadSubStatus,
} from '@/generated/prisma/client'
import { requireDatabaseRoles } from '@/lib/authz'
import { logActivity, logLeadCreated, logLeadSubStatusChanged } from '@/lib/activity-log-service'
import { getWeeklySeniorCrmAssignment } from '@/lib/sr-crm-rotation'
import { formatPhoneForStorage } from '@/lib/phone-normalize'
import { buildDefaultShortQuotationContent } from '@/lib/short-quotation-default'

export const runtime = 'nodejs'
export const preferredRegion = 'sin1'

type CreateQuotationClientBody = {
  name?: unknown
  phone?: unknown
  email?: unknown
  location?: unknown
  budget?: unknown
  projectSqft?: unknown
  source?: unknown
  remarks?: unknown
  assignedQuotationUserId?: unknown
  seniorCrmUserId?: unknown
}

function toOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function toOptionalNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null
  const parsed = Number(typeof value === 'string' ? value.replace(/,/g, '') : value)
  return Number.isFinite(parsed) ? parsed : null
}

function toPhoneForStorage(value: unknown): string | null {
  const raw = toOptionalString(value)
  if (!raw) return null
  const normalized = formatPhoneForStorage(raw)
  if (!normalized) return raw.replace(/\D/g, '') || raw
  if (/^8801[3-9]\d{8}$/.test(normalized)) {
    return `0${normalized.slice(3)}`
  }
  return normalized
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
        { success: false, error: 'Only quotation team members, Senior CRM, or Admin can add quotation clients' },
        { status: 403 },
      )
    }

    const body = (await request.json().catch(() => ({}))) as CreateQuotationClientBody
    const name = toOptionalString(body.name)
    if (!name) {
      return NextResponse.json({ success: false, error: 'Client name is required' }, { status: 400 })
    }

    const phone = toPhoneForStorage(body.phone)
    if (phone) {
      const existing = await prisma.lead.findFirst({
        where: { phone },
        select: { id: true, name: true },
      })
      if (existing) {
        return NextResponse.json(
          { success: false, error: `A lead with phone number ${phone} already exists (${existing.name})` },
          { status: 409 },
        )
      }
    }

    const email = toOptionalString(body.email)?.toLowerCase() ?? null
    const location = toOptionalString(body.location) ?? null
    const budget = toOptionalNumber(body.budget)
    const projectSqft = toOptionalNumber(body.projectSqft)
    const source = toOptionalString(body.source) ?? 'Quotation Team'
    const remarks = toOptionalString(body.remarks) ?? null

    // Determine target quotation assignee
    let targetQuotationUserId = toOptionalString(body.assignedQuotationUserId)
    if (!targetQuotationUserId || !isAdmin) {
      targetQuotationUserId = authResult.actorUserId
    } else {
      const assignedUser = await prisma.user.findUnique({
        where: { id: targetQuotationUserId },
        select: {
          id: true,
          userDepartments: { select: { department: { select: { name: true } } } },
        },
      })
      const targetDepts = new Set(assignedUser?.userDepartments.map((d) => d.department.name) ?? [])
      if (!targetDepts.has('QUOTATION') && !targetDepts.has('QUOTATION_TEAM') && !targetDepts.has('SR_CRM')) {
        targetQuotationUserId = authResult.actorUserId
      }
    }

    // Determine Senior CRM assignment
    let targetSrCrmUserId = toOptionalString(body.seniorCrmUserId)
    if (!targetSrCrmUserId) {
      try {
        const weeklySr = await getWeeklySeniorCrmAssignment()
        targetSrCrmUserId = weeklySr.selected?.id ?? null
      } catch {
        targetSrCrmUserId = null
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const now = new Date()

      // 1. Create Lead in QUOTATION_PHASE and QUOTATION_WORKING
      const newLead = await tx.lead.create({
        data: {
          name,
          phone,
          email,
          location,
          budget,
          source,
          remarks,
          stage: LeadStage.QUOTATION_PHASE,
          subStatus: LeadSubStatus.QUOTATION_WORKING,
          assignedTo: targetQuotationUserId,
          primaryOwnerDepartment: targetSrCrmUserId ? LeadPrimaryOwnerDepartment.SR_CRM : null,
          primaryOwnerUserId: targetSrCrmUserId,
        },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          location: true,
          budget: true,
          stage: true,
          subStatus: true,
          created_at: true,
        },
      })

      // 2. Assign Quotation Team member
      await tx.leadAssignment.create({
        data: {
          leadId: newLead.id,
          userId: targetQuotationUserId!,
          department: LeadAssignmentDepartment.QUOTATION,
        },
      })

      // 3. Assign Senior CRM if resolved
      if (targetSrCrmUserId) {
        await tx.leadAssignment.create({
          data: {
            leadId: newLead.id,
            userId: targetSrCrmUserId,
            department: LeadAssignmentDepartment.SR_CRM,
          },
        })
      }

      // 4. Create LeadPhaseTask for QUOTATION
      const dueAt = new Date(now)
      dueAt.setDate(dueAt.getDate() + 3)
      await tx.leadPhaseTask.create({
        data: {
          leadId: newLead.id,
          phaseType: LeadPhaseType.QUOTATION,
          assigneeUserId: targetQuotationUserId!,
          status: LeadPhaseTaskStatus.OPEN,
          startedAt: now,
          dueAt,
          createdById: authResult.actorUserId,
          workDetails: 'Direct client created by quotation department for quotation generation.',
        },
      })

      // 5. If projectSqft is provided, initialize a default Short Quotation Draft
      if (projectSqft && projectSqft > 0) {
        const defaultShortContent = buildDefaultShortQuotationContent({
          clientName: newLead.name,
          clientAddress: newLead.location,
          packageTier: 'PREMIUM',
        })
        await tx.quotationDraft.create({
          data: {
            leadId: newLead.id,
            draftKey: 'short_PREMIUM',
            quotationType: 'PREMIUM',
            projectSqft,
            content: defaultShortContent as any,
            createdById: authResult.actorUserId,
          },
        })
      }

      // 6. Log activities
      await logLeadCreated(tx, {
        leadId: newLead.id,
        userId: authResult.actorUserId,
        leadName: newLead.name,
      })

      await logLeadSubStatusChanged(tx, {
        leadId: newLead.id,
        userId: authResult.actorUserId,
        from: null,
        to: LeadSubStatus.QUOTATION_WORKING,
        reason: 'Quotation team created client directly in Quotation Phase.',
      })

      await logActivity(tx, {
        leadId: newLead.id,
        userId: authResult.actorUserId,
        type: ActivityType.NOTE,
        description: 'Client created directly by Quotation Team and placed into Quotation Phase (Working).',
      })

      return newLead
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          ...result,
          quotationWorkspaceUrl: `/quotation-team/leads/${result.id}`,
        },
        message: 'Client added successfully in Quotation Phase. Ready to generate quotation.',
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('[quotation/client][POST] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add quotation client',
      },
      { status: 500 },
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: { Allow: 'POST, OPTIONS' },
  })
}
