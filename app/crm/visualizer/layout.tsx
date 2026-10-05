import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { MainLayout } from "@/components/layout/mainlayout";

const VISIT_DASHBOARD = "/visit-team/visit-dashboard";
const SR_CRM_DASHBOARD = "/crm/sr/dashboard";
const JR_CRM_DASHBOARD = "/crm/jr/dashboard";

export const runtime = "nodejs";
export const preferredRegion = "sin1";

export default async function JrArchitectureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userId: string | null = null;
  try {
    const session = await auth();
    userId = session.userId;
  } catch {
    userId = null;
  }

  const effectiveUserId = userId ?? "dev_preview_user";

  const user =
    (await prisma.user.findUnique({
      where: { clerkUserId: effectiveUserId },
      select: {
        id: true,
        userDepartments: {
          select: {
            department: {
              select: { name: true },
            },
          },
        },
      },
    })) ??
    (await prisma.user.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        userDepartments: {
          select: {
            department: {
              select: { name: true },
            },
          },
        },
      },
    }));

  if (!user || user.userDepartments.length === 0) {
    return <MainLayout role="3D Visualizer">{children}</MainLayout>;
  }

  const departmentNames = new Set(
    user.userDepartments.map((row) => row.department.name),
  );

  if (departmentNames.has("VISUALIZER_3D") || departmentNames.has("3D_VISUALIZER")) {
    return <MainLayout role="3D Visualizer">{children}</MainLayout>;
  }

  if (departmentNames.has("VISIT_TEAM")) {
    redirect(VISIT_DASHBOARD);
  }

  if (departmentNames.has("SR_CRM")) {
    redirect(SR_CRM_DASHBOARD);
  }

  if (departmentNames.has("JR_CRM")) {
    redirect(JR_CRM_DASHBOARD);
  }

  redirect("/");
}
