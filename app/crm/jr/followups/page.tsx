'use client'

import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Phone,
  Mail,
  User,
  MessageSquare,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Search,
  Layers,
  Sparkles,
  FileSpreadsheet,
  MapPin,
  CreditCard,
} from 'lucide-react'
import { CrmPageHeader } from '@/components/crm/shared/page-header'
import { fetchMeCached } from '@/lib/client-me'
import { ConnectedFollowupChainDialog } from '@/components/crm/shared/connected-followup-chain-dialog'
import { FOLLOWUP_CATEGORIES, type FollowUpCategoryValue } from '@/components/crm/shared/followup-intelligence-fields'
import { FOLLOWUP_DEPARTMENTS, DepartmentRoleBadge } from '@/components/crm/shared/followup-departments'

type FollowUpStatus = 'PENDING' | 'DONE' | 'LATELY_DONE' | 'MISSED'
type TabKey = 'pending' | 'today' | 'overdue' | 'completed' | 'missed'
type CrmPerspective = string

type FollowUp = {
  id: string
  leadId: string
  assignedToId: string
  followupDate: string
  status: FollowUpStatus
  notes: string | null
  category: string
  createdAt: string
  crmRole?: 'JR_CRM' | 'SR_CRM' | 'GENERAL'
  departmentRole?: string
  connectedLeadFollowupsCount?: number
  assignedJrCrm?: { id: string; fullName: string; email: string } | null
  assignedSrCrm?: { id: string; fullName: string; email: string } | null
  lead: {
    id: string
    name: string
    email: string
    phone: string
    stage: string
    subStatus: string | null
  }
  assignedTo: {
    id: string
    fullName: string
    email: string
  }
}

type FollowupsApiResponse = {
  success: boolean
  data?: FollowUp[]
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

type TabState = {
  items: FollowUp[]
  page: number
  totalPages: number
  total: number
  loading: boolean
  loaded: boolean
  error: string | null
}

const PAGE_SIZE = 20

const statusConfig: Record<FollowUpStatus, { icon: ReactNode; color: string; bgColor: string; label: string }> = {
  PENDING: {
    icon: <Clock className="w-4 h-4" />,
    color: 'text-amber-700 dark:text-amber-200',
    bgColor: 'bg-amber-100 dark:bg-amber-900/40',
    label: 'Pending',
  },
  DONE: {
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: 'text-green-700 dark:text-green-200',
    bgColor: 'bg-green-100 dark:bg-green-900/40',
    label: 'Done',
  },
  LATELY_DONE: {
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: 'text-blue-700 dark:text-blue-200',
    bgColor: 'bg-blue-100 dark:bg-blue-900/40',
    label: 'Lately Done',
  },
  MISSED: {
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'text-red-700 dark:text-red-200',
    bgColor: 'bg-red-100 dark:bg-red-900/40',
    label: 'Missed',
  },
}

const tabLabels: Record<TabKey, string> = {
  pending: 'Pending',
  today: 'Today',
  overdue: 'Overdue',
  completed: 'Completed',
  missed: 'Missed',
}

const createInitialTabState = (): Record<TabKey, TabState> => ({
  pending: { items: [], page: 1, totalPages: 1, total: 0, loading: false, loaded: false, error: null },
  today: { items: [], page: 1, totalPages: 1, total: 0, loading: false, loaded: false, error: null },
  overdue: { items: [], page: 1, totalPages: 1, total: 0, loading: false, loaded: false, error: null },
  completed: { items: [], page: 1, totalPages: 1, total: 0, loading: false, loaded: false, error: null },
  missed: { items: [], page: 1, totalPages: 1, total: 0, loading: false, loaded: false, error: null },
})

function getDateRangeForFollowups() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  end.setMilliseconds(end.getMilliseconds() - 1)

  const beforeToday = new Date(start)
  beforeToday.setMilliseconds(beforeToday.getMilliseconds() - 1)

  return {
    todayStartIso: start.toISOString(),
    todayEndIso: end.toISOString(),
    beforeTodayIso: beforeToday.toISOString(),
  }
}

