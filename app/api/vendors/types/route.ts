import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { DEFAULT_VENDOR_TYPES } from "@/lib/vendor-utils"

async function ensureDefaultVendorTypes() {
  const existingCount = await prisma.vendorTypeOption.count()
  if (existingCount === 0) {
    await prisma.vendorTypeOption.createMany({
      data: DEFAULT_VENDOR_TYPES.map((t) => ({
        value: t.value,
        label: t.label,
        isDefault: true,
      })),
      skipDuplicates: true,
    })
  }
}

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

    await ensureDefaultVendorTypes()

    const types = await prisma.vendorTypeOption.findMany({
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    })

    return NextResponse.json({ success: true, data: types })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const rawLabel = typeof body?.label === "string" ? body.label.trim() : ""

    if (!rawLabel) {
      return NextResponse.json({ success: false, error: "Vendor type name is required" }, { status: 400 })
    }

    await ensureDefaultVendorTypes()

    const normalizedValue = rawLabel
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")

    if (!normalizedValue) {
      return NextResponse.json({ success: false, error: "Invalid vendor type name" }, { status: 400 })
    }

    const existing = await prisma.vendorTypeOption.findFirst({
      where: {
        OR: [
          { value: normalizedValue },
          { label: { equals: rawLabel, mode: "insensitive" } },
        ],
      },
    })

    if (existing) {
      return NextResponse.json({ success: true, data: existing })
    }

    const created = await prisma.vendorTypeOption.create({
      data: {
        value: normalizedValue,
        label: rawLabel,
        isDefault: false,
      },
    })

    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
