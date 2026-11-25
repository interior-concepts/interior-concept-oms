import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import {
  recalculateAdvanceAccount,
  requireAccountsOrAdmin,
} from '@/lib/advance-service'

export const runtime = 'nodejs'
export const preferredRegion = 'sin1'
export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAccountsOrAdmin()
    if (!authResult.ok) return authResult.response

    const { id } = await context.params
    const body = await request.json()
    const { type, amount, date, paymentMethod, purpose, note } = body

    const existing = await prisma.advanceTransaction.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Advance transaction not found' },
        { status: 404 },
      )
    }

    const nextType = type ?? existing.type
    if (nextType !== 'GIVEN' && nextType !== 'RETURNED') {
      return NextResponse.json(
        { success: false, error: 'Type must be GIVEN or RETURNED' },
        { status: 400 },
      )
    }

    const parsedAmount =
      amount !== undefined ? Number(amount) : existing.amount
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than 0' },
        { status: 400 },
      )
    }

    const nextPurpose =
      purpose !== undefined ? String(purpose).trim() : existing.purpose
    if (!nextPurpose) {
      return NextResponse.json(
        { success: false, error: 'Purpose / particulars is required' },
        { status: 400 },
      )
    }

    const nextDate = date ? new Date(date) : existing.date
    if (Number.isNaN(nextDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date' },
        { status: 400 },
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedTx = await tx.advanceTransaction.update({
        where: { id },
        data: {
          type: nextType,
          amount: parsedAmount,
          date: nextDate,
          paymentMethod:
            paymentMethod !== undefined
              ? paymentMethod?.trim() || null
              : existing.paymentMethod,
          purpose: nextPurpose,
          note: note !== undefined ? note?.trim() || null : existing.note,
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

      const updatedAccount = await recalculateAdvanceAccount(
        tx,
        existing.advanceAccountId,
      )

      if (updatedAccount.balance < 0) {
        throw new Error(
          'This change would make total returned exceed total given for this user',
        )
      }

      return { updatedTx, updatedAccount }
    })

    return NextResponse.json({
      success: true,
      data: result.updatedTx,
      account: result.updatedAccount,
    })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to update advance'
    const status = message.includes('exceed') ? 400 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAccountsOrAdmin()
    if (!authResult.ok) return authResult.response

    const { id } = await context.params

    const existing = await prisma.advanceTransaction.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Advance transaction not found' },
        { status: 404 },
      )
    }

    const updatedAccount = await prisma.$transaction(async (tx) => {
      await tx.advanceTransaction.delete({
        where: { id },
      })

      const recalculated = await recalculateAdvanceAccount(
        tx,
        existing.advanceAccountId,
      )

      if (recalculated.balance < 0) {
        throw new Error(
          'Cannot delete this entry because total returned would exceed total given. Delete or adjust the return entry first.',
        )
      }

      return recalculated
    })

    return NextResponse.json({
      success: true,
      account: updatedAccount,
    })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete advance'
    const status = message.includes('exceed') ? 400 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
