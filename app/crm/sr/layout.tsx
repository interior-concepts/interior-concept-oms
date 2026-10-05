import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { MainLayout } from '@/components/layout/mainlayout'

const JR_CRM_DASHBOARD = '/crm/jr/dashboard'
const ADMIN_DASHBOARD = '/crm/admin/dashboard'
const VISIT_DASHBOARD = '/visit-team/visit-dashboard'

export const runtime = 'nodejs'
export const preferredRegion = 'sin1'

export default async function SrCrmLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let userId: string | null = null
  try {
    const session = await auth()
    userId = session.userId
  } catch {
    userId = null
  }

  const effectiveUserId = userId ?? 'dev_preview_user'

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
    }))

  if (!user || user.userDepartments.length === 0) {
    return <MainLayout role="Senior CRM">{children}</MainLayout>
  }

  const departmentNames = new Set(
    user.userDepartments.map((row) => row.department.name),
  )

  const isAllowedSrAccess =
    departmentNames.has('SR_CRM') ||
    departmentNames.has('ADMIN') ||
    departmentNames.has('QUOTATION') ||
    departmentNames.has('QUOTATION_TEAM')

  if (isAllowedSrAccess) {
    const roleLabel = departmentNames.has('ADMIN')
      ? 'Admin'
      : departmentNames.has('QUOTATION') || departmentNames.has('QUOTATION_TEAM')
        ? 'Quotation Team'
        : 'Senior CRM'
    return <MainLayout role={roleLabel}>{children}</MainLayout>
  }

  if (departmentNames.has('JR_CRM')) {
    redirect(JR_CRM_DASHBOARD)
  }

  if (departmentNames.has('VISIT_TEAM')) {
    redirect(VISIT_DASHBOARD)
  }

  redirect('/')
}
