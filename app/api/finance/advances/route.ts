import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { AdvanceTransactionType } from '@/generated/prisma/client'
import {
  generateAdvanceVoucherNo,
  recalculateAdvanceAccount,
  requireAccountsOrAdmin,
} from '@/lib/advance-service'

export const runtime = 'nodejs'
export const preferredRegion = 'sin1'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAccountsOrAdmin()
    if (!authResult.ok) return authResult.response

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || undefined
    const typeParam = searchParams.get('type') as AdvanceTransactionType | null
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')
    const search = searchParams.get('search')?.trim() || ''

    const txWhere: Record<string, unknown> = {}
    if (userId) txWhere.userId = userId
    if (typeParam && (typeParam === 'GIVEN' || typeParam === 'RETURNED')) {
      txWhere.type = typeParam
    }

    if (startDateStr || endDateStr) {
      const dateFilter: Record<string, Date> = {}
      if (startDateStr) dateFilter.gte = new Date(startDateStr)
      if (endDateStr) {
        const end = new Date(endDateStr)
        end.setHours(23, 59, 59, 999)
        dateFilter.lte = end
      }
      txWhere.date = dateFilter
    }

    if (search) {
      txWhere.OR = [
        { purpose: { contains: search, mode: 'insensitive' } },
        { note: { contains: search, mode: 'insensitive' } },
        { voucherNo: { contains: search, mode: 'insensitive' } },
        { paymentMethod: { contains: search, mode: 'insensitive' } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [accounts, transactions, users] = await Promise.all([
      prisma.advanceAccount.findMany({
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              userDepartments: {
                select: {
                  department: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: [{ balance: 'desc' }, { updatedAt: 'desc' }],
      }),
      prisma.advanceTransaction.findMany({
        where: txWhere,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          recordedBy: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        take: 500,
      }),
      prisma.user.findMany({
        where: { isActive: true },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          userDepartments: {
            select: {
              department: { select: { name: true } },
            },
          },
        },
        orderBy: { fullName: 'asc' },
      }),
    ])

    let totalOutstanding = 0
    let totalGiven = 0
    let totalReturned = 0
    let activeHoldersCount = 0

    for (const acc of accounts) {
      totalOutstanding += acc.balance
      totalGiven += acc.totalGiven
      totalReturned += acc.totalReturned
      if (acc.balance > 0) activeHoldersCount += 1
    }

    return NextResponse.json({
      success: true,
      data: {
        accounts,
        transactions,
        users,
        summary: {
          totalOutstanding,
          totalGiven,
          totalReturned,
          activeHoldersCount,
        },
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load advances'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAccountsOrAdmin()
    if (!authResult.ok) return authResult.response

    const body = await request.json()
    const { userId, type, amount, date, paymentMethod, purpose, note } = body

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'User is required' },
        { status: 400 },
      )
    }

    if (type !== 'GIVEN' && type !== 'RETURNED') {
      return NextResponse.json(
        { success: false, error: 'Type must be GIVEN or RETURNED' },
        { status: 400 },
      )
    }

    const parsedAmount = Number(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than 0' },
        { status: 400 },
      )
    }

    const trimmedPurpose = typeof purpose === 'string' ? purpose.trim() : ''
    if (!trimmedPurpose) {
      return NextResponse.json(
        { success: false, error: 'Purpose / particulars is required' },
        { status: 400 },
      )
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true },
    })

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'Selected user was not found' },
        { status: 404 },
      )
    }

    const txDate = date ? new Date(date) : new Date()
    if (Number.isNaN(txDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date' },
        { status: 400 },
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.advanceAccount.upsert({
        where: { userId },
        create: {
          userId,
          totalGiven: 0,
          totalReturned: 0,
          balance: 0,
        },
        update: {},
      })

      if (type === 'RETURNED' && parsedAmount > account.balance) {
        throw new Error(
          `Return amount (${parsedAmount.toLocaleString()}) exceeds ${targetUser.fullName}'s current due balance (${account.balance.toLocaleString()})`,
        )
      }

      const voucherNo = await generateAdvanceVoucherNo(tx)

      const createdTx = await tx.advanceTransaction.create({
        data: {
          advanceAccountId: account.id,
          userId,
          type,
          amount: parsedAmount,
          date: txDate,
          paymentMethod:
            typeof paymentMethod === 'string' && paymentMethod.trim()
              ? paymentMethod.trim()
              : null,
          purpose: trimmedPurpose,
          voucherNo,
          note: typeof note === 'string' && note.trim() ? note.trim() : null,
          recordedById: authResult.actor.id,
        },
        include: {
          user: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
          recordedBy: {
            select: { id: true, fullName: true },
          },
        },
      })

      const updatedAccount = await recalculateAdvanceAccount(tx, account.id)

      return { createdTx, updatedAccount }
    })

    return NextResponse.json(
      {
        success: true,
        data: result.createdTx,
        account: result.updatedAccount,
      },
      { status: 201 },
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to record advance'
    const status = message.includes('exceeds') ? 400 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
