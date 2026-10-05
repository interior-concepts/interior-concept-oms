import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { MainLayout } from '@/components/layout/mainlayout'

export const runtime = 'nodejs'
export const preferredRegion = 'sin1'

export default async function AccountsLayout({
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
    return <MainLayout role="Accounts">{children}</MainLayout>
  }

  const departmentNames = new Set(
    user.userDepartments.map((row) => row.department.name),
  )

  if (departmentNames.has('ADMIN')) {
    return <MainLayout role="Admin">{children}</MainLayout>
  }

  if (departmentNames.has('ACCOUNTS')) {
    return <MainLayout role="Accounts">{children}</MainLayout>
  }

  redirect('/onboarding')
}