/** Returns tomorrow's date-time string in local ISO format suitable for datetime-local input */
function defaultNextFollowupDatetime(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`
}

export default function FollowupsPage() {
  const pathname = usePathname()
  const isAdminView = pathname?.startsWith('/crm/admin') ?? false
  const isSeniorCrmView = pathname?.startsWith('/crm/sr') ?? false

  const [activeTab, setActiveTab] = useState<TabKey>('pending')
  const [crmPerspective, setCrmPerspective] = useState<CrmPerspective>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [tabState, setTabState] = useState<Record<TabKey, TabState>>(createInitialTabState)

  // Complete modal state
  const [completeOpen, setCompleteOpen] = useState(false)
  const [selectedFollowup, setSelectedFollowup] = useState<FollowUp | null>(null)
  const [completionNote, setCompletionNote] = useState('')
  const [completing, setCompleting] = useState(false)
  const [completeError, setCompleteError] = useState<string | null>(null)

  // Next follow-up handover state
  const [setNextFollowup, setSetNextFollowup] = useState(true)
  const [nextFollowupDatetime, setNextFollowupDatetime] = useState('')
  const [nextFollowupNote, setNextFollowupNote] = useState('')
  const [nextFollowupCategory, setNextFollowupCategory] = useState<FollowUpCategoryValue>('GENERAL')
  const [nextAssignRole, setNextAssignRole] = useState<string>('SELF')

  // Chain dialog state
  const [chainDialogOpen, setChainDialogOpen] = useState(false)
  const [selectedChainLead, setSelectedChainLead] = useState<FollowUp | null>(null)

  const dateRange = useMemo(getDateRangeForFollowups, [])

  const buildQuery = useCallback(
    (tab: TabKey, page: number) => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      })

      // Status filters
      if (tab === 'pending') {
        params.set('status', 'PENDING')
      } else if (tab === 'today') {
        params.set('status', 'PENDING')
        params.set('from', dateRange.todayStartIso)
        params.set('to', dateRange.todayEndIso)
      } else if (tab === 'overdue') {
        params.set('status', 'PENDING')
        params.set('to', dateRange.beforeTodayIso)
      } else if (tab === 'completed') {
        params.set('statuses', 'DONE,LATELY_DONE')
      } else if (tab === 'missed') {
        params.set('status', 'MISSED')
      }

      // Department / CRM Perspective filter
      if (crmPerspective !== 'ALL') {
        if (crmPerspective === 'MY') {
          params.set('crmType', 'MY')
          if (currentUserId) {
            params.set('myUserId', currentUserId)
          }
        } else if (crmPerspective === 'JR_CRM' || crmPerspective === 'SR_CRM') {
          params.set('crmType', crmPerspective)
        } else {
          params.set('department', crmPerspective)
        }
      }

      // Search filter
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim())
      }

      return params
    },
    [crmPerspective, currentUserId, dateRange.beforeTodayIso, dateRange.todayEndIso, dateRange.todayStartIso, searchQuery],
  )

  const loadTab = useCallback(
    async (tab: TabKey, page: number, force = false) => {
      const current = tabState[tab]
      if (current.loading) return
      if (!force && current.loaded && current.page === page) return

      setTabState((prev) => ({
        ...prev,
        [tab]: { ...prev[tab], loading: true, error: null },
      }))

      try {
        const params = buildQuery(tab, page)
        const res = await fetch(`/api/followup?${params.toString()}`)
        const data = (await res.json()) as FollowupsApiResponse

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to load follow-ups.')
        }

        setTabState((prev) => ({
          ...prev,
          [tab]: {
            items: Array.isArray(data.data) ? data.data : [],
            page: data.pagination?.page ?? page,
            totalPages: Math.max(1, data.pagination?.totalPages ?? 1),
            total: data.pagination?.total ?? 0,
            loading: false,
            loaded: true,
            error: null,
          },
        }))
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load follow-ups.'
        setTabState((prev) => ({
          ...prev,
          [tab]: {
            ...prev[tab],
            loading: false,
            loaded: true,
            error: message,
            items: [],
            total: 0,
            totalPages: 1,
            page,
          },
        }))
      }
    },
    [buildQuery, tabState],
  )

  useEffect(() => {
    fetchMeCached()
      .then((data) => setCurrentUserId(data.id ?? null))
      .catch((error) => console.error('Error fetching current user:', error))
  }, [])

  useEffect(() => {
    // Reset tabs when perspective or search changes
    setTabState(createInitialTabState())
  }, [crmPerspective, searchQuery])

  useEffect(() => {
    const state = tabState[activeTab]
    if (!state.loaded && !state.loading) {
      loadTab(activeTab, 1)
    }
  }, [activeTab, loadTab, tabState])

  const openCompleteModal = (followup: FollowUp) => {
    setSelectedFollowup(followup)
    setCompletionNote('')
    setCompleteError(null)
    setSetNextFollowup(true)
    setNextFollowupDatetime(defaultNextFollowupDatetime())
    setNextFollowupNote('')
    setNextFollowupCategory('GENERAL')
    // Default: if current is JR CRM completing, suggest Sr CRM; else suggest Myself
    const currentDept = followup.departmentRole || followup.crmRole
    setNextAssignRole(currentDept === 'JR_CRM' ? 'SR_CRM' : 'SELF')
    setCompleteOpen(true)
  }

  const invalidateAndRefresh = useCallback(async () => {
    setTabState(createInitialTabState())
    await loadTab(activeTab, 1, true)
  }, [activeTab, loadTab])

  const handleCompleteFollowup = async () => {
    if (!selectedFollowup) return
    if (!currentUserId) {
      setCompleteError('Unable to determine your user id.')
      return
    }
    if (!completionNote.trim()) {
      setCompleteError('Please add completion notes.')
      return
    }
    if (setNextFollowup && !nextFollowupDatetime) {
      setCompleteError('Please set the next follow-up date and time.')
      return
    }

    const nextStatus: FollowUpStatus = selectedFollowup.status === 'MISSED' ? 'LATELY_DONE' : 'DONE'

    setCompleting(true)
    setCompleteError(null)
    try {
      const nextFollowUpPayload = setNextFollowup && nextFollowupDatetime
        ? {
            followupDate: new Date(nextFollowupDatetime).toISOString(),
            notes: nextFollowupNote.trim() || undefined,
            category: nextFollowupCategory,
            targetDepartment: nextAssignRole !== 'SELF' ? nextAssignRole : undefined,
            targetCrmRole: nextAssignRole === 'SR_CRM' ? 'SR_CRM' : nextAssignRole === 'JR_CRM' ? 'JR_CRM' : undefined,
            assignedToId: nextAssignRole === 'SELF' ? currentUserId : undefined,
          }
        : undefined

      const completeRes = await fetch(`/api/followup/${selectedFollowup.leadId}/${selectedFollowup.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          notes: completionNote.trim(),
          userId: currentUserId,
          nextFollowUp: nextFollowUpPayload,
        }),
      })

      const completeData = await completeRes.json()
      if (!completeRes.ok || !completeData.success) {
        throw new Error(completeData.error || 'Failed to complete follow-up.')
      }

      setCompleteOpen(false)
      setSelectedFollowup(null)
      setCompletionNote('')
      setNextFollowupNote('')
      setNextFollowupDatetime('')
      await invalidateAndRefresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete follow-up.'
      setCompleteError(message)
    } finally {
      setCompleting(false)
    }
  }

  const openChainDialogForFollowup = (followup: FollowUp) => {
    setSelectedChainLead(followup)
    setChainDialogOpen(true)
  }

  const leadHref = (leadId: string) => {
    if (isAdminView) return `/crm/admin/leads/${leadId}`
    return isSeniorCrmView ? `/crm/sr/leads/${leadId}` : `/crm/jr/leads/${leadId}`
  }

  const FollowupCard = ({ followup }: { followup: FollowUp }) => {
    const config = statusConfig[followup.status]
    const followupDateTime = new Date(followup.followupDate)
    const canComplete = followup.status === 'PENDING' || followup.status === 'MISSED'
    const isSr = followup.crmRole === 'SR_CRM'
    const isJr = followup.crmRole === 'JR_CRM'

    return (
      <Card className="hover:shadow-md transition-shadow duration-200 border-border">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 mt-1 p-2 rounded-lg ${config.bgColor}`}>
              <div className={config.color}>{config.icon}</div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href={leadHref(followup.leadId)} className="group flex items-center gap-2">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {followup.lead.name}
                  </h3>
                  <Badge variant="outline" className="text-[11px] font-normal">
                    {followup.lead.stage.replace(/_/g, ' ')}
                  </Badge>
                </Link>

                <div className="flex items-center gap-2">
                  <DepartmentRoleBadge departmentKey={followup.departmentRole || followup.crmRole} />
                  <Badge className={`${config.bgColor} ${config.color} text-xs font-medium`}>
                    {config.label}
                  </Badge>
                </div>
              </div>

              {/* Client Contacts */}
              <div className="flex flex-col md:flex-row md:items-center gap-2 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{followup.lead.email || 'No email'}</span>
                </div>
                <div className="hidden md:block">•</div>
                <div className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{followup.lead.phone}</span>
                </div>
              </div>

              {/* Connected Team Info */}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs bg-muted/30 p-2 rounded border border-border/50">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="font-medium text-foreground">Jr CRM:</span>
                  <span className="text-sky-700 dark:text-sky-300 font-medium">
                    {followup.assignedJrCrm?.fullName || (isJr ? followup.assignedTo.fullName : 'Not assigned')}
                  </span>
                </div>
                <div className="text-border">|</div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="font-medium text-foreground">Sr CRM:</span>
                  <span className="text-purple-700 dark:text-purple-300 font-medium">
                    {followup.assignedSrCrm?.fullName || (isSr ? followup.assignedTo.fullName : 'Pending handover')}
                  </span>
                </div>
                <div className="text-border">|</div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1.5 text-[11px] text-primary hover:bg-primary/10 gap-1 ml-auto"
                  onClick={() => openChainDialogForFollowup(followup)}
                >
                  <Layers className="w-3 h-3" />
                  {followup.connectedLeadFollowupsCount ?? 1} Connected {followup.connectedLeadFollowupsCount === 1 ? 'Action' : 'Actions'}
                </Button>
              </div>

              {followup.notes ? (
                <p className="text-sm text-muted-foreground mt-3 line-clamp-2 italic">
                  &ldquo;{followup.notes}&rdquo;
                </p>
              ) : null}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {followupDateTime.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      at{' '}
                      {followupDateTime.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <User className="w-3.5 h-3.5" />
                    <span>Assigned: {followup.assignedTo.fullName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {followup.lead.phone ? (
                    <a
                      href={`https://wa.me/${followup.lead.phone.replace(/[^\d+]/g, '').replace(/^0/, '880')}?text=${encodeURIComponent(`Hi ${followup.lead.name}, checking in regarding your interior design project.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="outline" className="gap-1 text-green-700 border-green-300 hover:bg-green-50">
                        <MessageSquare className="w-3.5 h-3.5 fill-green-600 text-green-600" />
                        WhatsApp
                      </Button>
                    </a>
                  ) : null}
                  <Link href={leadHref(followup.leadId)}>
                    <Button size="sm" variant="outline" className="gap-1">
                      Lead <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  {canComplete ? (
                    <Button size="sm" onClick={() => openCompleteModal(followup)} className="gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const FollowupCardSkeleton = () => (
    <Card className="border-border animate-pulse">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-4">
          <div className="h-8 w-8 rounded-lg bg-muted" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-44 rounded bg-muted" />
            <div className="h-3 w-56 rounded bg-muted" />
            <div className="h-3 w-48 rounded bg-muted" />
            <div className="h-9 w-full rounded bg-muted" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const EmptyState = ({ icon, text }: { icon: ReactNode; text: string }) => (
    <Card className="border-dashed">
      <CardContent className="pt-14 pb-14 text-center">
        <div className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40">{icon}</div>
        <p className="text-muted-foreground text-sm font-medium">{text}</p>
      </CardContent>
    </Card>
  )

  const renderTabContent = (tab: TabKey, emptyIcon: ReactNode, emptyText: string) => {
    const state = tabState[tab]

    if (state.loading && state.items.length === 0) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <FollowupCardSkeleton key={idx} />
          ))}
        </div>
      )
    }

    if (state.error) {
      return <p className="text-sm text-destructive">{state.error}</p>
    }

    if (state.items.length === 0) {
      return <EmptyState icon={emptyIcon} text={emptyText} />
    }

    return (
      <div className="space-y-4">
        {state.items.map((followup) => (
          <FollowupCard key={followup.id} followup={followup} />
        ))}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadTab(tab, state.page - 1, true)}
            disabled={state.page <= 1 || state.loading}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
          <span className="text-xs text-muted-foreground px-2">
            Page {state.page} of {state.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadTab(tab, state.page + 1, true)}
            disabled={state.page >= state.totalPages || state.loading}
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    )
  }

  const pageTitle = isAdminView
    ? 'Admin Follow-Up Hub'
    : isSeniorCrmView
      ? 'Senior CRM Follow-Up Hub'
      : 'Junior CRM Follow-Up Hub'
  const pageSubtitle = isAdminView
    ? 'Organization-wide lead follow-ups: manage and monitor follow-up actions across all departments.'
    : 'Connected Lead Pipeline: seamlessly link Junior CRM qualification with Senior CRM closing actions.'

  return (
    <div className="min-h-screen bg-background">
      <CrmPageHeader title={pageTitle} subtitle={pageSubtitle} />

      <main className="mx-auto max-w-[1440px] px-4 sm:px-6 py-6 space-y-6">
        {/* Connected Perspective Selector & Search Bar */}
        <div className="flex flex-col gap-3 bg-card border rounded-xl p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">
              Department Filter:
            </span>
            <Button
              size="sm"
              variant={crmPerspective === 'ALL' ? 'default' : 'outline'}
              className="h-7 text-xs gap-1.5"
              onClick={() => setCrmPerspective('ALL')}
            >
              <Sparkles className="w-3 h-3" /> All
            </Button>
            <Button
              size="sm"
              variant={crmPerspective === 'JR_CRM' ? 'default' : 'outline'}
              className={`h-7 text-xs gap-1.5 ${crmPerspective === 'JR_CRM' ? 'bg-sky-600 hover:bg-sky-700 text-white' : ''}`}
              onClick={() => setCrmPerspective('JR_CRM')}
            >
              <UserCheck className="w-3 h-3" /> Jr CRM
            </Button>
            <Button
              size="sm"
              variant={crmPerspective === 'SR_CRM' ? 'default' : 'outline'}
              className={`h-7 text-xs gap-1.5 ${crmPerspective === 'SR_CRM' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
              onClick={() => setCrmPerspective('SR_CRM')}
            >
              <ShieldCheck className="w-3 h-3" /> Sr CRM
            </Button>
            <Button
              size="sm"
              variant={crmPerspective === 'VISUALIZER_3D' ? 'default' : 'outline'}
              className={`h-7 text-xs gap-1.5 ${crmPerspective === 'VISUALIZER_3D' ? 'bg-pink-600 hover:bg-pink-700 text-white' : ''}`}
              onClick={() => setCrmPerspective('VISUALIZER_3D')}
            >
              <Sparkles className="w-3 h-3" /> 3D Viz
            </Button>
            <Button
              size="sm"
              variant={crmPerspective === 'JR_ARCHITECT' ? 'default' : 'outline'}
              className={`h-7 text-xs gap-1.5 ${crmPerspective === 'JR_ARCHITECT' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}`}
              onClick={() => setCrmPerspective('JR_ARCHITECT')}
            >
              <Layers className="w-3 h-3" /> CAD
            </Button>
            <Button
              size="sm"
              variant={crmPerspective === 'QUOTATION' ? 'default' : 'outline'}
              className={`h-7 text-xs gap-1.5 ${crmPerspective === 'QUOTATION' ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}`}
              onClick={() => setCrmPerspective('QUOTATION')}
            >
              <FileSpreadsheet className="w-3 h-3" /> Quotation
            </Button>
            <Button
              size="sm"
              variant={crmPerspective === 'VISIT_TEAM' ? 'default' : 'outline'}
              className={`h-7 text-xs gap-1.5 ${crmPerspective === 'VISIT_TEAM' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
              onClick={() => setCrmPerspective('VISIT_TEAM')}
            >
              <MapPin className="w-3 h-3" /> Site Visit
            </Button>
            <Button
              size="sm"
              variant={crmPerspective === 'ACCOUNTS' ? 'default' : 'outline'}
              className={`h-7 text-xs gap-1.5 ${crmPerspective === 'ACCOUNTS' ? 'bg-teal-600 hover:bg-teal-700 text-white' : ''}`}
              onClick={() => setCrmPerspective('ACCOUNTS')}
            >
              <CreditCard className="w-3 h-3" /> Accounts
            </Button>
            <Button
              size="sm"
              variant={crmPerspective === 'MY' ? 'default' : 'outline'}
              className="h-7 text-xs gap-1.5"
              onClick={() => setCrmPerspective('MY')}
            >
              <User className="w-3 h-3" /> My Follow-Ups
            </Button>
          </div>

          <div className="relative sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lead or notes..."
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        {/* Status Tabs */}
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as TabKey)} className="w-full">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            {(Object.keys(tabLabels) as TabKey[]).map((tab) => (
              <TabsTrigger key={tab} value={tab} className="text-xs sm:text-sm">
                {tabLabels[tab]}
                {tabState[tab].loaded && tabState[tab].total > 0 && (
                  <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px] h-4">
                    {tabState[tab].total}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6">
            {activeTab === 'pending' && renderTabContent('pending', <Clock className="w-12 h-12" />, 'No pending follow-ups')}
            {activeTab === 'today' && renderTabContent('today', <Calendar className="w-12 h-12" />, 'No follow-ups for today')}
            {activeTab === 'overdue' && renderTabContent('overdue', <CheckCircle2 className="w-12 h-12" />, 'No overdue follow-ups')}
            {activeTab === 'completed' && renderTabContent('completed', <CheckCircle2 className="w-12 h-12" />, 'No completed follow-ups')}
            {activeTab === 'missed' && renderTabContent('missed', <AlertCircle className="w-12 h-12" />, 'No missed follow-ups')}
          </div>
        </Tabs>
      </main>

      {/* Complete & Connect Next Follow-Up Dialog */}
      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Complete & Connect Next Follow-Up</DialogTitle>
            <DialogDescription>
              {selectedFollowup?.status === 'MISSED'
                ? 'This action will be marked lately done. Connect the next action to continue the client journey.'
                : 'Record the outcome and seamlessly connect the next action for Junior or Senior CRM.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground">
                Client Discussion Outcome & Notes <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
                placeholder="What did the client say? e.g. Discussed 3BHK layout; client requested budget review meeting with Senior CRM..."
                rows={3}
                className="mt-1 text-sm"
              />
            </div>

            {/* Next Connected Step Section */}
            <div className="rounded-lg border bg-muted/30 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Connect Next Follow-Up Action
                </span>
                <input
                  type="checkbox"
                  id="setNextFollowup"
                  checked={setNextFollowup}
                  onChange={(e) => setSetNextFollowup(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                />
              </div>

              {setNextFollowup && (
                <div className="space-y-3 pt-2 border-t">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground">
                        Next Action Date & Time
                      </label>
                      <Input
                        type="datetime-local"
                        value={nextFollowupDatetime}
                        onChange={(e) => setNextFollowupDatetime(e.target.value)}
                        className="mt-1 h-9 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground">
                        Category
                      </label>
                      <Select
                        value={nextFollowupCategory}
                        onValueChange={(val) => setNextFollowupCategory(val as FollowUpCategoryValue)}
                      >
                        <SelectTrigger className="mt-1 h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FOLLOWUP_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value} className="text-xs">
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Handover Assignment to Any Department */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground">
                      Assign Next Follow-Up To Department:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={nextAssignRole === 'JR_CRM' ? 'default' : 'outline'}
                        className={`h-7 text-xs ${nextAssignRole === 'JR_CRM' ? 'bg-sky-600 hover:bg-sky-700 text-white' : ''}`}
                        onClick={() => setNextAssignRole('JR_CRM')}
                      >
                        <UserCheck className="w-3 h-3 mr-1" />
                        Junior CRM
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={nextAssignRole === 'SR_CRM' ? 'default' : 'outline'}
                        className={`h-7 text-xs ${nextAssignRole === 'SR_CRM' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
                        onClick={() => setNextAssignRole('SR_CRM')}
                      >
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Senior CRM
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={nextAssignRole === 'VISUALIZER_3D' ? 'default' : 'outline'}
                        className={`h-7 text-xs ${nextAssignRole === 'VISUALIZER_3D' ? 'bg-pink-600 hover:bg-pink-700 text-white' : ''}`}
                        onClick={() => setNextAssignRole('VISUALIZER_3D')}
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        3D Visualizer
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={nextAssignRole === 'JR_ARCHITECT' ? 'default' : 'outline'}
                        className={`h-7 text-xs ${nextAssignRole === 'JR_ARCHITECT' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}`}
                        onClick={() => setNextAssignRole('JR_ARCHITECT')}
                      >
                        <Layers className="w-3 h-3 mr-1" />
                        CAD / Architect
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={nextAssignRole === 'QUOTATION' ? 'default' : 'outline'}
                        className={`h-7 text-xs ${nextAssignRole === 'QUOTATION' ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}`}
                        onClick={() => setNextAssignRole('QUOTATION')}
                      >
                        <FileSpreadsheet className="w-3 h-3 mr-1" />
                        Quotation
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={nextAssignRole === 'VISIT_TEAM' ? 'default' : 'outline'}
                        className={`h-7 text-xs ${nextAssignRole === 'VISIT_TEAM' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                        onClick={() => setNextAssignRole('VISIT_TEAM')}
                      >
                        <MapPin className="w-3 h-3 mr-1" />
                        Site Visit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={nextAssignRole === 'ACCOUNTS' ? 'default' : 'outline'}
                        className={`h-7 text-xs ${nextAssignRole === 'ACCOUNTS' ? 'bg-teal-600 hover:bg-teal-700 text-white' : ''}`}
                        onClick={() => setNextAssignRole('ACCOUNTS')}
                      >
                        <CreditCard className="w-3 h-3 mr-1" />
                        Accounts
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={nextAssignRole === 'SELF' ? 'default' : 'outline'}
                        className="h-7 text-xs"
                        onClick={() => setNextAssignRole('SELF')}
                      >
                        Myself
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">Other:</span>
                      <Select
                        value={['JR_CRM', 'SR_CRM', 'JR_ARCHITECT', 'VISUALIZER_3D', 'QUOTATION', 'VISIT_TEAM', 'ACCOUNTS', 'SELF'].includes(nextAssignRole) ? '' : nextAssignRole}
                        onValueChange={(val) => { if (val) setNextAssignRole(val) }}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue placeholder="Select another department..." />
                        </SelectTrigger>
                        <SelectContent>
                          {FOLLOWUP_DEPARTMENTS.filter(d => !['JR_CRM', 'SR_CRM', 'JR_ARCHITECT', 'VISUALIZER_3D', 'QUOTATION', 'VISIT_TEAM', 'ACCOUNTS'].includes(d.key)).map((dept) => (
                            <SelectItem key={dept.key} value={dept.key} className="text-xs">
                              {dept.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Instructions for Next Follow-Up
                    </label>
                    <Input
                      value={nextFollowupNote}
                      onChange={(e) => setNextFollowupNote(e.target.value)}
                      placeholder="e.g. Present 3D visualizer concepts and discuss material options"
                      className="mt-1 h-9 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {completeError && <p className="text-xs text-destructive">{completeError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCompleteOpen(false)} disabled={completing}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCompleteFollowup} disabled={completing}>
              {completing ? 'Saving & Connecting...' : 'Complete & Connect'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Connected Follow-Up Chain Dialog */}
      <ConnectedFollowupChainDialog
        open={chainDialogOpen}
        onOpenChange={setChainDialogOpen}
        leadId={selectedChainLead?.leadId ?? null}
        leadName={selectedChainLead?.lead.name}
        leadPhone={selectedChainLead?.lead.phone}
        leadEmail={selectedChainLead?.lead.email}
        assignedJrCrm={selectedChainLead?.assignedJrCrm}
        assignedSrCrm={selectedChainLead?.assignedSrCrm}
        onScheduleNext={(leadId) => {
          if (selectedChainLead) {
            openCompleteModal(selectedChainLead)
          }
        }}
      />
    </div>
  )
}
