import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { VendorStatus } from "@/generated/prisma/client"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await request.json()

    const {
      vendorName,
      vendorCompanyName,
      status,
      vendorType,
      bankName,
      bankBranch,
      accountName,
      routingNumber,
      accountNumber,
      bankAccounts,
      primaryEmail,
      primaryPhone,
      primaryPhones,
      billingAddress,
      billingAddresses,
    } = body

    const hasPhonesUpdate = primaryPhones !== undefined || primaryPhone !== undefined
    const normalizedPhones = Array.isArray(primaryPhones)
      ? primaryPhones.map((v: unknown) => (typeof v === "string" ? v.trim() : "")).filter(Boolean)
      : typeof primaryPhone === "string" && primaryPhone.trim()
        ? [primaryPhone.trim()]
        : []

    const hasAddressesUpdate = billingAddresses !== undefined || billingAddress !== undefined
    const normalizedAddresses = Array.isArray(billingAddresses)
      ? billingAddresses.map((v: unknown) => (typeof v === "string" ? v.trim() : "")).filter(Boolean)
      : typeof billingAddress === "string" && billingAddress.trim()
        ? [billingAddress.trim()]
        : []

    const hasBankAccountsArray = Array.isArray(bankAccounts)
    const normalizedBanks = hasBankAccountsArray
      ? bankAccounts
          .map((b: any) => ({
            bankName: typeof b?.bankName === "string" ? b.bankName.trim() || null : null,
            bankBranch: typeof b?.bankBranch === "string" ? b.bankBranch.trim() || null : null,
            accountName: typeof b?.accountName === "string" ? b.accountName.trim() || null : null,
            routingNumber: typeof b?.routingNumber === "string" ? b.routingNumber.trim() || null : null,
            accountNumber: typeof b?.accountNumber === "string" ? b.accountNumber.trim() || null : null,
          }))
          .filter((b: any) => b.bankName || b.bankBranch || b.accountName || b.routingNumber || b.accountNumber)
          .map((b: any, idx: number) => ({ ...b, isPrimary: idx === 0 }))
      : null

    const primaryBank = normalizedBanks?.[0]

    const updated = await prisma.$transaction(async (tx) => {
      if (normalizedBanks !== null) {
        await tx.vendorBankAccount.deleteMany({ where: { vendorId: id } })
      }

      return tx.vendor.update({
        where: { id },
        data: {
          ...(vendorName !== undefined && { vendorName: vendorName.trim() }),
          ...(vendorCompanyName !== undefined && { vendorCompanyName: vendorCompanyName?.trim() || null }),
          ...(status !== undefined && { status: status as VendorStatus }),
          ...(vendorType !== undefined && { vendorType: String(vendorType).trim() }),
          ...(normalizedBanks !== null
            ? {
                bankName: primaryBank?.bankName ?? null,
                bankBranch: primaryBank?.bankBranch ?? null,
                accountName: primaryBank?.accountName ?? null,
                routingNumber: primaryBank?.routingNumber ?? null,
                accountNumber: primaryBank?.accountNumber ?? null,
                ...(normalizedBanks.length > 0 && {
                  bankAccounts: { create: normalizedBanks },
                }),
              }
            : {
                ...(bankName !== undefined && { bankName: bankName?.trim() || null }),
                ...(bankBranch !== undefined && { bankBranch: bankBranch?.trim() || null }),
                ...(accountName !== undefined && { accountName: accountName?.trim() || null }),
                ...(routingNumber !== undefined && { routingNumber: routingNumber?.trim() || null }),
                ...(accountNumber !== undefined && { accountNumber: accountNumber?.trim() || null }),
              }),
          ...(primaryEmail !== undefined && { primaryEmail: primaryEmail?.trim() || null }),
          ...(hasPhonesUpdate && {
            primaryPhone: normalizedPhones[0] ?? null,
            primaryPhones: normalizedPhones,
          }),
          ...(hasAddressesUpdate && {
            billingAddress: normalizedAddresses[0] ?? null,
            billingAddresses: normalizedAddresses,
          }),
        },
        include: {
          bankAccounts: {
            orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
          },
        },
      })
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ success: false, error: "Vendor not found" }, { status: 404 })
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    await prisma.vendor.delete({ where: { id } })

    return NextResponse.json({ success: true, message: "Vendor deleted successfully" })
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ success: false, error: "Vendor not found" }, { status: 404 })
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
