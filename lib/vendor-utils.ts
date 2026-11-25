/**
 * Default vendor type options seeded into VendorTypeOption
 */
export const DEFAULT_VENDOR_TYPES = [
  { value: "SUPPLIER", label: "Supplier" },
  { value: "CONTRACTOR", label: "Contractor" },
  { value: "PAINTER", label: "Painter" },
  { value: "CARPENTER", label: "Carpenter" },
  { value: "SERVICE_PROVIDER", label: "Service Provider" },
  { value: "FREELANCER", label: "Freelancer" },
  { value: "OTHER", label: "Other" },
] as const

/**
 * Maps VendorType to the appropriate ExpenseCategory for auto-created Transactions
 */
export const VENDOR_TYPE_TO_EXPENSE_CATEGORY: Record<string, string> = {
  SUPPLIER:         "BOARD_MATERIAL",
  CONTRACTOR:       "CIVIL_WORK",
  PAINTER:          "PAINT_PAYMENT",
  CARPENTER:        "CARPENTER_PAYMENT",
  SERVICE_PROVIDER: "OTHERS",
  FREELANCER:       "OTHERS",
  OTHER:            "OTHERS",
}

/**
 * Generates a human-readable vendor type label
 */
export function formatVendorType(type: string): string {
  const labels: Record<string, string> = {
    SUPPLIER:         "Supplier",
    CONTRACTOR:       "Contractor",
    PAINTER:          "Painter",
    CARPENTER:        "Carpenter",
    SERVICE_PROVIDER: "Service Provider",
    FREELANCER:       "Freelancer",
    OTHER:            "Other",
  }
  if (labels[type]) return labels[type]
  return type
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}
