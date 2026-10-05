/* eslint-disable @typescript-eslint/no-explicit-any */

export const LeadAssignmentDepartment = {
  ADMIN: 'ADMIN',
  SR_CRM: 'SR_CRM',
  JR_CRM: 'JR_CRM',
  QUOTATION: 'QUOTATION',
  VISIT_TEAM: 'VISIT_TEAM',
  JR_ARCHITECT: 'JR_ARCHITECT',
  VISUALIZER_3D: 'VISUALIZER_3D',
  ACCOUNTS: 'ACCOUNTS',
} as const
export type LeadAssignmentDepartment = (typeof LeadAssignmentDepartment)[keyof typeof LeadAssignmentDepartment]

export const LeadStage = {
  NEW: 'NEW',
  NUMBER_COLLECTED: 'NUMBER_COLLECTED',
  DISCOVERY: 'DISCOVERY',
  CAD_PHASE: 'CAD_PHASE',
  QUOTATION_PHASE: 'QUOTATION_PHASE',
  BUDGET_PHASE: 'BUDGET_PHASE',
  VISIT_PHASE: 'VISIT_PHASE',
  VISUALIZATION_PHASE: 'VISUALIZATION_PHASE',
  CONVERSION: 'CONVERSION',
  CONTACT_ATTEMPTED: 'CONTACT_ATTEMPTED',
  NURTURING: 'NURTURING',
  VISIT_SCHEDULED: 'VISIT_SCHEDULED',
  VISIT_RESCHEDULED: 'VISIT_RESCHEDULED',
  VISIT_COMPLETED: 'VISIT_COMPLETED',
  VISIT_CANCELLED: 'VISIT_CANCELLED',
  CLOSED: 'CLOSED',
} as const
export type LeadStage = (typeof LeadStage)[keyof typeof LeadStage]

export const LeadSubStatus = {
  NUMBER_COLLECTED: 'NUMBER_COLLECTED',
  NO_ANSWER: 'NO_ANSWER',
  WARM_LEAD: 'WARM_LEAD',
  FUTURE_CLIENT: 'FUTURE_CLIENT',
  FIRST_MEETING_SET: 'FIRST_MEETING_SET',
  PROPOSAL_SENT: 'PROPOSAL_SENT',
  LAYOUT_REVISION: 'LAYOUT_REVISION',
  CAD_ASSIGNED: 'CAD_ASSIGNED',
  CAD_WORKING: 'CAD_WORKING',
  CAD_COMPLETED: 'CAD_COMPLETED',
  CAD_APPROVED: 'CAD_APPROVED',
  QUOTATION_ASSIGNED: 'QUOTATION_ASSIGNED',
  QUOTATION_WORKING: 'QUOTATION_WORKING',
  QUOTATION_COMPLETED: 'QUOTATION_COMPLETED',
  QUOTATION_APPROVED: 'QUOTATION_APPROVED',
  QUOTATION_CORRECTION: 'QUOTATION_CORRECTION',
  BUDGET_MEETING_SET: 'BUDGET_MEETING_SET',
  CLIENT_CONFIRMED: 'CLIENT_CONFIRMED',
  CLIENT_PARTIALLY_PAID: 'CLIENT_PARTIALLY_PAID',
  CLIENT_FULL_PAID: 'CLIENT_FULL_PAID',
  REJECTED_OFFER: 'REJECTED_OFFER',
  VISUAL_ASSIGNED: 'VISUAL_ASSIGNED',
  VISUAL_WORKING: 'VISUAL_WORKING',
  VISUAL_COMPLETED: 'VISUAL_COMPLETED',
  CLIENT_APPROVED: 'CLIENT_APPROVED',
  VISUAL_CORRECTION: 'VISUAL_CORRECTION',
  VISIT_SCHEDULED: 'VISIT_SCHEDULED',
  VISIT_COMPLETED: 'VISIT_COMPLETED',
  VISIT_RESCHEDULED: 'VISIT_RESCHEDULED',
  VISIT_CANCELLED: 'VISIT_CANCELLED',
  PROJECT_DROPPED: 'PROJECT_DROPPED',
  SMALL_BUDGET: 'SMALL_BUDGET',
  DEAD_LEAD: 'DEAD_LEAD',
  INVALID: 'INVALID',
  NOT_INTERESTED: 'NOT_INTERESTED',
  LOST: 'LOST',
} as const
export type LeadSubStatus = (typeof LeadSubStatus)[keyof typeof LeadSubStatus]

export const FollowUpStatus = {
  PENDING: 'PENDING',
  DONE: 'DONE',
  LATELY_DONE: 'LATELY_DONE',
  MISSED: 'MISSED',
} as const
export type FollowUpStatus = (typeof FollowUpStatus)[keyof typeof FollowUpStatus]

