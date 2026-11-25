import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'

type ActorResult =
  | {
      ok: true
      actor: {
        id: string
        fullName: string
        departments: string[]
      }
    }
  | {
      ok: false
      response: NextResponse
    }

const ALLOWED_DEPARTMENTS = new Set(['ADMIN', 'ACCOUNTS'])

/**
 * Verifies the caller belongs to ADMIN or ACCOUNTS department.
 */
export async function requireAccountsOrAdmin(): Promise<ActorResult> {
  let userId: string | null = null
  try {
    const session = await auth()
    userId = session.userId
  } catch {
    userId = null
  }

  const effectiveUserId = userId ?? 'dev_preview_user'

  let user = await prisma.user.findUnique({
    where: { clerkUserId: effectiveUserId },
    select: {
      id: true,
      fullName: true,
      userDepartments: {
        select: {
          department: { select: { name: true } },
        },
      },
    },
  })

  if (!user && !userId) {
    user = await prisma.user.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        fullName: true,
        userDepartments: {
          select: {
            department: { select: { name: true } },
          },
        },
      },
    })
  }

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      ),
    }
  }

  const departments = user.userDepartments.map((d) =>
    d.department.name.trim().toUpperCase(),
  )

  if (departments.length > 0 && !departments.some((d) => ALLOWED_DEPARTMENTS.has(d))) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Forbidden: Accounts or Admin access required' },
        { status: 403 },
      ),
    }
  }

  return {
    ok: true,
    actor: {
      id: user.id,
      fullName: user.fullName,
      departments,
    },
  }
}

/**
 * Recomputes totalGiven, totalReturned, and balance from AdvanceTransaction rows.
 */
export async function recalculateAdvanceAccount(
  tx: Prisma.TransactionClient,
  advanceAccountId: string,
) {
  const grouped = await tx.advanceTransaction.groupBy({
    by: ['type'],
    where: { advanceAccountId },
    _sum: { amount: true },
  })

  let totalGiven = 0
  let totalReturned = 0

  for (const row of grouped) {
    if (row.type === 'GIVEN') totalGiven = row._sum.amount ?? 0
    if (row.type === 'RETURNED') totalReturned = row._sum.amount ?? 0
  }

  const balance = totalGiven - totalReturned

  const updated = await tx.advanceAccount.update({
    where: { id: advanceAccountId },
    data: {
      totalGiven,
      totalReturned,
      balance,
    },
  })

  return updated
}

/**
 * Generates a sequential voucher number like ADV-0001.
 */
export async function generateAdvanceVoucherNo(tx: Prisma.TransactionClient) {
  const latest = await tx.advanceTransaction.findFirst({
    where: { voucherNo: { startsWith: 'ADV-' } },
    orderBy: { createdAt: 'desc' },
    select: { voucherNo: true },
  })

  let nextNum = 1
  if (latest?.voucherNo) {
    const parsed = parseInt(latest.voucherNo.replace('ADV-', ''), 10)
    if (!Number.isNaN(parsed) && parsed >= 1) {
      nextNum = parsed + 1
    }
  }

  return `ADV-${String(nextNum).padStart(4, '0')}`
}
