import { NextRequest, NextResponse } from "next/server";
import {
  ActivityType,
  LeadAssignmentDepartment,
  LeadPhaseTaskStatus,
  LeadPhaseType,
  LeadStage,
  LeadSubStatus,
  NotificationType,
  QuotationDraftStatus,
} from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { requireDatabaseRoles } from "@/lib/authz";
import {
  logActivity,
  logLeadSubStatusChanged,
} from "@/lib/activity-log-service";
import { ensureSeniorCrmAssignment } from "@/lib/lead-handoff";
import { sendPushToUser } from "@/lib/fcm-service";
import { recalculateQuotationUserPerformance } from "@/lib/quotation-performance";

export const runtime = "nodejs";
export const preferredRegion = "sin1";

type RouteContext = { params: { id: string } | Promise<{ id: string }> };

type InstantApproveBody = {
  note?: unknown;
  budget?: unknown;
  quotationType?: unknown;
};

async function resolveLeadId(context: RouteContext): Promise<string | null> {
  const resolvedParams = await context.params;
  const id = resolvedParams?.id;
  if (typeof id !== "string") return null;
  const trimmed = id.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toOptionalNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.trim().replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireDatabaseRoles([]);
    if (!authResult.ok) return authResult.response;

    const leadId = await resolveLeadId(context);
    if (!leadId) {
      return NextResponse.json(
        { success: false, error: "Invalid lead id" },
        { status: 400 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as InstantApproveBody;
    const note = toOptionalString(body.note);
    const budget = toOptionalNumber(body.budget);
    const quotationType = toOptionalString(body.quotationType);

    const actorDepartments = new Set(authResult.actor.userDepartments ?? []);
    const isAdmin =
      actorDepartments.has("ADMIN") ||
      authResult.actorRoles.some((r) => r.toUpperCase() === "ADMIN");
    const isSeniorCrm =
      actorDepartments.has("SR_CRM") ||
      authResult.actorRoles.some((r) => r.toUpperCase() === "SR_CRM");
    const isQuotation =
      actorDepartments.has("QUOTATION") ||
      actorDepartments.has("QUOTATION_TEAM") ||
      authResult.actorRoles.some(
        (r) =>
          r.toUpperCase() === "QUOTATION" ||
          r.toUpperCase() === "QUOTATION_TEAM",
      );

    if (!isAdmin && !isSeniorCrm && !isQuotation) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only Admin, Senior CRM, or Quotation Team members can approve instant quotations.",
        },
        { status: 403 },
      );
    }

    // Load lead to check permissions and state
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        assignments: {
          select: { userId: true, department: true },
        },
        quotationDrafts: {
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 },
      );
    }

    // If quotation team member is attempting to approve, verify it is an instant quotation
    const isInstant =
      lead.isInstantQuotation ||
      lead.source === "Quotation Team" ||
      lead.remarks?.toLowerCase().includes("instant");

    if (isQuotation && !isAdmin && !isSeniorCrm && !isInstant) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Standard quotations must be submitted to Senior CRM Review Center. Only instant quotations can be approved directly.",
        },
        { status: 403 },
      );
    }

    // Execute atomic transaction to approve quotation and move to Budget Queue
    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();

      // Ensure Senior CRM assignment exists
      const srAssignment = await ensureSeniorCrmAssignment({
        tx,
        leadId: lead.id,
        actorUserId: authResult.actorUserId,
      });

      // Update QuotationDraft status to FINALIZED if draft exists
      if (lead.quotationDrafts.length > 0) {
        await tx.quotationDraft.update({
          where: { id: lead.quotationDrafts[0].id },
          data: {
            status: QuotationDraftStatus.FINALIZED,
          },
        });
      }

      // Mark any open Quotation phase tasks as COMPLETED
      await tx.leadPhaseTask.updateMany({
        where: {
          leadId: lead.id,
          phaseType: LeadPhaseType.QUOTATION,
          status: {
            in: [LeadPhaseTaskStatus.OPEN, LeadPhaseTaskStatus.IN_REVIEW],
          },
        },
        data: {
          status: LeadPhaseTaskStatus.COMPLETED,
          updatedAt: now,
        },
      });

      // Update lead to QUOTATION_APPROVED and ensure isInstantQuotation is true
      const updatedLead = await tx.lead.update({
        where: { id: lead.id },
        data: {
          stage: LeadStage.QUOTATION_PHASE,
          subStatus: LeadSubStatus.QUOTATION_APPROVED,
          isInstantQuotation: true,
          ...(budget !== null ? { budget } : {}),
          ...(quotationType ? { quotationType } : {}),
        },
        select: {
          id: true,
          name: true,
          stage: true,
          subStatus: true,
          budget: true,
          isInstantQuotation: true,
        },
      });

      // Record stage/status history
      await tx.leadStatusHistory.create({
        data: {
          leadId: lead.id,
          oldStatus: lead.stage,
          newStatus: LeadStage.QUOTATION_PHASE,
          changedById: authResult.actorUserId,
        },
      });

      // Log subStatus change
      const actorRoleName = isAdmin
        ? "Admin"
        : isSeniorCrm
          ? "Senior CRM"
          : "Quotation Team";
      await logLeadSubStatusChanged(tx, {
        leadId: lead.id,
        userId: authResult.actorUserId,
        from: lead.subStatus,
        to: LeadSubStatus.QUOTATION_APPROVED,
        reason: `Instant quotation approved by ${actorRoleName}. Direct approval bypassing Review Center; moved to Budget Queue for Agreement.`,
      });

      // Log activity
      await logActivity(tx, {
        leadId: lead.id,
        userId: authResult.actorUserId,
        type: ActivityType.STATUS_CHANGE,
        description: note
          ? `Instant quotation approved by ${actorRoleName} and moved to Budget Queue. Note: ${note}`
          : `Instant quotation approved by ${actorRoleName} and moved to Budget Queue. Ready for Agreement.`,
      });

      // Create notifications for assigned Senior CRM and Admin
      const adminUsers = await tx.user.findMany({
        where: {
          isActive: true,
          userDepartments: { some: { department: { name: "ADMIN" } } },
        },
        select: { id: true },
      });

      const notifyUserIds = Array.from(
        new Set([
          ...lead.assignments
            .filter(
              (assignment) =>
                assignment.department === LeadAssignmentDepartment.SR_CRM,
            )
            .map((assignment) => assignment.userId),
          ...(srAssignment.userId ? [srAssignment.userId] : []),
          ...adminUsers.map((user) => user.id),
        ]),
      ).filter((userId) => userId !== authResult.actorUserId);

      if (notifyUserIds.length > 0) {
        await tx.notification.createMany({
          data: notifyUserIds.map((userId) => ({
            userId,
            leadId: lead.id,
            type: NotificationType.LEAD_ASSIGNED_TO_YOU,
            title: "Instant Quotation Approved",
            message: `${lead.name} instant quotation was approved and is ready for Agreement in Budget Queue.`,
          })),
        });
      }

      return {
        updatedLead,
        notifyUserIds,
      };
    });

    // Send push notifications async
    for (const userId of result.notifyUserIds) {
      void sendPushToUser(
        userId,
        "Instant Quotation Approved",
        `${lead.name} instant quotation is ready in Budget Queue for Agreement`,
        { url: "/crm/admin/budget-queue" },
      ).catch(() => undefined);
    }

    // Recalculate quotation performance for actor if applicable
    if (isQuotation) {
      void recalculateQuotationUserPerformance(authResult.actorUserId).catch(
        () => undefined,
      );
    }

    return NextResponse.json({
      success: true,
      message: "Instant quotation approved and moved to Budget Queue.",
      data: result.updatedLead,
      budgetQueueUrl: isAdmin
        ? "/crm/admin/budget-queue"
        : isSeniorCrm
          ? "/crm/sr/budget-queue"
          : "/quotation-team/assigned-task",
    });
  } catch (error) {
    console.error("[quotation-instant-approve] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to approve instant quotation",
      },
      { status: 500 },
    );
  }
}