export const FollowUpCategory = {
  LAYOUT_REVIEW: 'LAYOUT_REVIEW',
  BUDGET_NEGOTIATION: 'BUDGET_NEGOTIATION',
  SITE_VISIT: 'SITE_VISIT',
  CONTRACT_SIGNING: 'CONTRACT_SIGNING',
  GENERAL: 'GENERAL',
} as const
export type FollowUpCategory = (typeof FollowUpCategory)[keyof typeof FollowUpCategory]

export const ClientSentiment = {
  HOT: 'HOT',
  WARM: 'WARM',
  COLD: 'COLD',
  AT_RISK: 'AT_RISK',
} as const
export type ClientSentiment = (typeof ClientSentiment)[keyof typeof ClientSentiment]

export const ClientObjection = {
  BUDGET_TOO_HIGH: 'BUDGET_TOO_HIGH',
  COMPETITOR_COMPARISON: 'COMPETITOR_COMPARISON',
  DESIGN_REVISION_NEEDED: 'DESIGN_REVISION_NEEDED',
  SPACE_PLANNING_QUERY: 'SPACE_PLANNING_QUERY',
  TIMELINE_DELAY: 'TIMELINE_DELAY',
  OTHER: 'OTHER',
} as const
export type ClientObjection = (typeof ClientObjection)[keyof typeof ClientObjection]

export const LeadPrimaryOwnerDepartment = {
  JR_CRM: 'JR_CRM',
  SR_CRM: 'SR_CRM',
} as const
export type LeadPrimaryOwnerDepartment = (typeof LeadPrimaryOwnerDepartment)[keyof typeof LeadPrimaryOwnerDepartment]

export const LeadPhaseType = {
  CAD: 'CAD',
  QUOTATION: 'QUOTATION',
} as const
export type LeadPhaseType = (typeof LeadPhaseType)[keyof typeof LeadPhaseType]

export const LeadPhaseTaskStatus = {
  OPEN: 'OPEN',
  IN_REVIEW: 'IN_REVIEW',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const
export type LeadPhaseTaskStatus = (typeof LeadPhaseTaskStatus)[keyof typeof LeadPhaseTaskStatus]

export const LeadJrArchitectRequestStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const
export type LeadJrArchitectRequestStatus = (typeof LeadJrArchitectRequestStatus)[keyof typeof LeadJrArchitectRequestStatus]

export const LeadPhaseReviewDecision = {
  APPROVED: 'APPROVED',
  REWORK: 'REWORK',
} as const
export type LeadPhaseReviewDecision = (typeof LeadPhaseReviewDecision)[keyof typeof LeadPhaseReviewDecision]

export const LeadMeetingEventType = {
  FIRST_MEETING: 'FIRST_MEETING',
  BUDGET_MEETING: 'BUDGET_MEETING',
  REVIEW_CHECKPOINT: 'REVIEW_CHECKPOINT',
} as const
export type LeadMeetingEventType = (typeof LeadMeetingEventType)[keyof typeof LeadMeetingEventType]

export const QuotationDraftStatus = {
  DRAFT: 'DRAFT',
  FINALIZED: 'FINALIZED',
} as const
export type QuotationDraftStatus = (typeof QuotationDraftStatus)[keyof typeof QuotationDraftStatus]

export const CadSubmissionFileType = {
  FLOOR_PLAN: 'FLOOR_PLAN',
  FURNITURE_LAYOUT: 'FURNITURE_LAYOUT',
  BEAM_LAYOUT: 'BEAM_LAYOUT',
  COLUMN_LAYOUT: 'COLUMN_LAYOUT',
  LANDSCAPING: 'LANDSCAPING',
  ROOF_TOP_DESIGN: 'ROOF_TOP_DESIGN',
  ELECTRICAL_PLUMBING: 'ELECTRICAL_PLUMBING',
  WORKING_DETAILS: 'WORKING_DETAILS',
  OTHERS: 'OTHERS',
} as const
export type CadSubmissionFileType = (typeof CadSubmissionFileType)[keyof typeof CadSubmissionFileType]

export const ActivityType = {
  CALL: 'CALL',
  STATUS_CHANGE: 'STATUS_CHANGE',
  NOTE: 'NOTE',
  FOLLOWUP_SET: 'FOLLOWUP_SET',
  FOLLOWUP_COMPLETED: 'FOLLOWUP_COMPLETED',
  VISIT_SCHEDULED: 'VISIT_SCHEDULED',
  LEAD_CREATED: 'LEAD_CREATED',
  USER_ASSIGNED: 'USER_ASSIGNED',
  SR_TAKEOVER: 'SR_TAKEOVER',
  PHASE_DEADLINE_SET: 'PHASE_DEADLINE_SET',
  PHASE_REVIEW_ROUND: 'PHASE_REVIEW_ROUND',
  MEETING_SCHEDULED: 'MEETING_SCHEDULED',
  HANDOFF_TRIGGERED: 'HANDOFF_TRIGGERED',
} as const
export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType]

