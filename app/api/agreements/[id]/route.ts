import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireDatabaseRoles } from '@/lib/authz'
import { LeadAssignmentDepartment } from '@/generated/prisma/client'
import { buildDefaultAgreementData, type AgreementData } from '@/lib/agreement-types'
import type { QuotationDraftContent } from '@/lib/quotation-types'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireDatabaseRoles([])
    if (!authResult.ok) return authResult.response

    const actorDepartments = new Set(authResult.actor.userDepartments ?? [])
    const isAdmin = actorDepartments.has('ADMIN')
    const isSeniorCrm = actorDepartments.has('SR_CRM')

    if (!isAdmin && !isSeniorCrm) {
      return NextResponse.json(
        { success: false, error: 'Only Admin or Senior CRM users can access agreements' },
        { status: 403 }
      )
    }

    const { id } = await context.params
    if (!id) {
      return NextResponse.json({ success: false, error: 'Lead ID is required' }, { status: 400 })
    }

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignments: {
          where: { department: LeadAssignmentDepartment.SR_CRM },
          include: { user: { select: { id: true, fullName: true, email: true } } },
        },
        visits: {
          where: { status: 'COMPLETED' },
          orderBy: { scheduledAt: 'desc' },
          take: 1,
          select: { projectSqft: true, scheduledAt: true },
        },
        quotationDrafts: {
          orderBy: { updatedAt: 'desc' },
        },
      },
    })

    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 })
    }

    // Check if an agreement draft exists
    const agreementDraft = lead.quotationDrafts.find((d) => d.draftKey === 'agreement')
    if (agreementDraft && agreementDraft.content) {
      return NextResponse.json({
        success: true,
        data: {
          ...(agreementDraft.content as object),
          id: agreementDraft.id,
          leadId: lead.id,
          clientId: lead.clientId,
          updatedAt: agreementDraft.updatedAt.toISOString(),
        },
        isSaved: true,
      })
    }

    // If not saved, find the most relevant detail quotation draft
    const detailDraft = lead.quotationDrafts.find(
      (d) => d.draftKey === 'detail' || d.draftKey.startsWith('detail:')
    )
    const detailContent = (detailDraft?.content as QuotationDraftContent | null) || null

    const srCrmUser = lead.assignments[0]?.user ?? null

    const defaultAgreement = buildDefaultAgreementData(
      {
        id: lead.id,
        clientId: lead.clientId,
        name: lead.name,
        phone: lead.phone,
        location: lead.location,
        agreementType: lead.agreementType,
        agreementValue: lead.agreementValue,
        projectSqft: lead.visits[0]?.projectSqft ?? null,
        srCrm: srCrmUser,
      },
      detailContent
    )

    return NextResponse.json({
      success: true,
      data: defaultAgreement,
      isSaved: false,
    })
  } catch (error) {
    console.error('[agreements/[id]][GET] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve agreement details' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireDatabaseRoles([])
    if (!authResult.ok) return authResult.response

    const actorDepartments = new Set(authResult.actor.userDepartments ?? [])
    const isAdmin = actorDepartments.has('ADMIN')
    const isSeniorCrm = actorDepartments.has('SR_CRM')

    if (!isAdmin && !isSeniorCrm) {
      return NextResponse.json(
        { success: false, error: 'Only Admin or Senior CRM users can modify agreements' },
        { status: 403 }
      )
    }

    const { id } = await context.params
    if (!id) {
      return NextResponse.json({ success: false, error: 'Lead ID is required' }, { status: 400 })
    }

    const body = (await request.json()) as Partial<AgreementData>
    if (!body || !body.clientName) {
      return NextResponse.json({ success: false, error: 'Invalid agreement payload' }, { status: 400 })
    }

    const lead = await prisma.lead.findUnique({
      where: { id },
      select: { id: true, clientId: true },
    })

    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 })
    }

    const grandTotal = typeof body.grandTotal === 'number' ? body.grandTotal : 0

    // Upsert into QuotationDraft with draftKey = 'agreement'
    const savedDraft = await prisma.quotationDraft.upsert({
      where: {
        leadId_draftKey: {
          leadId: lead.id,
          draftKey: 'agreement',
        },
      },
      create: {
        leadId: lead.id,
        draftKey: 'agreement',
        createdById: authResult.actorUserId,
        updatedById: authResult.actorUserId,
        quotationType: 'STANDARD',
        grandTotal,
        content: body as any,
        status: 'FINALIZED',
      },
      update: {
        updatedById: authResult.actorUserId,
        grandTotal,
        content: body as any,
        status: 'FINALIZED',
      },
    })

    // Also update lead's agreementValue and agreementType
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        agreementValue: grandTotal > 0 ? grandTotal : undefined,
        agreementType: body.agreementType || undefined,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...(savedDraft.content as object),
        id: savedDraft.id,
        leadId: lead.id,
        clientId: lead.clientId,
        updatedAt: savedDraft.updatedAt.toISOString(),
      },
      message: 'Agreement saved successfully',
    })
  } catch (error) {
    console.error('[agreements/[id]][PUT] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save agreement details' },
      { status: 500 }
    )
  }
}
