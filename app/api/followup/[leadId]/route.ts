import prisma from '@/lib/prisma';
import {
  ActivityType,
  LeadSubStatus,
  FollowUpCategory,
  ClientSentiment,
  ClientObjection,
  FollowUpStatus,
  LeadAssignmentDepartment,
} from '@/generated/prisma/client';
import { isSubStatusAllowedForStage } from '@/lib/lead-stage';
import { logActivity, logLeadSubStatusChanged } from '@/lib/activity-log-service';
import { NextRequest, NextResponse } from 'next/server';
import { autoCompletePendingFollowups } from '@/lib/followup-auto-complete';
import { requireDatabaseRoles } from '@/lib/authz';
import { canManagePaymentStatus, ensureSeniorCrmAssignment, ensureDepartmentAssignment } from '@/lib/lead-handoff';
import { buildScopedLeadWhere } from '@/lib/lead-access';

type RouteContext = { params: { leadId: string } | Promise<{ leadId: string }> };

async function resolveLeadId(context: RouteContext): Promise<string | null> {
  const resolvedParams = await context.params;
  const leadId = resolvedParams?.leadId?.trim() || null;
  return leadId && leadId.length > 0 ? leadId : null;
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toDate(value: unknown): Date | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toLeadSubStatus(value: unknown): LeadSubStatus | undefined | 'invalid' {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') return 'invalid';
  const normalized = value.trim().toUpperCase();
  return Object.values(LeadSubStatus).includes(normalized as LeadSubStatus)
    ? (normalized as LeadSubStatus)
    : 'invalid';
}

function toCategory(value: unknown): FollowUpCategory {
  if (typeof value === 'string' && Object.values(FollowUpCategory).includes(value as FollowUpCategory)) {
    return value as FollowUpCategory;
  }
  return FollowUpCategory.GENERAL;
}

function toSentiment(value: unknown): ClientSentiment | undefined {
  if (typeof value === 'string' && Object.values(ClientSentiment).includes(value as ClientSentiment)) {
    return value as ClientSentiment;
  }
  return undefined;
}

function toObjection(value: unknown): ClientObjection | undefined {
  if (typeof value === 'string' && Object.values(ClientObjection).includes(value as ClientObjection)) {
    return value as ClientObjection;
  }
  return undefined;
}

// GET /api/followup/[leadId] - Get all connected follow-ups for a specific lead
export async function GET(_request: NextRequest, context: RouteContext) {
  const leadId = await resolveLeadId(context);
  if (!leadId) {
    return NextResponse.json({ success: false, error: 'Invalid lead id' }, { status: 400 });
  }

  try {
    // Verify that the lead exists with its CRM assignments
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        assignments: {
          select: {
            id: true,
            department: true,
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    const jrAssignment = lead.assignments.find((a) => a.department === LeadAssignmentDepartment.JR_CRM);
    const srAssignment = lead.assignments.find((a) => a.department === LeadAssignmentDepartment.SR_CRM);

    // Fetch all follow-ups for this lead in chronological order
    const followUps = await prisma.followUp.findMany({
      where: { leadId },
      include: {
        assignedTo: {
          select: {
            id: true,
            fullName: true,
            email: true,
            userDepartments: {
              select: {
                department: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { followupDate: 'asc' },
    });

    // Annotate follow-ups with connected step, CRM role, and department role
    const totalCount = followUps.length;
    const enrichedFollowUps = followUps.map((f, index) => {
      const assignedDeptNames = (f.assignedTo.userDepartments ?? []).map((ud) => ud.department?.name).filter(Boolean) as string[];
      const isJrCrm = assignedDeptNames.includes('JR_CRM') || f.assignedToId === jrAssignment?.user.id;
      const isSrCrm = assignedDeptNames.includes('SR_CRM') || f.assignedToId === srAssignment?.user.id;

      const leadMatch = lead.assignments.find((a) => a.user.id === f.assignedToId);
      const departmentRole = leadMatch?.department || (assignedDeptNames.length > 0 ? assignedDeptNames[0] : null) || (isSrCrm ? 'SR_CRM' : isJrCrm ? 'JR_CRM' : 'GENERAL');

      const crmRole: 'JR_CRM' | 'SR_CRM' | 'GENERAL' = isSrCrm
        ? 'SR_CRM'
        : isJrCrm
          ? 'JR_CRM'
          : 'GENERAL';

      return {
        ...f,
        crmRole,
        departmentRole,
        stepNumber: index + 1,
        totalSteps: totalCount,
        isLatest: index === totalCount - 1,
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedFollowUps,
      count: totalCount,
      lead: {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        location: lead.location,
        stage: lead.stage,
        subStatus: lead.subStatus,
        sentiment: lead.sentiment,
        objection: lead.objection,
        objectionNote: lead.objectionNote,
        lastContactedAt: lead.lastContactedAt,
        assignments: lead.assignments,
        assignedJrCrm: jrAssignment?.user ?? null,
        assignedSrCrm: srAssignment?.user ?? null,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching follow-ups for lead:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to fetch follow-ups', message },
      { status: 500 }
    );
  }
}

// POST /api/followup/[leadId] - Create a connected follow-up for a lead
export async function POST(request: NextRequest, context: RouteContext) {
  const leadId = await resolveLeadId(context);
  if (!leadId) {
    return NextResponse.json({ success: false, error: 'Invalid lead id' }, { status: 400 });
  }

  try {
    const authResult = await requireDatabaseRoles([]);
    if (!authResult.ok) {
      return authResult.response;
    }

    const body = await request.json();
    let assignedToId = toNonEmptyString(body.assignedToId);
    const targetDepartment = toNonEmptyString(body.targetDepartment || body.targetCrmRole)?.toUpperCase();
    const previousFollowUpId = toNonEmptyString(body.previousFollowUpId);
    const completionNotes = toNonEmptyString(body.completionNotes);

    const followupDate = toDate(body.followupDate);
    const notes = typeof body.notes === 'string' ? body.notes : undefined;
    const userId = authResult.actorUserId ?? toNonEmptyString(body.userId);
    const requestedSubStatus = toLeadSubStatus(body.subStatus);

    const category = toCategory(body.category);
    const sentiment = toSentiment(body.sentiment);
    const objection = toObjection(body.objection);
    const objectionNote = typeof body.objectionNote === 'string' ? body.objectionNote : undefined;

    // Check if lead exists
    const scopedWhere = buildScopedLeadWhere({
      leadId,
      actorUserId: authResult.actorUserId,
      actorDepartments: authResult.actor.userDepartments ?? [],
    });

    const lead = await prisma.lead.findFirst({
      where: scopedWhere,
      select: {
        id: true,
        stage: true,
        subStatus: true,
        assignments: {
          select: {
            id: true,
            department: true,
            userId: true,
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    if (
      requestedSubStatus !== undefined &&
      requestedSubStatus !== 'invalid' &&
      !isSubStatusAllowedForStage(lead.stage, requestedSubStatus)
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid subStatus for selected stage' },
        { status: 400 }
      );
    }
    if (
      requestedSubStatus !== undefined &&
      requestedSubStatus !== 'invalid' &&
      !canManagePaymentStatus({
        actorDepartments: authResult.actor.userDepartments ?? [],
        nextSubStatus: requestedSubStatus,
      })
    ) {
      return NextResponse.json(
        { success: false, error: 'Only Senior CRM, Accounts, or Admin can update payment statuses' },
        { status: 403 },
      );
    }

    if (!followupDate) {
      return NextResponse.json(
        { success: false, error: 'Follow-up date and time are required' },
        { status: 400 }
      );
    }

    // Resolve assigned user if targetDepartment specified
    if (!assignedToId && targetDepartment) {
      if (targetDepartment === 'SELF') {
        assignedToId = authResult.actorUserId;
      } else {
        const existingAssignment = lead.assignments.find((a) => a.department === targetDepartment);
        if (existingAssignment) {
          assignedToId = existingAssignment.userId;
        }
      }
    }

    // Fallback to current actor if still not set and no target department specified
    if (!assignedToId && (!targetDepartment || targetDepartment === 'SELF')) {
      assignedToId = authResult.actorUserId;
    }

    // Execute creation in transaction
    const followUp = await prisma.$transaction(async (tx) => {
      // If targetDepartment is specified (and not SELF) and no user assigned yet, ensure department assignment
      if (!assignedToId && targetDepartment && targetDepartment !== 'SELF') {
        if (Object.values(LeadAssignmentDepartment).includes(targetDepartment as LeadAssignmentDepartment)) {
          const autoDept = await ensureDepartmentAssignment({
            tx,
            leadId,
            department: targetDepartment as LeadAssignmentDepartment,
            actorUserId: userId,
          });
          if (autoDept.userId) {
            assignedToId = autoDept.userId;
          }
        }
      }

      // Ultimate fallback if department has no member configured yet
      if (!assignedToId) {
        assignedToId = authResult.actorUserId;
      }

      // If completing a specific previous follow-up
      if (previousFollowUpId) {
        const prev = await tx.followUp.findUnique({ where: { id: previousFollowUpId } });
        if (prev && prev.leadId === leadId && prev.status === FollowUpStatus.PENDING) {
          const isLate = prev.followupDate < new Date();
          await tx.followUp.update({
            where: { id: previousFollowUpId },
            data: {
              status: isLate ? FollowUpStatus.LATELY_DONE : FollowUpStatus.DONE,
              notes: completionNotes ? `${prev.notes ? `${prev.notes} | ` : ''}Outcome: ${completionNotes}` : prev.notes,
            },
          });
        }
      } else {
        // Complete older pending followups
        await autoCompletePendingFollowups(tx, {
          leadId,
          userId,
          action: 'connected next follow-up scheduled',
        });
      }

      const newFollowUp = await tx.followUp.create({
        data: {
          leadId,
          assignedToId: assignedToId!,
          followupDate,
          notes,
          category,
          sentiment,
          objection,
        },
        include: {
          lead: {
            select: { id: true, name: true, email: true },
          },
          assignedTo: {
            select: {
              id: true,
              fullName: true,
              email: true,
              userDepartments: {
                select: {
                  department: { select: { name: true } },
                },
              },
            },
          },
        },
      });

      // Update lead sentiment, objection, lastContactedAt, and subStatus
      const leadUpdateData: Record<string, unknown> = {
        lastContactedAt: new Date(),
      };
      if (sentiment) leadUpdateData.sentiment = sentiment;
      if (objection) leadUpdateData.objection = objection;
      if (objectionNote !== undefined) leadUpdateData.objectionNote = objectionNote;
      if (requestedSubStatus !== undefined && requestedSubStatus !== 'invalid' && requestedSubStatus !== lead.subStatus) {
        leadUpdateData.subStatus = requestedSubStatus;
      }

      await tx.lead.update({
        where: { id: leadId },
        data: leadUpdateData,
      });

      if (requestedSubStatus !== undefined && requestedSubStatus !== 'invalid' && requestedSubStatus !== lead.subStatus) {
        await logLeadSubStatusChanged(tx, {
          leadId,
          userId,
          from: lead.subStatus,
          to: requestedSubStatus,
        });
      }

      const deptLabel = targetDepartment
        ? targetDepartment.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : 'CRM';
      await logActivity(tx, {
        leadId,
        userId,
        type: ActivityType.FOLLOWUP_SET,
        description: `Connected follow-up scheduled for ${deptLabel} (${newFollowUp.assignedTo.fullName}) on ${followupDate.toLocaleDateString()}`,
      });

      return newFollowUp;
    });

    return NextResponse.json(
      { success: true, data: followUp, message: 'Connected follow-up created successfully' },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error creating follow-up:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to create follow-up', message },
      { status: 500 }
    );
  }
}
