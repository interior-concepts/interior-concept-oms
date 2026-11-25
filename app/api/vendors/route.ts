import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { VendorStatus } from "@/generated/prisma/client"

type BankAccountInput = {
  bankName?: string | null
  bankBranch?: string | null
  accountName?: string | null
  routingNumber?: string | null
  accountNumber?: string | null
}

function normalizeStringArray(values: unknown, fallbackSingle?: unknown): string[] {
  const fromArray = Array.isArray(values)
    ? values.map((v) => (typeof v === "string" ? v.trim() : "")).filter(Boolean)
    : []
  if (fromArray.length > 0) return fromArray
  if (typeof fallbackSingle === "string" && fallbackSingle.trim()) {
    return [fallbackSingle.trim()]
  }
  return []
}

function normalizeBankAccounts(
  bankAccounts: unknown,
  fallback: BankAccountInput
): Array<{
  bankName: string | null
  bankBranch: string | null
  accountName: string | null
  routingNumber: string | null
  accountNumber: string | null
  isPrimary: boolean
}> {
  if (Array.isArray(bankAccounts)) {
    const cleaned = bankAccounts
      .map((b) => ({
        bankName: typeof b?.bankName === "string" ? b.bankName.trim() || null : null,
        bankBranch: typeof b?.bankBranch === "string" ? b.bankBranch.trim() || null : null,
        accountName: typeof b?.accountName === "string" ? b.accountName.trim() || null : null,
        routingNumber: typeof b?.routingNumber === "string" ? b.routingNumber.trim() || null : null,
        accountNumber: typeof b?.accountNumber === "string" ? b.accountNumber.trim() || null : null,
      }))
      .filter((b) => b.bankName || b.bankBranch || b.accountName || b.routingNumber || b.accountNumber)

    return cleaned.map((b, idx) => ({ ...b, isPrimary: idx === 0 }))
  }

  const single = {
    bankName: typeof fallback.bankName === "string" ? fallback.bankName.trim() || null : null,
    bankBranch: typeof fallback.bankBranch === "string" ? fallback.bankBranch.trim() || null : null,
    accountName: typeof fallback.accountName === "string" ? fallback.accountName.trim() || null : null,
    routingNumber: typeof fallback.routingNumber === "string" ? fallback.routingNumber.trim() || null : null,
    accountNumber: typeof fallback.accountNumber === "string" ? fallback.accountNumber.trim() || null : null,
    isPrimary: true,
  }
  if (single.bankName || single.bankBranch || single.accountName || single.routingNumber || single.accountNumber) {
    return [single]
  }
  return []
}

// Auto-generate a human-readable vendorId like VND-0001
async function generateVendorId(): Promise<string> {
  const count = await prisma.vendor.count()
  const next = count + 1
  return `VND-${String(next).padStart(4, "0")}`
}

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

    const vendors = await prisma.vendor.findMany({
      include: {
        bankAccounts: {
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, data: vendors })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

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

    if (!vendorName || !vendorName.trim()) {
      return NextResponse.json({ success: false, error: "Vendor name is required" }, { status: 400 })
    }
    if (!vendorType || !String(vendorType).trim()) {
      return NextResponse.json({ success: false, error: "Vendor type is required" }, { status: 400 })
    }

    const normalizedPhones = normalizeStringArray(primaryPhones, primaryPhone)
    const normalizedAddresses = normalizeStringArray(billingAddresses, billingAddress)
    const normalizedBanks = normalizeBankAccounts(bankAccounts, {
      bankName,
      bankBranch,
      accountName,
      routingNumber,
      accountNumber,
    })
    const primaryBank = normalizedBanks[0]

    const vendorId = await generateVendorId()

    const vendor = await prisma.vendor.create({
      data: {
        vendorId,
        vendorName: vendorName.trim(),
        vendorCompanyName: vendorCompanyName?.trim() || null,
        status: (status as VendorStatus) || VendorStatus.ACTIVE,
        vendorType: String(vendorType).trim(),
        bankName: primaryBank?.bankName ?? null,
        bankBranch: primaryBank?.bankBranch ?? null,
        accountName: primaryBank?.accountName ?? null,
        routingNumber: primaryBank?.routingNumber ?? null,
        accountNumber: primaryBank?.accountNumber ?? null,
        primaryEmail: primaryEmail?.trim() || null,
        primaryPhone: normalizedPhones[0] ?? null,
        primaryPhones: normalizedPhones,
        billingAddress: normalizedAddresses[0] ?? null,
        billingAddresses: normalizedAddresses,
        ...(normalizedBanks.length > 0 && {
          bankAccounts: {
            create: normalizedBanks,
          },
        }),
      },
      include: {
        bankAccounts: {
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        },
      },
    })

    return NextResponse.json({ success: true, data: vendor }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