export const VisitStatus = {
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  RESCHEDULED: 'RESCHEDULED',
} as const
export type VisitStatus = (typeof VisitStatus)[keyof typeof VisitStatus]

export const ProjectStatus = {
  UNDER_CONSTRUCTION: 'UNDER_CONSTRUCTION',
  READY: 'READY',
} as const
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus]

export const VisitUpdateRequestType = {
  RESCHEDULE: 'RESCHEDULE',
  CANCEL: 'CANCEL',
} as const
export type VisitUpdateRequestType = (typeof VisitUpdateRequestType)[keyof typeof VisitUpdateRequestType]

export const VisitUpdateRequestStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const
export type VisitUpdateRequestStatus = (typeof VisitUpdateRequestStatus)[keyof typeof VisitUpdateRequestStatus]

export const NotificationType = {
  FOLLOWUP_DUE: 'FOLLOWUP_DUE',
  FOLLOWUP_REMINDER_15M: 'FOLLOWUP_REMINDER_15M',
  VISIT_DUE: 'VISIT_DUE',
  VISIT_REMINDER_30M: 'VISIT_REMINDER_30M',
  VISIT_ASSIGNED: 'VISIT_ASSIGNED',
  SIGNUP_PENDING_APPROVAL: 'SIGNUP_PENDING_APPROVAL',
  SIGNUP_APPROVED: 'SIGNUP_APPROVED',
  LEAD_ASSIGNED_TO_YOU: 'LEAD_ASSIGNED_TO_YOU',
  FACEBOOK_LEAD_SYNC_SUMMARY: 'FACEBOOK_LEAD_SYNC_SUMMARY',
  VISIT_SCHEDULED_ADMIN: 'VISIT_SCHEDULED_ADMIN',
  VISIT_DUE_36H: 'VISIT_DUE_36H',
  VISIT_DUE_48H: 'VISIT_DUE_48H',
  VISIT_DUE_72H: 'VISIT_DUE_72H',
} as const
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType]

export const TransactionType = {
  INFLOW: 'INFLOW',
  OUTFLOW: 'OUTFLOW',
} as const
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType]

export const ExpenseCategory = {
  OFFICE_RENT: 'OFFICE_RENT',
  SALARY: 'SALARY',
  SALARY_ADVANCE: 'SALARY_ADVANCE',
  BONUS: 'BONUS',
  ELECTRICITY_BILL: 'ELECTRICITY_BILL',
  WATER_BILL: 'WATER_BILL',
  INTERNET_BILL: 'INTERNET_BILL',
  FOOD_ALLOWANCE: 'FOOD_ALLOWANCE',
  CLIENT_ENTERTAINMENT: 'CLIENT_ENTERTAINMENT',
  PROMOTION: 'PROMOTION',
  MOBILE_RECHARGE: 'MOBILE_RECHARGE',
  OCTANE_FUEL: 'OCTANE_FUEL',
  DONATION: 'DONATION',
  BOARD_MATERIAL: 'BOARD_MATERIAL',
  PASTING_BILL: 'PASTING_BILL',
  FARING: 'FARING',
  HPL: 'HPL',
  LINER: 'LINER',
  LUBER: 'LUBER',
  ACRYLIC: 'ACRYLIC',
  HARDWARE: 'HARDWARE',
  ELECTRIC_ITEM: 'ELECTRIC_ITEM',
  LIGHTING: 'LIGHTING',
  GLASS: 'GLASS',
  TRANSPORT_COST: 'TRANSPORT_COST',
  SITE_EXPENSE: 'SITE_EXPENSE',
  FACTORY_PAYMENT: 'FACTORY_PAYMENT',
  CARPENTER_PAYMENT: 'CARPENTER_PAYMENT',
  PAINT_MATERIALS: 'PAINT_MATERIALS',
  PAINT_PAYMENT: 'PAINT_PAYMENT',
  CEILING_PAYMENT: 'CEILING_PAYMENT',
  DOOR: 'DOOR',
  PLUMBER_PAYMENT: 'PLUMBER_PAYMENT',
  TILES_PURCHASE: 'TILES_PURCHASE',
  FOLDING_DOOR: 'FOLDING_DOOR',
  GLASS_PROFILE: 'GLASS_PROFILE',
  CIVIL_WORK: 'CIVIL_WORK',
  OTHERS: 'OTHERS',
} as const
export type ExpenseCategory = (typeof ExpenseCategory)[keyof typeof ExpenseCategory]

