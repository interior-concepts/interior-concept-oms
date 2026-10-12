import prisma from '@/lib/prisma';
import { ActivityType, FollowUpCategory, FollowUpStatus, LeadAssignmentDepartment, Prisma } from '@/generated/prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ensureDepartmentAssignment, ensureSeniorCrmAssignment } from '@/lib/lead-handoff';

type RouteContext = { params: { leadId: string; id: string } | Promise<{ leadId: string; id: string }> };
const completedFollowUpStatuses: FollowUpStatus[] = [FollowUpStatus.DONE, FollowUpStatus.LATELY_DONE];

async function resolveParams(context: RouteContext): Promise<{ leadId: string | null; id: string | null }> {
  const resolvedParams = await context.params;
  const leadId = resolvedParams?.leadId?.trim() || null;
  const id = resolvedParams?.id?.trim() || null;
  
  return {
    leadId: leadId && leadId.length > 0 ? leadId : null,
    id: id && id.length > 0 ? id : null,
  };
}

async function resolveActivityUserId(requestedUserId: unknown): Promise<string | null> {
  const normalizedRequested = typeof requestedUserId === 'string' ? requestedUserId.trim() : ''

  if (normalizedRequested) {
    const requestedMatch = await prisma.user.findFirst({
      where: {
        OR: [{ id: normalizedRequested }, { clerkUserId: normalizedRequested }],
      },
      select: { id: true },
    })

    if (requestedMatch?.id) {
      return requestedMatch.id
    }
  }

  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return null

  const authenticatedUser = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true },
  })

  return authenticatedUser?.id ?? null
}

