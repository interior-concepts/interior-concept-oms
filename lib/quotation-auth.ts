import { LeadAssignmentDepartment, LeadStage, LeadSubStatus } from '@/generated/prisma/client'

export const QUOTATION_EDITABLE_SUBSTATUSES = new Set<LeadSubStatus>([
  LeadSubStatus.QUOTATION_WORKING,
  LeadSubStatus.QUOTATION_CORRECTION,
  LeadSubStatus.BUDGET_MEETING_SET,
])

export function isQuotationDepartment(actorDepartments: string[]): boolean {
  return actorDepartments.includes('QUOTATION') || actorDepartments.includes('QUOTATION_TEAM')
}

export function isQuotationAdmin(actorDepartments: string[]): boolean {
  return actorDepartments.includes('ADMIN') || actorDepartments.includes('SR_CRM')
}

export function canAccessQuotationDraft(actorDepartments: string[]): boolean {
  return isQuotationAdmin(actorDepartments) || isQuotationDepartment(actorDepartments)
}

export function canEditQuotationDraft(input: {
  actorDepartments: string[]
  actorUserId: string
  leadSubStatus: LeadSubStatus | null
  assignedQuotationUserId: string | null
}): boolean {
  if (isQuotationAdmin(input.actorDepartments)) return true

  if (!isQuotationDepartment(input.actorDepartments)) return false
  if (!input.assignedQuotationUserId) return false
  return input.assignedQuotationUserId === input.actorUserId
}

export function buildQuotationLeadWhere(input: {
  leadId: string
  actorUserId: string
  actorDepartments: string[]
}) {
  const isAdminOrSr = isQuotationAdmin(input.actorDepartments)
  const isQuotation = isQuotationDepartment(input.actorDepartments)

  if (!isAdminOrSr && !isQuotation) {
    return null
  }

  // Admins and SR CRM can view any lead's quotation draft regardless of stage
  if (isAdminOrSr) {
    return { id: input.leadId }
  }

  // Quotation team members can access any lead where they are assigned as quotation team, regardless of stage or substatus
  return {
    id: input.leadId,
    assignments: {
      some: {
        department: LeadAssignmentDepartment.QUOTATION,
        userId: input.actorUserId,
      },
    },
  }
}

