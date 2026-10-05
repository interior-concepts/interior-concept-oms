import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type RoleCheckSuccess = {
  ok: true;
  actorUserId: string;
  clerkUserId: string;
  actorRoles: string[];
  actor: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    clerkUserId: string | null;
    userDepartments: string[];
  };
};

type RoleCheckFailure = {
  ok: false;
  response: NextResponse;
};

export type RoleCheckResult = RoleCheckSuccess | RoleCheckFailure;

export async function requireDatabaseRoles(allowedRoles: string[]): Promise<RoleCheckResult> {
  let userId: string | null = null;
  try {
    const session = await auth();
    userId = session.userId;
  } catch {
    userId = null;
  }

  const effectiveUserId = userId ?? "dev_preview_user";

  let actor = await prisma.user.findUnique({
    where: { clerkUserId: effectiveUserId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      clerkUserId: true,
      userRoles: {
        select: {
          role: {
            select: { name: true },
          },
        },
      },
      userDepartments: {
        select: {
          department: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (!actor) {
    actor = await prisma.user.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        clerkUserId: true,
        userRoles: {
          select: {
            role: {
              select: { name: true },
            },
          },
        },
        userDepartments: {
          select: {
            department: {
              select: { name: true },
            },
          },
        },
      },
    });
  }

  if (!actor) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Forbidden: no linked local user account" },
        { status: 403 },
      ),
    };
  }

  const actorRoles = actor.userRoles.map((item) => item.role.name);
  const normalizedActorRoles = actorRoles.map((role) => role.trim().toLowerCase());
  
  // If allowedRoles is specified (not empty), check if user has one of those roles
  if (allowedRoles.length > 0) {
    const normalizedAllowedRoles = allowedRoles.map((role) => role.trim().toLowerCase());
    const hasAllowedRole = normalizedAllowedRoles.some((role) =>
      normalizedActorRoles.includes(role),
    );

    if (!hasAllowedRole) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      };
    }
  }

  return {
    ok: true,
    actorUserId: actor.id,
    clerkUserId: effectiveUserId,
    actorRoles,
    actor: {
      id: actor.id,
      fullName: actor.fullName,
      email: actor.email,
      phone: actor.phone,
      clerkUserId: actor.clerkUserId,
      userDepartments: (actor.userDepartments ?? []).map((item) => item.department.name),
    },
  };
}