// GET /api/followup/[leadId]/[id] - Get a single follow-up by ID
export async function GET(_request: NextRequest, context: RouteContext) {
  const { leadId, id } = await resolveParams(context);
  if (!id || !leadId) {
    return NextResponse.json({ success: false, error: 'Invalid lead id or follow-up id' }, { status: 400 });
  }

  try {
    const followUp = await prisma.followUp.findUnique({
      where: { id },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            location: true,
            assignments: {
              select: {
                id: true,
                department: true,
                user: { select: { id: true, fullName: true, email: true } },
              },
            },
          },
        },
        assignedTo: {
          select: {
            id: true,
            fullName: true,
            email: true,
            userDepartments: {
              select: { department: { select: { name: true } } },
            },
          },
        },
      },
    });

    if (!followUp) {
      return NextResponse.json(
        { success: false, error: 'Follow-up not found' },
        { status: 404 }
      );
    }

    if (followUp.leadId !== leadId) {
      return NextResponse.json(
        { success: false, error: 'Follow-up does not belong to the specified lead' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: followUp });
  } catch (error: unknown) {
    console.error('Error fetching follow-up:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch follow-up', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper to handle next connected follow-up creation inside transaction
async function handleNextConnectedFollowUp(
  tx: Prisma.TransactionClient,
  leadId: string,
  actorUserId: string | null,
  nextData: {
    followupDate?: string;
    notes?: string;
    category?: FollowUpCategory;
    targetDepartment?: string;
    targetCrmRole?: string;
    assignedToId?: string;
  }
) {
  if (!nextData.followupDate) return null;
  const parsedDate = new Date(nextData.followupDate);
  if (Number.isNaN(parsedDate.getTime())) return null;

  let targetUserId = nextData.assignedToId?.trim() || null;
  const targetDept = (nextData.targetDepartment || nextData.targetCrmRole)?.trim().toUpperCase();

  // Fetch current lead assignments
  const leadAssignments = await tx.leadAssignment.findMany({
    where: { leadId },
    select: { department: true, userId: true },
  });

  if (!targetUserId && targetDept && targetDept !== 'SELF') {
    const existingAssignment = leadAssignments.find((a) => a.department === targetDept);
    if (existingAssignment) {
      targetUserId = existingAssignment.userId;
    } else if (Object.values(LeadAssignmentDepartment).includes(targetDept as LeadAssignmentDepartment)) {
      const autoAssignment = await ensureDepartmentAssignment({
        tx,
        leadId,
        department: targetDept as LeadAssignmentDepartment,
        actorUserId,
      });
      targetUserId = autoAssignment.userId;
    }
  }

  if (!targetUserId) {
    targetUserId = actorUserId;
  }

  if (!targetUserId) return null;

  const newFollowUp = await tx.followUp.create({
    data: {
      leadId,
      assignedToId: targetUserId,
      followupDate: parsedDate,
      notes: nextData.notes?.trim() || undefined,
      category: nextData.category || FollowUpCategory.GENERAL,
    },
    include: {
      assignedTo: {
        select: { id: true, fullName: true, email: true },
      },
    },
  });

  const roleLabel = nextData.targetCrmRole === 'SR_CRM' ? 'Senior CRM' : nextData.targetCrmRole === 'JR_CRM' ? 'Junior CRM' : 'CRM';
  await tx.activityLog.create({
    data: {
      leadId,
      userId: actorUserId || targetUserId,
      type: ActivityType.FOLLOWUP_SET,
      description: `Next action connected to ${roleLabel} (${newFollowUp.assignedTo.fullName}) for ${parsedDate.toLocaleDateString()}`,
    },
  });

  return newFollowUp;
}

// PUT /api/followup/[leadId]/[id] - Update a follow-up
export async function PUT(request: NextRequest, context: RouteContext) {
  const { leadId, id } = await resolveParams(context);
  if (!id || !leadId) {
    return NextResponse.json({ success: false, error: 'Invalid lead id or follow-up id' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const {
      assignedToId,
      followupDate,
      status,
      notes,
      userId,
      nextFollowUp,
    } = body;
    const activityUserId = await resolveActivityUserId(userId);

    const existingFollowUp = await prisma.followUp.findUnique({ where: { id } });
    if (!existingFollowUp) {
      return NextResponse.json(
        { success: false, error: 'Follow-up not found' },
        { status: 404 }
      );
    }

    if (existingFollowUp.leadId !== leadId) {
      return NextResponse.json(
        { success: false, error: 'Follow-up does not belong to the specified lead' },
        { status: 403 }
      );
    }

    if (assignedToId) {
      const user = await prisma.user.findUnique({ where: { id: assignedToId } });
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Assigned user not found' },
          { status: 404 }
        );
      }
    }

    let createdNext: unknown = null;

    const followUp = await prisma.$transaction(async (tx) => {
      const updatedFollowUp = await tx.followUp.update({
        where: { id },
        data: {
          ...(assignedToId !== undefined ? { assignedToId } : {}),
          ...(followupDate !== undefined ? { followupDate: new Date(followupDate) } : {}),
          ...(status !== undefined ? { status: status as FollowUpStatus } : {}),
          ...(notes !== undefined ? { notes } : {}),
        },
        include: {
          lead: {
            select: { id: true, name: true, email: true },
          },
          assignedTo: {
            select: { id: true, fullName: true, email: true },
          },
        },
      });

      if (
        status !== undefined &&
        completedFollowUpStatuses.includes(status as FollowUpStatus) &&
        !completedFollowUpStatuses.includes(existingFollowUp.status) &&
        activityUserId
      ) {
        await tx.activityLog.create({
          data: {
            leadId: existingFollowUp.leadId,
            userId: activityUserId,
            type: ActivityType.FOLLOWUP_COMPLETED,
            description: `Follow-up marked as ${(status as FollowUpStatus).toLowerCase()}: ${notes || 'Completed'}`,
          },
        });
      }

      if (nextFollowUp && typeof nextFollowUp === 'object') {
        createdNext = await handleNextConnectedFollowUp(tx, leadId, activityUserId, nextFollowUp);
      }

      return updatedFollowUp;
    });

    return NextResponse.json({
      success: true,
      data: followUp,
      nextFollowUp: createdNext,
      message: 'Follow-up updated successfully',
    });
  } catch (error: unknown) {
    console.error('Error updating follow-up:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update follow-up', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PATCH /api/followup/[leadId]/[id] - Partial update a follow-up
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { leadId, id } = await resolveParams(context);
  if (!id || !leadId) {
    return NextResponse.json({ success: false, error: 'Invalid lead id or follow-up id' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const activityUserId = await resolveActivityUserId(body.userId);

    const existingFollowUp = await prisma.followUp.findUnique({ where: { id } });
    if (!existingFollowUp) {
      return NextResponse.json(
        { success: false, error: 'Follow-up not found' },
        { status: 404 }
      );
    }

    if (existingFollowUp.leadId !== leadId) {
      return NextResponse.json(
        { success: false, error: 'Follow-up does not belong to the specified lead' },
        { status: 403 }
      );
    }

    const updateData: Prisma.FollowUpUncheckedUpdateInput = {};
    if (body.assignedToId !== undefined) updateData.assignedToId = body.assignedToId;
    if (body.followupDate !== undefined) updateData.followupDate = new Date(body.followupDate);
    if (body.status !== undefined) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;

    let createdNext: unknown = null;

    const followUp = await prisma.$transaction(async (tx) => {
      const updatedFollowUp = await tx.followUp.update({
        where: { id },
        data: updateData,
        include: {
          lead: {
            select: { id: true, name: true, email: true },
          },
          assignedTo: {
            select: { id: true, fullName: true, email: true },
          },
        },
      });

      const nextStatus = body.status as FollowUpStatus | undefined;
      if (
        nextStatus !== undefined &&
        completedFollowUpStatuses.includes(nextStatus) &&
        !completedFollowUpStatuses.includes(existingFollowUp.status) &&
        activityUserId
      ) {
        await tx.activityLog.create({
          data: {
            leadId: existingFollowUp.leadId,
            userId: activityUserId,
            type: ActivityType.FOLLOWUP_COMPLETED,
            description: `Follow-up marked as ${nextStatus.toLowerCase()}: ${body.notes || 'Completed'}`,
          },
        });
      }

      if (body.nextFollowUp && typeof body.nextFollowUp === 'object') {
        createdNext = await handleNextConnectedFollowUp(tx, leadId, activityUserId, body.nextFollowUp);
      }

      return updatedFollowUp;
    });

    return NextResponse.json({
      success: true,
      data: followUp,
      nextFollowUp: createdNext,
      message: 'Follow-up updated successfully',
    });
  } catch (error: unknown) {
    console.error('Error updating follow-up:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update follow-up', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/followup/[leadId]/[id] - Delete a follow-up
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { leadId, id } = await resolveParams(context);
  if (!id || !leadId) {
    return NextResponse.json({ success: false, error: 'Invalid lead id or follow-up id' }, { status: 400 });
  }

  try {
    const existingFollowUp = await prisma.followUp.findUnique({ where: { id } });
    if (!existingFollowUp) {
      return NextResponse.json(
        { success: false, error: 'Follow-up not found' },
        { status: 404 }
      );
    }

    if (existingFollowUp.leadId !== leadId) {
      return NextResponse.json(
        { success: false, error: 'Follow-up does not belong to the specified lead' },
        { status: 403 }
      );
    }

    await prisma.followUp.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Follow-up deleted successfully',
    });
  } catch (error: unknown) {
    console.error('Error deleting follow-up:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete follow-up', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