export const AccountStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  PARTIAL_PAID: 'PARTIAL_PAID',
  FULL_PAID: 'FULL_PAID',
} as const
export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus]

export const $Enums = {
  LeadAssignmentDepartment,
  LeadStage,
  LeadSubStatus,
  FollowUpStatus,
  FollowUpCategory,
  ClientSentiment,
  ClientObjection,
  LeadPrimaryOwnerDepartment,
  LeadPhaseType,
  LeadPhaseTaskStatus,
  LeadJrArchitectRequestStatus,
  LeadPhaseReviewDecision,
  LeadMeetingEventType,
  QuotationDraftStatus,
  CadSubmissionFileType,
  ActivityType,
  VisitStatus,
  ProjectStatus,
  VisitUpdateRequestType,
  VisitUpdateRequestStatus,
  NotificationType,
  TransactionType,
  ExpenseCategory,
  AccountStatus,
}

export namespace Prisma {
  export type TransactionClient = PrismaClient
  export type InputJsonValue = any
  export type JsonValue = any
  export type JsonObject = Record<string, any>
  export type JsonArray = any[]
  export type LeadWhereInput = Record<string, any>
  export type VisitWhereInput = Record<string, any>
  export type TransactionWhereInput = Record<string, any>
  export type UserWhereInput = Record<string, any>
  export type NotificationWhereInput = Record<string, any>
  export type FollowUpWhereInput = Record<string, any>
  export type ActivityLogWhereInput = Record<string, any>
  export type CadWorkSubmissionWhereInput = Record<string, any>
  export type LeadPhaseTaskWhereInput = Record<string, any>
  export type LeadMeetingEventWhereInput = Record<string, any>

  export class PrismaClientKnownRequestError extends Error {
    code: string
    meta?: Record<string, unknown>
    clientVersion: string
    constructor(message: string, { code, clientVersion, meta }: { code: string; clientVersion: string; meta?: Record<string, unknown> }) {
      super(message)
      this.name = 'PrismaClientKnownRequestError'
      this.code = code
      this.clientVersion = clientVersion
      this.meta = meta
    }
  }

  export const DbNull = Symbol('DbNull')
  export const JsonNull = Symbol('JsonNull')
  export const AnyNull = Symbol('AnyNull')
}

export class PrismaClient {
  [key: string]: any
  lead: any
  leadAssignment: any
  leadStatusHistory: any
  activityLog: any
  followUp: any
  note: any
  user: any
  deviceToken: any
  leadPhaseTask: any
  leadJrArchitectRequest: any
  leadPhaseReview: any
  leadMeetingEvent: any
  cadWorkSubmission: any
  quotationDraft: any
  cadWorkSubmissionFile: any
  visit: any
  visitUpdateRequest: any
  visitResult: any
  visitSupportAssignment: any
  visitSupportResult: any
  attachment: any
  leadAttachment: any
  supportAttachment: any
  notification: any
  facebookSyncControl: any
  instagramSyncControl: any
  whatsAppWebhookControl: any
  whatsAppProcessedMessage: any
  visitWorkflowControl: any
  whatsAppWebhookEvent: any
  role: any
  department: any
  userRole: any
  userDepartment: any
  financeAccount: any
  transaction: any
  cashFlowDaily: any
  websiteProject: any
  websiteProjectImage: any
  websiteVideo: any
  websiteTestimonial: any
  websiteTeamMember: any
  quotationTemplateOverride: any
  jrArchitectPerformance: any
  quotationUserPerformance: any

  constructor(_options?: any) {}
  async $connect(): Promise<void> {}
  async $disconnect(): Promise<void> {}
  async $transaction<T>(fn: ((tx: PrismaClient) => Promise<T>) | Promise<any>[], _options?: any): Promise<T> {
    if (typeof fn === 'function') {
      return fn(this)
    }
    return Promise.all(fn) as unknown as Promise<T>
  }
  async $queryRaw<T = any>(_query: TemplateStringsArray | any, ..._values: any[]): Promise<T> {
    return [] as unknown as T
  }
  async $queryRawUnsafe<T = any>(_query: string, ..._values: any[]): Promise<T> {
    return [] as unknown as T
  }
  async $executeRaw(_query: TemplateStringsArray | any, ..._values: any[]): Promise<number> {
    return 0
  }
  async $executeRawUnsafe(_query: string, ..._values: any[]): Promise<number> {
    return 0
  }
}
