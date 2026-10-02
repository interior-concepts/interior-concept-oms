'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  List,
  LayoutGrid,
  CircleDot,
  PhoneCall,
  Handshake,
  Sprout,
  CalendarCheck,
  CheckCircle2,
  Archive,
  Facebook,
  Instagram,
  MessageCircle,
  Globe,
  UserCircle2,
  X,
  Calendar,
  Users,
  FileText,
  Download,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react'
import LeadCreateModal from '@/components/crm/junior/LeadCreateModal'
import { LeadImportModal } from '@/components/crm/admin/lead-import-modal'
import { CrmPageHeader } from '@/components/crm/shared/page-header'
import { LeadDateRangeFilter, type LeadDatePreset } from '@/components/crm/shared/lead-date-range-filter'

const PAGE_SIZE = 20
const stages = [
  'NEW',
  'NUMBER_COLLECTED',
  'CONTACT_ATTEMPTED',
  'NURTURING',
  'VISIT_PHASE',
  'CAD_PHASE',
  'DISCOVERY',
  'QUOTATION_PHASE',
  'BUDGET_PHASE',
  'CONVERSION',
  'VISUALIZATION_PHASE',
  'CLOSED',
]
const stageGridStages = [
  'NUMBER_COLLECTED',
  'CONTACT_ATTEMPTED',
  'NURTURING',
  'VISIT_PHASE',
  'CAD_PHASE',
  'DISCOVERY',
  'QUOTATION_PHASE',
  'BUDGET_PHASE',
  'CONVERSION',
  'VISUALIZATION_PHASE',
  'CLOSED',
]
const sourceFilterOptions = ['ALL', 'WhatsApp', 'Facebook', 'Instagram', 'Website', 'Manual', 'Referral']
const assignmentFilterOptions = ['ALL', 'UNASSIGNED']

type ViewMode = 'list' | 'card'

const stageColors: Record<string, string> = {
  NEW: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
  NUMBER_COLLECTED: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200',
  DISCOVERY: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
  CAD_PHASE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  QUOTATION_PHASE: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  BUDGET_PHASE: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200',
  VISUALIZATION_PHASE: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-200',
  CONVERSION: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  VISIT_PHASE: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
  CONTACT_ATTEMPTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  NURTURING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
  CLOSED: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
}

const stageStatConfig: Record<string, { icon: typeof CircleDot; tint: string }> = {
  NEW: { icon: CircleDot, tint: 'text-slate-600 bg-slate-100 dark:bg-slate-900/40 dark:text-slate-200' },
  NUMBER_COLLECTED: { icon: PhoneCall, tint: 'text-cyan-700 bg-cyan-100 dark:bg-cyan-900/40 dark:text-cyan-200' },
  DISCOVERY: { icon: Handshake, tint: 'text-violet-700 bg-violet-100 dark:bg-violet-900/40 dark:text-violet-200' },
  CAD_PHASE: { icon: LayoutGrid, tint: 'text-orange-700 bg-orange-100 dark:bg-orange-900/40 dark:text-orange-200' },
  QUOTATION_PHASE: { icon: List, tint: 'text-sky-700 bg-sky-100 dark:bg-sky-900/40 dark:text-sky-200' },
  BUDGET_PHASE: { icon: CircleDot, tint: 'text-teal-700 bg-teal-100 dark:bg-teal-900/40 dark:text-teal-200' },
  VISUALIZATION_PHASE: { icon: LayoutGrid, tint: 'text-pink-700 bg-pink-100 dark:bg-pink-900/40 dark:text-pink-200' },
  CONVERSION: { icon: CheckCircle2, tint: 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-200' },
  VISIT_PHASE: { icon: CalendarCheck, tint: 'text-purple-700 bg-purple-100 dark:bg-purple-900/40 dark:text-purple-200' },
  CONTACT_ATTEMPTED: { icon: Handshake, tint: 'text-blue-700 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-200' },
  NURTURING: { icon: Sprout, tint: 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/40 dark:text-yellow-200' },
  CLOSED: { icon: Archive, tint: 'text-green-700 bg-green-100 dark:bg-green-900/40 dark:text-green-200' },
}

type DepartmentSummary = {
  id: string
  name: string
}

type DepartmentUser = {
  id: string
  fullName: string
  email: string
}

const sourceVisualMap: Record<
  string,
  { icon: LucideIcon; bgClass: string; iconClass: string; dotClass: string; label: string }
> = {
  facebook: {
    icon: Facebook,
    bgClass: 'bg-blue-100',
    iconClass: 'text-blue-700',
    dotClass: 'bg-blue-500',
    label: 'Facebook',
  },
  instagram: {
    icon: Instagram,
    bgClass: 'bg-pink-100',
    iconClass: 'text-pink-700',
    dotClass: 'bg-pink-500',
    label: 'Instagram',
  },
  whatsapp: {
    icon: MessageCircle,
    bgClass: 'bg-emerald-100',
    iconClass: 'text-emerald-700',
    dotClass: 'bg-emerald-500',
    label: 'WhatsApp',
  },
  website: {
    icon: Globe,
    bgClass: 'bg-slate-100',
    iconClass: 'text-slate-700',
    dotClass: 'bg-slate-500',
    label: 'Website',
  },
}

function formatStageDisplay(stage: string): string {
  if (stage === 'DISCOVERY') return 'Consulting Phase'
  return stage.replace(/_/g, ' ')
}

function getSourceVisual(source: string | null | undefined) {
  const key = (source ?? '').trim().toLowerCase()
  return (
    sourceVisualMap[key] ?? {
      icon: UserCircle2,
      bgClass: 'bg-zinc-100',
      iconClass: 'text-zinc-700',
      dotClass: 'bg-zinc-500',
      label: source?.trim() || 'Unknown',
    }
  )
}

type LeadSummary = {
  id: string
  clientId?: number | null
  name: string
  phone: string | null
  email: string | null
  source: string | null
  stage: string
  location: string | null
  created_at: string
  assignments?: Array<{
    id: string
    department: string
    user: { id: string; fullName: string; email: string }
  }>
  latestVisit?: {
    id: string
    scheduledAt: string
    status: string
    location: string
    result?: { completedAt: string } | null
    assignedTo?: { id: string; fullName: string } | null
    supportAssignments?: Array<{ supportUser: { id: string; fullName: string } }>
  } | null
  meetings?: Array<{
    id: string
    type: string
    title: string
    startsAt: string
    endsAt?: string | null
    notes?: string | null
    createdBy: { id: string; fullName: string }
  }>
  cadStatus?: {
    status: string
    completedAt?: string | null
  } | null
  cadSubmissions?: Array<{
    id: string
    note?: string | null
    submittedAt: string
    submittedBy?: { id: string; fullName: string } | null
    files: Array<{
      id: string
      url: string
      fileName: string
      fileType: string
      cadFileType: string
      sizeBytes?: number | null
      createdAt: string
    }>
  }>
  quotationDrafts?: Array<{
    id: string
    draftKey: string
    quotationType?: string | null
    projectSqft?: number | null
    status: string
    grandTotal: number
    createdAt?: string | null
    updatedAt: string
    createdBy?: { id: string; fullName: string } | null
    updatedBy?: { id: string; fullName: string } | null
  }>
  lastFollowup?: {
    id: string
    followupDate: string
    notes?: string | null
    status: string
    category: string
    assignedTo: { id: string; fullName: string }
  } | null
  nextFollowup?: {
    id: string
    followupDate: string
    notes?: string | null
    status: string
    category: string
    assignedTo: { id: string; fullName: string }
  } | null
}

type LeadsResponse = {
  success: boolean
  data?: LeadSummary[]
  meta?: {
    total: number
    offset: number
    nextOffset: number | null
    hasMore: boolean
    stageCounts?: Record<string, number>
  }
}

function mergeUniqueLeads(existing: LeadSummary[], incoming: LeadSummary[]): LeadSummary[] {
  const seen = new Set(existing.map((lead) => lead.id))
  const merged = [...existing]
  for (const lead of incoming) {
    if (!seen.has(lead.id)) {
      seen.add(lead.id)
      merged.push(lead)
    }
  }
  return merged
}

type LeadsCacheEntry = {
  key: string
  savedAt: number
  leads: LeadSummary[]
  totalCount: number
  nextOffset: number | null
  hasMore: boolean
  stageCounts: Record<string, number>
}

const LEADS_CACHE_TTL_MS = 60_000
let leadsCache: LeadsCacheEntry | null = null
const leadsRequestMap = new Map<string, Promise<LeadsResponse>>()
const DEFAULT_LIFETIME_START_DATE = '2026-03-25'

function formatDateInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDate(dateStr: string | null | undefined, opts?: { includeTime?: boolean }): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '—'
  const day = d.getDate().toString().padStart(2, '0')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[d.getMonth()]
  const year = d.getFullYear()
  if (opts?.includeTime) {
    const hours = d.getHours().toString().padStart(2, '0')
    const minutes = d.getMinutes().toString().padStart(2, '0')
    return `${day} ${month} ${year} ${hours}:${minutes}`
  }
  return `${day} ${month} ${year}`
}

function getTodayRange(): { from: string; to: string } {
  const today = formatDateInput(new Date())
  return { from: today, to: today }
}

function getPreviousDayRange(): { from: string; to: string } {
  const now = new Date()
  const previous = new Date(now)
  previous.setDate(previous.getDate() - 1)
  const previousDate = formatDateInput(previous)
  return {
    from: previousDate,
    to: previousDate,
  }
}

function getThisMonthRange(): { from: string; to: string } {
  const now = new Date()
  return {
    from: formatDateInput(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: formatDateInput(now),
  }
}

function getLast7DaysRange(): { from: string; to: string } {
  const now = new Date()
  const from = new Date(now)
  from.setDate(from.getDate() - 6)
  return { from: formatDateInput(from), to: formatDateInput(now) }
}

function getLastMonthRange(): { from: string; to: string } {
  const now = new Date()
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
  return { from: formatDateInput(firstDayLastMonth), to: formatDateInput(lastDayLastMonth) }
}

function getLifetimeStartDate(): string {
  const envValue = process.env.NEXT_PUBLIC_LEAD_LIFETIME_START_DATE?.trim()
  if (envValue && /^\d{4}-\d{2}-\d{2}$/.test(envValue)) {
    return envValue
  }
  return DEFAULT_LIFETIME_START_DATE
}

function getLifetimeRange(): { from: string; to: string } {
  return {
    from: getLifetimeStartDate(),
    to: formatDateInput(new Date()),
  }
}

function isLeadDatePreset(value: string | null): value is LeadDatePreset {
  return (
    value === 'TODAY' ||
    value === 'PREVIOUS_DAY' ||
    value === 'THIS_MONTH' ||
    value === 'LAST_7_DAYS' ||
    value === 'LAST_MONTH' ||
    value === 'LIFETIME' ||
    value === 'CUSTOM'
  )
}

function getRangeForPreset(preset: LeadDatePreset): { from: string; to: string } {
  if (preset === 'TODAY') return getTodayRange()
  if (preset === 'PREVIOUS_DAY') return getPreviousDayRange()
  if (preset === 'LAST_7_DAYS') return getLast7DaysRange()
  if (preset === 'LAST_MONTH') return getLastMonthRange()
  if (preset === 'LIFETIME') return getLifetimeRange()
  return getThisMonthRange()
}

export default function LeadsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const leadListQuery = useMemo(() => searchParams.toString(), [searchParams])
  const defaultRange = useMemo(() => getTodayRange(), [])
  const initialFilters = useMemo(() => {
    const rawPreset = searchParams.get('preset')
    const preset: LeadDatePreset = isLeadDatePreset(rawPreset) ? rawPreset : 'TODAY'
    const fallbackRange = preset === 'CUSTOM' ? defaultRange : getRangeForPreset(preset)
    const from = searchParams.get('from')?.trim() || fallbackRange.from
    const to = searchParams.get('to')?.trim() || fallbackRange.to
    const rawStage = searchParams.get('stage')?.trim() || 'ALL'
    const rawSource = searchParams.get('source')?.trim() || 'ALL'
    const rawAssignment = searchParams.get('assignment')?.trim() || 'ALL'
    const rawView = searchParams.get('view')?.trim() || 'list'

    return {
      search: searchParams.get('q')?.trim() || '',
      stage: stages.includes(rawStage) || rawStage === 'ALL' ? rawStage : 'ALL',
      source: sourceFilterOptions.includes(rawSource) ? rawSource : 'ALL',
      assignment: rawAssignment === 'UNASSIGNED' ? ('UNASSIGNED' as const) : ('ALL' as const),
      preset,
      createdFrom: from,
      createdTo: to,
      view: rawView === 'card' ? ('card' as const) : ('list' as const),
    }
  }, [defaultRange, searchParams])
  const [leads, setLeads] = useState<LeadSummary[]>([])
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchInput, setSearchInput] = useState(initialFilters.search)
  const [search, setSearch] = useState(initialFilters.search)
  const [stageFilter, setStageFilter] = useState(initialFilters.stage)
  const [sourceFilter, setSourceFilter] = useState(initialFilters.source)
  const [assignmentFilter, setAssignmentFilter] = useState<'ALL' | 'UNASSIGNED'>(initialFilters.assignment)
  const [datePreset, setDatePreset] = useState<LeadDatePreset>(initialFilters.preset)
  const [createdFrom, setCreatedFrom] = useState(initialFilters.createdFrom)
  const [createdTo, setCreatedTo] = useState(initialFilters.createdTo)
  const [viewMode, setViewMode] = useState<ViewMode>(initialFilters.view)
  const [stageCounts, setStageCounts] = useState<Record<string, number>>({})
  const [totalCount, setTotalCount] = useState(0)
  const [nextOffset, setNextOffset] = useState<number | null>(0)
  const [hasMore, setHasMore] = useState(true)
  const [canBatchAssign, setCanBatchAssign] = useState(true)
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const [meetingModalLead, setMeetingModalLead] = useState<LeadSummary | null>(null)
  const [cadModalLead, setCadModalLead] = useState<LeadSummary | null>(null)
  const [quotationModalLead, setQuotationModalLead] = useState<LeadSummary | null>(null)
  const [batchAssignOpen, setBatchAssignOpen] = useState(false)
  const [departments, setDepartments] = useState<DepartmentSummary[]>([])
  const [departmentUsers, setDepartmentUsers] = useState<DepartmentUser[]>([])
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [loadingDepartments, setLoadingDepartments] = useState(false)
  const [loadingDepartmentUsers, setLoadingDepartmentUsers] = useState(false)
  const [submittingBatchAssign, setSubmittingBatchAssign] = useState(false)
  const [submittingBatchDelete, setSubmittingBatchDelete] = useState(false)
  const [batchAssignMessage, setBatchAssignMessage] = useState<string | null>(null)
  const [batchAssignError, setBatchAssignError] = useState<string | null>(null)
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false)

  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const inFlightKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (searchParams.get('view')) return
    const mediaQuery = window.matchMedia('(max-width: 1024px)')
    setViewMode(mediaQuery.matches ? 'card' : 'list')
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (stageFilter !== 'ALL') params.set('stage', stageFilter)
    if (sourceFilter !== 'ALL') params.set('source', sourceFilter)
    if (assignmentFilter !== 'ALL') params.set('assignment', assignmentFilter)
    params.set('preset', datePreset)
    if (createdFrom) params.set('from', createdFrom)
    if (createdTo) params.set('to', createdTo)
    if (viewMode !== 'list') params.set('view', viewMode)

    const nextQuery = params.toString()
    const currentQuery = searchParams.toString()
    if (nextQuery === currentQuery) return

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
  }, [
    assignmentFilter,
    createdFrom,
    createdTo,
    datePreset,
    pathname,
    router,
    search,
    searchParams,
    sourceFilter,
    stageFilter,
    viewMode,
  ])

  useEffect(() => {
    const loadMe = async () => {
      try {
        const response = await fetch('/api/me', { cache: 'no-store' })
        if (!response.ok) return
        const payload = (await response.json()) as {
          userDepartments?: Array<{ department?: { name?: string } }>
        }
        const hasAdminDepartment = (payload.userDepartments ?? []).some(
          (row) => row.department?.name === 'ADMIN',
        )
        setCanBatchAssign(hasAdminDepartment)
      } catch (error) {
        console.error('Failed to detect batch assignment permission:', error)
      }
    }

    void loadMe()
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
    }, 300)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  const fetchLeads = useCallback(async (offset: number, replace: boolean) => {
    try {
      const filterKey = `${search}|${stageFilter}|${sourceFilter}|${assignmentFilter}|${createdFrom}|${createdTo}`
      const requestKey = `${filterKey}|${offset}|${replace ? 'replace' : 'append'}`

      if (inFlightKeyRef.current === requestKey) {
        return
      }
      inFlightKeyRef.current = requestKey

      if (replace && offset === 0) {
        const cached = leadsCache
        const cacheIsFresh =
          cached &&
          cached.key === filterKey &&
          Date.now() - cached.savedAt < LEADS_CACHE_TTL_MS
        if (cacheIsFresh) {
          setLeads(cached.leads)
          setNextOffset(cached.nextOffset)
          setHasMore(cached.hasMore)
          setTotalCount(cached.totalCount)
          setStageCounts(cached.stageCounts)
          return
        }
      }

      if (replace) {
        setLoadingInitial(true)
      } else {
        setLoadingMore(true)
      }

      const params = new URLSearchParams({
        limit: PAGE_SIZE.toString(),
        offset: offset.toString(),
        includeEnriched: '1',
      })

      if (search) {
        params.set('search', search)
      }

      if (stageFilter !== 'ALL') {
        params.set('stage', stageFilter)
      }

      if (sourceFilter !== 'ALL') {
        params.set('source', sourceFilter)
      }

      if (assignmentFilter === 'UNASSIGNED') {
        params.set('unassigned', '1')
      }

      if (createdFrom) {
        params.set('createdFrom', createdFrom)
      }

      if (createdTo) {
        params.set('createdTo', createdTo)
      }

      let payloadPromise = leadsRequestMap.get(requestKey)
      if (!payloadPromise) {
        payloadPromise = fetch(`/api/lead?${params.toString()}`)
          .then(async (res) => {
            const payload = (await res.json()) as LeadsResponse
            if (!res.ok || !payload.success) {
              throw new Error('Failed to load leads')
            }
            return payload
          })
          .finally(() => {
            leadsRequestMap.delete(requestKey)
          })
        leadsRequestMap.set(requestKey, payloadPromise)
      }

      const payload = await payloadPromise

      const pageData = payload.data ?? []
      const meta = payload.meta

      setLeads((prev) => {
        const nextLeads = replace ? pageData : mergeUniqueLeads(prev, pageData)
        if (replace && offset === 0) {
          leadsCache = {
            key: filterKey,
            savedAt: Date.now(),
            leads: nextLeads,
            totalCount: meta?.total ?? 0,
            nextOffset: meta?.nextOffset ?? null,
            hasMore: Boolean(meta?.hasMore),
            stageCounts: meta?.stageCounts ?? {},
          }
        }
        return nextLeads
      })
      setNextOffset(meta?.nextOffset ?? null)
      setHasMore(Boolean(meta?.hasMore))
      setTotalCount(meta?.total ?? 0)
      setStageCounts(meta?.stageCounts ?? {})
    } catch (error) {
      console.error('Error fetching leads:', error)
      if (replace) {
        setLeads([])
        setHasMore(false)
        setNextOffset(null)
        setTotalCount(0)
      }
    } finally {
      inFlightKeyRef.current = null
      setLoadingInitial(false)
      setLoadingMore(false)
    }
  }, [assignmentFilter, createdFrom, createdTo, search, sourceFilter, stageFilter])

  useEffect(() => {
    fetchLeads(0, true)
  }, [fetchLeads])

  useEffect(() => {
    const sentinel = sentinelRef.current

    if (!sentinel || !hasMore || loadingInitial || loadingMore || nextOffset === null) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && !loadingMore) {
          fetchLeads(nextOffset, false)
        }
      },
      { rootMargin: '400px 0px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [fetchLeads, hasMore, loadingInitial, loadingMore, nextOffset])

  const refreshLeads = useCallback(() => {
    fetchLeads(0, true)
  }, [fetchLeads])

  const applyDatePreset = useCallback((preset: LeadDatePreset) => {
    if (preset === 'CUSTOM') {
      setDatePreset('CUSTOM')
      return
    }
    let range = getThisMonthRange()
    if (preset === 'TODAY') range = getTodayRange()
    if (preset === 'PREVIOUS_DAY') range = getPreviousDayRange()
    if (preset === 'LAST_7_DAYS') range = getLast7DaysRange()
    if (preset === 'LAST_MONTH') range = getLastMonthRange()
    if (preset === 'LIFETIME') range = getLifetimeRange()
    setDatePreset(preset)
    setCreatedFrom(range.from)
    setCreatedTo(range.to)
  }, [])

  const fetchDepartments = useCallback(async () => {
    setLoadingDepartments(true)
    try {
      const response = await fetch('/api/department', { cache: 'no-store' })
      const payload = (await response.json()) as {
        success: boolean
        data?: Array<{ id: string; name: string }>
      }
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error('Failed to load departments')
      }
      setDepartments(payload.data)
    } catch (error) {
      console.error('Error fetching departments:', error)
      setBatchAssignError('Failed to load departments')
    } finally {
      setLoadingDepartments(false)
    }
  }, [])

  const fetchUsersForDepartment = useCallback(async (departmentId: string) => {
    if (!departmentId) {
      setDepartmentUsers([])
      return
    }

    setLoadingDepartmentUsers(true)
    try {
      const response = await fetch(`/api/department/${departmentId}/users`, { cache: 'no-store' })
      const payload = (await response.json()) as {
        success: boolean
        data?: { users: DepartmentUser[] }
      }
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error('Failed to load department users')
      }
      setDepartmentUsers(payload.data.users ?? [])
    } catch (error) {
      console.error('Error fetching department users:', error)
      setDepartmentUsers([])
      setBatchAssignError('Failed to load users for selected department')
    } finally {
      setLoadingDepartmentUsers(false)
    }
  }, [])

  useEffect(() => {
    void fetchUsersForDepartment(selectedDepartmentId)
  }, [fetchUsersForDepartment, selectedDepartmentId])

  const openBatchAssignModal = useCallback(async () => {
    if (!canBatchAssign) return
    setBatchAssignError(null)
    setBatchAssignMessage(null)
    setSelectedDepartmentId('')
    setSelectedUserId('')
    setDepartmentUsers([])
    setBatchAssignOpen(true)

    if (departments.length === 0) {
      await fetchDepartments()
    }
  }, [canBatchAssign, departments.length, fetchDepartments])

  const submitBatchAssign = useCallback(async () => {
    const department = departments.find((item) => item.id === selectedDepartmentId)
    if (!department || !selectedUserId || selectedLeadIds.length === 0) {
      setBatchAssignError('Select leads, department, and user before submitting')
      return
    }

    setSubmittingBatchAssign(true)
    setBatchAssignError(null)
    setBatchAssignMessage(null)
    try {
      const response = await fetch('/api/lead/assignments/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadIds: selectedLeadIds,
          department: department.name,
          userId: selectedUserId,
        }),
      })

      const payload = (await response.json()) as {
        success: boolean
        message?: string
        error?: string
      }

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to assign selected leads')
      }

      setBatchAssignMessage(payload.message || 'Batch assignment completed')
      setSelectedLeadIds([])
      setBatchAssignOpen(false)
      await fetchLeads(0, true)
    } catch (error) {
      setBatchAssignError(error instanceof Error ? error.message : 'Batch assignment failed')
    } finally {
      setSubmittingBatchAssign(false)
    }
  }, [departments, fetchLeads, selectedDepartmentId, selectedLeadIds, selectedUserId])

  const submitBatchDelete = useCallback(async () => {
    if (selectedLeadIds.length === 0) {
      setBatchAssignError('Select at least one lead before deleting')
      return
    }

    setSubmittingBatchDelete(true)
    setBatchAssignError(null)
    setBatchAssignMessage(null)
    try {
      const response = await fetch('/api/lead/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: selectedLeadIds }),
      })

      const payload = (await response.json()) as {
        success: boolean
        message?: string
        error?: string
      }

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to delete selected leads')
      }

      setBatchAssignMessage(payload.message || 'Batch delete completed')
      setSelectedLeadIds([])
      setBatchDeleteOpen(false)
      await fetchLeads(0, true)
    } catch (error) {
      setBatchAssignError(error instanceof Error ? error.message : 'Batch delete failed')
    } finally {
      setSubmittingBatchDelete(false)
    }
  }, [fetchLeads, selectedLeadIds])

  const displayedCount = useMemo(() => leads.length, [leads])
  const getLeadHref = useCallback(
    (leadId: string) => {
      const query = leadListQuery
      return `/crm/admin/leads/${leadId}${query ? `?${query}` : ''}`
    },
    [leadListQuery],
  )
  const allVisibleSelected = useMemo(
    () => leads.length > 0 && leads.every((lead) => selectedLeadIds.includes(lead.id)),
    [leads, selectedLeadIds],
  )

  const toggleLeadSelection = useCallback((leadId: string, checked: boolean) => {
    setSelectedLeadIds((prev) => {
      if (checked) {
        if (prev.includes(leadId)) return prev
        return [...prev, leadId]
      }
      return prev.filter((id) => id !== leadId)
    })
  }, [])

  const toggleSelectAllVisible = useCallback((checked: boolean) => {
    setSelectedLeadIds((prev) => {
      if (!checked) {
        const visible = new Set(leads.map((lead) => lead.id))
        return prev.filter((id) => !visible.has(id))
      }

      const merged = new Set(prev)
      for (const lead of leads) {
        merged.add(lead.id)
      }
      return Array.from(merged)
    })
  }, [leads])

  const renderLoadingSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={idx} className="rounded-lg border border-border p-4 animate-pulse">
          <div className="h-4 w-40 rounded bg-muted" />
          <div className="mt-2 h-3 w-28 rounded bg-muted" />
          <div className="mt-3 h-3 w-52 rounded bg-muted" />
        </div>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <CrmPageHeader
        title="Leads"
        subtitle="View and manage all leads"
      />
      <main className="w-full px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-end gap-2">
            <LeadImportModal onImported={refreshLeads} />
            <LeadCreateModal onCreated={refreshLeads} />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-6">
            {stageGridStages.map((stage) => {
              const config = stageStatConfig[stage]
              const Icon = config.icon
              const isActive = stageFilter === stage
              return (
                <Card
                  key={stage}
                  className={`border-border bg-card transition ${isActive ? 'ring-2 ring-primary/40' : 'hover:border-primary/30'}`}
                >
                  <CardContent className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                    <button
                      type="button"
                      onClick={() => setStageFilter((prev) => (prev === stage ? 'ALL' : stage))}
                      className="flex w-full flex-col items-center justify-center gap-2 text-center"
                    >
                      <div className={`inline-flex size-10 items-center justify-center rounded-lg ${config.tint}`}>
                        <Icon className="size-5" />
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">{formatStageDisplay(stage)}</p>
                      <p className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">{stageCounts[stage] ?? 0}</p>
                    </button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by client ID, name, phone or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
            <LeadDateRangeFilter
              preset={datePreset}
              createdFrom={createdFrom}
              createdTo={createdTo}
              onPresetChange={applyDatePreset}
              onCreatedFromChange={setCreatedFrom}
              onCreatedToChange={setCreatedTo}
              onReset={() => applyDatePreset('THIS_MONTH')}
            />
            <Select value={assignmentFilter} onValueChange={(value) => setAssignmentFilter(value as 'ALL' | 'UNASSIGNED')}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Assignment" />
              </SelectTrigger>
              <SelectContent>
                {assignmentFilterOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === 'ALL' ? 'All Leads' : 'Unassigned'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                {sourceFilterOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === 'ALL' ? 'All Sources' : option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {stageFilter !== 'ALL' ? (
              <Button variant="outline" onClick={() => setStageFilter('ALL')}>
                Clear Stage ({formatStageDisplay(stageFilter)})
              </Button>
            ) : null}
            {sourceFilter !== 'ALL' ? (
              <Button variant="outline" onClick={() => setSourceFilter('ALL')}>
                Clear Source ({sourceFilter})
              </Button>
            ) : null}
            {assignmentFilter !== 'ALL' ? (
              <Button variant="outline" onClick={() => setAssignmentFilter('ALL')}>
                Clear Assignment (Unassigned)
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={() => void openBatchAssignModal()}
              disabled={selectedLeadIds.length === 0 || !canBatchAssign}
            >
              Batch Assign ({selectedLeadIds.length})
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setBatchAssignError(null)
                setBatchAssignMessage(null)
                setBatchDeleteOpen(true)
              }}
              disabled={selectedLeadIds.length === 0 || !canBatchAssign}
            >
              Batch Delete ({selectedLeadIds.length})
            </Button>
            <div className="inline-flex rounded-md border border-border p-1">
              <Button
                type="button"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="gap-2"
              >
                <List className="h-4 w-4" /> List
              </Button>
              <Button
                type="button"
                variant={viewMode === 'card' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('card')}
                className="gap-2"
              >
                <LayoutGrid className="h-4 w-4" /> Cards
              </Button>
            </div>
          </div>

          {batchAssignMessage ? (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {batchAssignMessage}
            </div>
          ) : null}
          {batchAssignError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {batchAssignError}
            </div>
          ) : null}
          {!canBatchAssign ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Batch actions are available only for users mapped to the ADMIN department.
            </div>
          ) : null}

          <Card className="border-border bg-card overflow-hidden max-w-full shadow-sm">
            <CardHeader className="px-4 py-4 sm:px-6 border-b border-border/50">
              <CardTitle className="text-foreground">Leads ({displayedCount}/{totalCount})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingInitial ? (
                <div className="p-4 sm:p-6">
                  {renderLoadingSkeleton()}
                </div>
              ) : leads.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">No leads found.</div>
              ) : viewMode === 'card' ? (
                <div className="p-4 sm:p-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {leads.map((lead) => (
                    <Card key={lead.id} className="border-border">
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <label className="mt-1 inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedLeadIds.includes(lead.id)}
                              onChange={(event) => toggleLeadSelection(lead.id, event.target.checked)}
                              disabled={!canBatchAssign}
                              className="h-4 w-4 rounded border-border"
                            />
                          </label>
                          <div className="flex flex-1 items-start gap-3">
                            {(() => {
                              const sourceVisual = getSourceVisual(lead.source)
                              const SourceIcon = sourceVisual.icon
                              return (
                                <div className="relative">
                                  <div className={`flex h-9 w-9 items-center justify-center rounded-full ${sourceVisual.bgClass}`}>
                                    <SourceIcon className={`h-4 w-4 ${sourceVisual.iconClass}`} />
                                  </div>
                                  <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white ${sourceVisual.dotClass}`} />
                                </div>
                              )
                            })()}
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-foreground">{lead.name}</p>
                                {lead.clientId ? (
                                  <span className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                                    #{lead.clientId}
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-xs text-muted-foreground">{lead.email || 'No email'}</p>
                              <p className="text-[11px] text-muted-foreground">Source: {lead.source || 'Unknown'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Phone: {lead.phone || '—'}</p>
                          <p>Senior CRM: {lead.assignments?.[0]?.user?.fullName || 'Unassigned'}</p>
                          <p>Location: {lead.location || '—'}</p>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${stageColors[lead.stage]}`}>
                            {formatStageDisplay(lead.stage)}
                          </span>
                          <Link href={getLeadHref(lead.id)}>
                            <Button variant="outline" size="sm">View</Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="w-full overflow-x-auto touch-pan-x scrollbar-thin">
                  <table className="w-full min-w-[1450px] text-sm divide-y divide-border">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="px-4 py-3.5 text-left font-semibold text-muted-foreground w-12">
                          <input
                            type="checkbox"
                            checked={allVisibleSelected}
                            onChange={(event) => toggleSelectAllVisible(event.target.checked)}
                            disabled={!canBatchAssign}
                            className="h-4 w-4 rounded border-border"
                            aria-label="Select all visible leads"
                          />
                        </th>
                        <th className="px-4 py-3.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Client ID</th>
                        <th className="px-4 py-3.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Client Info</th>
                        <th className="px-4 py-3.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Stage</th>
                        <th className="px-4 py-3.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Visit Details</th>
                        <th className="px-4 py-3.5 text-center font-semibold text-muted-foreground whitespace-nowrap">CAD</th>
                        <th className="px-4 py-3.5 text-center font-semibold text-muted-foreground whitespace-nowrap">Meeting</th>
                        <th className="px-4 py-3.5 text-center font-semibold text-muted-foreground whitespace-nowrap">Quotation</th>
                        <th className="px-4 py-3.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Last Followup</th>
                        <th className="px-4 py-3.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Next Followup</th>
                        <th className="px-4 py-3.5 text-center font-semibold text-muted-foreground whitespace-nowrap">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                      {leads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-muted/40 transition-colors">
                          <td className="py-4 px-4 align-top">
                            <input
                              type="checkbox"
                              checked={selectedLeadIds.includes(lead.id)}
                              onChange={(event) => toggleLeadSelection(lead.id, event.target.checked)}
                              disabled={!canBatchAssign}
                              className="h-4 w-4 rounded border-border mt-1"
                              aria-label={`Select ${lead.name}`}
                            />
                          </td>

                          {/* 1. Client ID */}
                          <td className="py-4 px-4 align-top font-bold text-primary whitespace-nowrap">
                            {lead.clientId ? `#${lead.clientId}` : '—'}
                          </td>

                          {/* 2. Client Info (Name, Phone, Address/Location) */}
                          <td className="py-4 px-4 align-top min-w-[220px]">
                            <div className="flex items-start gap-2.5">
                              {(() => {
                                const sourceVisual = getSourceVisual(lead.source)
                                const SourceIcon = sourceVisual.icon
                                return (
                                  <div className="relative mt-0.5 shrink-0">
                                    <div className={`flex h-7 w-7 items-center justify-center rounded-full ${sourceVisual.bgClass}`}>
                                      <SourceIcon className={`h-3.5 w-3.5 ${sourceVisual.iconClass}`} />
                                    </div>
                                    <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white ${sourceVisual.dotClass}`} />
                                  </div>
                                )
                              })()}
                              <div className="space-y-1">
                                <div className="font-semibold text-foreground text-sm leading-tight">{lead.name}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <PhoneCall className="h-3 w-3 text-muted-foreground shrink-0" />
                                  <span>{lead.phone || '—'}</span>
                                </div>
                                <div className="text-xs text-muted-foreground flex items-start gap-1">
                                  <span className="shrink-0">📍</span>
                                  <span>{lead.location || 'No address'}</span>
                                </div>
                                <div className="text-[11px] text-muted-foreground/80">
                                  Source: <span className="font-medium">{lead.source || 'Unknown'}</span>
                                  {lead.email ? ` • ${lead.email}` : ''}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Stage */}
                          <td className="py-4 px-4 align-top whitespace-nowrap">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${stageColors[lead.stage] || 'bg-muted text-foreground'}`}>
                              {formatStageDisplay(lead.stage)}
                            </span>
                            {lead.assignments?.[0]?.user?.fullName ? (
                              <div className="text-[11px] text-muted-foreground mt-1">
                                Sr: {lead.assignments[0].user.fullName}
                              </div>
                            ) : null}
                          </td>

                          {/* 3. Visit (Visit schedule date, visit complete time, visit team members) */}
                          <td className="py-4 px-4 align-top min-w-[210px]">
                            {lead.latestVisit ? (
                              <div className="space-y-1 text-xs">
                                <div className="flex items-center gap-1.5 font-medium text-foreground">
                                  <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                                  <span>Sched: {formatDate(lead.latestVisit.scheduledAt, { includeTime: true })}</span>
                                </div>
                                {lead.latestVisit.result?.completedAt ? (
                                  <div className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                    <span>✓ Done: {formatDate(lead.latestVisit.result.completedAt, { includeTime: true })}</span>
                                  </div>
                                ) : (
                                  <div className="text-amber-600 dark:text-amber-400 text-[11px] font-medium">
                                    Status: {lead.latestVisit.status.replace(/_/g, ' ')}
                                  </div>
                                )}
                                <div className="flex flex-wrap items-center gap-1 text-muted-foreground pt-0.5">
                                  <Users className="h-3 w-3 shrink-0 text-muted-foreground" />
                                  {lead.latestVisit.assignedTo ? (
                                    <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium">
                                      {lead.latestVisit.assignedTo.fullName}
                                    </span>
                                  ) : null}
                                  {lead.latestVisit.supportAssignments?.map((s) => (
                                    <span key={s.supportUser.id} className="rounded bg-muted/80 px-1.5 py-0.5 text-[10px]">
                                      {s.supportUser.fullName}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>

                          {/* 4. CAD (if CAD files exist, button to open modal with all files; if none show X) */}
                          <td className="py-4 px-4 align-top text-center whitespace-nowrap min-w-[120px]">
                            {(() => {
                              const cadFiles = lead.cadSubmissions?.flatMap((sub) =>
                                sub.files.map((f) => ({
                                  ...f,
                                  note: sub.note,
                                  submittedBy: sub.submittedBy,
                                  submittedAt: sub.submittedAt,
                                }))
                              ) ?? []

                              if (cadFiles.length > 0) {
                                return (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs gap-1.5 font-semibold border-primary/40 text-primary hover:bg-primary/10"
                                    onClick={() => setCadModalLead(lead)}
                                  >
                                    <FileText className="h-3.5 w-3.5" />
                                    <span>CAD ({cadFiles.length})</span>
                                  </Button>
                                )
                              }

                              if (lead.cadStatus?.status === 'COMPLETED' || lead.cadStatus?.status === 'APPROVED') {
                                return (
                                  <div className="inline-flex flex-col items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="h-5 w-5" />
                                    <span className="text-[10px] font-bold uppercase">Completed</span>
                                  </div>
                                )
                              }

                              if (lead.cadStatus?.status) {
                                return (
                                  <span className="inline-block rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-2 py-0.5 text-[11px] font-semibold">
                                    {lead.cadStatus.status.replace(/_/g, ' ')}
                                  </span>
                                )
                              }

                              return (
                                <div className="inline-flex items-center justify-center text-red-500">
                                  <X className="h-5 w-5" />
                                </div>
                              )
                            })()}
                          </td>

                          {/* 5. Meeting (modal button showing time + date and remarks) */}
                          <td className="py-4 px-4 align-top text-center whitespace-nowrap min-w-[120px]">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs gap-1.5 font-medium"
                              onClick={() => setMeetingModalLead(lead)}
                            >
                              <Calendar className="h-3.5 w-3.5 text-primary" />
                              <span>Meetings ({lead.meetings?.length ?? 0})</span>
                            </Button>
                          </td>

                          {/* 6. Quotation (if quotation drafts exist, button to open modal with all quotations; if none show X) */}
                          <td className="py-4 px-4 align-top text-center whitespace-nowrap min-w-[130px]">
                            {lead.quotationDrafts && lead.quotationDrafts.length > 0 ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs gap-1.5 font-semibold border-sky-500/40 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/30"
                                onClick={() => setQuotationModalLead(lead)}
                              >
                                <FileText className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                                <span>Quotations ({lead.quotationDrafts.length})</span>
                              </Button>
                            ) : (
                              <div className="inline-flex items-center justify-center text-red-500">
                                <X className="h-5 w-5" />
                              </div>
                            )}
                          </td>

                          {/* 7. Show last followup data */}
                          <td className="py-4 px-4 align-top min-w-[180px]">
                            {lead.lastFollowup ? (
                              <div className="text-xs space-y-1">
                                <div className="font-semibold text-foreground">
                                  {formatDate(lead.lastFollowup.followupDate)}
                                </div>
                                {lead.lastFollowup.assignedTo ? (
                                  <div className="text-[11px] text-muted-foreground font-medium">
                                    By: {lead.lastFollowup.assignedTo.fullName}
                                  </div>
                                ) : null}
                                {lead.lastFollowup.notes ? (
                                  <div className="text-[11px] text-muted-foreground/90 italic bg-muted/30 rounded p-1.5 border border-border/50 line-clamp-2" title={lead.lastFollowup.notes}>
                                    "{lead.lastFollowup.notes}"
                                  </div>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>

                          {/* 8. Show next follow up date */}
                          <td className="py-4 px-4 align-top min-w-[140px]">
                            {lead.nextFollowup ? (
                              <div className="text-xs space-y-1">
                                <div className="font-bold text-primary">
                                  {formatDate(lead.nextFollowup.followupDate)}
                                </div>
                                {lead.nextFollowup.assignedTo ? (
                                  <div className="text-[11px] text-muted-foreground">
                                    Assigned: {lead.nextFollowup.assignedTo.fullName}
                                  </div>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="py-4 px-4 align-top text-center whitespace-nowrap">
                            <Link href={getLeadHref(lead.id)}>
                              <Button variant="outline" size="sm" className="h-8">View</Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {loadingMore ? <p className="mt-4 text-center text-sm text-muted-foreground">Loading more leads...</p> : null}
              <div ref={sentinelRef} className="h-1" />
              {!hasMore && leads.length > 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">You have reached the end of the list.</p>
              ) : null}
            </CardContent>
          </Card>

          <Dialog open={batchAssignOpen} onOpenChange={setBatchAssignOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Batch Assign Leads</DialogTitle>
                <DialogDescription>
                  Assign {selectedLeadIds.length} selected lead(s) to a department member in one action.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Department</p>
                  <Select
                    value={selectedDepartmentId}
                    onValueChange={(value) => {
                      setSelectedDepartmentId(value)
                      setSelectedUserId('')
                      setBatchAssignError(null)
                    }}
                    disabled={loadingDepartments}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={loadingDepartments ? 'Loading departments...' : 'Select department'} />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((department) => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Department Member</p>
                  <Select
                    value={selectedUserId}
                    onValueChange={setSelectedUserId}
                    disabled={!selectedDepartmentId || loadingDepartmentUsers}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          !selectedDepartmentId
                            ? 'Select department first'
                            : loadingDepartmentUsers
                              ? 'Loading members...'
                              : 'Select member'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.fullName} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setBatchAssignOpen(false)} disabled={submittingBatchAssign}>
                  Cancel
                </Button>
                <Button onClick={() => void submitBatchAssign()} disabled={submittingBatchAssign}>
                  {submittingBatchAssign ? 'Assigning...' : 'Assign Selected Leads'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={batchDeleteOpen}
            onOpenChange={(open) => {
              if (submittingBatchDelete) return
              setBatchDeleteOpen(open)
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Selected Leads</DialogTitle>
                <DialogDescription>
                  This will permanently delete {selectedLeadIds.length} selected lead(s). This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setBatchDeleteOpen(false)}
                  disabled={submittingBatchDelete}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => void submitBatchDelete()}
                  disabled={submittingBatchDelete}
                >
                  {submittingBatchDelete ? 'Deleting...' : 'Delete Selected Leads'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* 1. Meeting Details Modal */}
          <Dialog
            open={Boolean(meetingModalLead)}
            onOpenChange={(open) => {
              if (!open) setMeetingModalLead(null)
            }}
          >
            <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 overflow-hidden">
              <DialogHeader className="px-6 pt-6 pb-3 border-b">
                <DialogTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>Meetings: {meetingModalLead?.name}</span>
                </DialogTitle>
                <DialogDescription>
                  Client ID: {meetingModalLead?.clientId ? `#${meetingModalLead.clientId}` : '—'} • Phone: {meetingModalLead?.phone || '—'}
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 overscroll-contain">
                {!meetingModalLead?.meetings || meetingModalLead.meetings.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No meetings scheduled for this lead yet.
                  </div>
                ) : (
                  meetingModalLead.meetings.map((meeting) => (
                    <div key={meeting.id} className="rounded-lg border border-border p-3.5 bg-muted/20 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-foreground">{meeting.title}</span>
                        <span className="rounded bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-semibold">
                          {meeting.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>
                          <strong>Date & Time:</strong> {formatDate(meeting.startsAt, { includeTime: true })}
                          {meeting.endsAt ? ` - ${formatDate(meeting.endsAt, { includeTime: true })}` : ''}
                        </div>
                        <div>
                          <strong>Created by:</strong> {meeting.createdBy?.fullName || '—'}
                        </div>
                      </div>
                      {meeting.notes ? (
                        <div className="rounded bg-background p-2.5 text-xs border border-border">
                          <div className="font-semibold text-muted-foreground mb-1">Remarks / Notes:</div>
                          <div className="text-foreground whitespace-pre-wrap">{meeting.notes}</div>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground italic">No remarks recorded.</div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <DialogFooter className="px-6 py-3 border-t bg-muted/20">
                <Button variant="outline" onClick={() => setMeetingModalLead(null)}>
                  Close
                </Button>
                {meetingModalLead ? (
                  <Link href={getLeadHref(meetingModalLead.id)}>
                    <Button>Open Lead Profile</Button>
                  </Link>
                ) : null}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* 2. CAD Files Modal */}
          <Dialog
            open={Boolean(cadModalLead)}
            onOpenChange={(open) => {
              if (!open) setCadModalLead(null)
            }}
          >
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
              <DialogHeader className="px-6 pt-6 pb-3 border-b">
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span>CAD Files: {cadModalLead?.name}</span>
                </DialogTitle>
                <DialogDescription>
                  Client ID: {cadModalLead?.clientId ? `#${cadModalLead.clientId}` : '—'} • Phone: {cadModalLead?.phone || '—'}
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 overscroll-contain">
                {(() => {
                  const cadFiles = cadModalLead?.cadSubmissions?.flatMap((sub) =>
                    sub.files.map((f) => ({
                      ...f,
                      note: sub.note,
                      submittedBy: sub.submittedBy,
                      submittedAt: sub.submittedAt,
                    }))
                  ) ?? []

                  if (cadFiles.length === 0) {
                    return (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        No CAD files uploaded for this lead yet.
                      </div>
                    )
                  }

                  return cadFiles.map((file) => (
                    <div key={file.id} className="rounded-lg border border-border p-3.5 bg-muted/20 space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                            <span className="font-semibold text-sm text-foreground break-all">{file.fileName}</span>
                            {file.cadFileType ? (
                              <span className="rounded bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold uppercase">
                                {file.cadFileType.replace(/_/g, ' ')}
                              </span>
                            ) : null}
                          </div>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            {file.sizeBytes ? (
                              <div>Size: {(file.sizeBytes / (1024 * 1024)).toFixed(2)} MB</div>
                            ) : null}
                            {file.submittedBy ? (
                              <div>Uploaded by: <span className="font-medium text-foreground">{file.submittedBy.fullName}</span></div>
                            ) : null}
                            {file.submittedAt ? (
                              <div>Date: {formatDate(file.submittedAt, { includeTime: true })}</div>
                            ) : null}
                          </div>
                        </div>

                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={file.fileName}
                          className="shrink-0"
                        >
                          <Button size="sm" className="h-8 gap-1.5 text-xs font-semibold">
                            <Download className="h-3.5 w-3.5" />
                            <span>Download / Open</span>
                          </Button>
                        </a>
                      </div>

                      {file.note ? (
                        <div className="rounded bg-background p-2 text-xs border border-border/80">
                          <span className="font-semibold text-muted-foreground mr-1">Note:</span>
                          <span className="text-foreground">{file.note}</span>
                        </div>
                      ) : null}
                    </div>
                  ))
                })()}
              </div>

              <DialogFooter className="px-6 py-3 border-t bg-muted/20">
                <Button variant="outline" onClick={() => setCadModalLead(null)}>
                  Close
                </Button>
                {cadModalLead ? (
                  <Link href={getLeadHref(cadModalLead.id)}>
                    <Button variant="secondary">Open Lead Profile</Button>
                  </Link>
                ) : null}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* 3. Quotation Details Modal */}
          <Dialog
            open={Boolean(quotationModalLead)}
            onOpenChange={(open) => {
              if (!open) setQuotationModalLead(null)
            }}
          >
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
              <DialogHeader className="px-6 pt-6 pb-3 border-b">
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-sky-600" />
                  <span>Quotations: {quotationModalLead?.name}</span>
                </DialogTitle>
                <DialogDescription>
                  Client ID: {quotationModalLead?.clientId ? `#${quotationModalLead.clientId}` : '—'} • Phone: {quotationModalLead?.phone || '—'}
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 overscroll-contain">
                {!quotationModalLead?.quotationDrafts || quotationModalLead.quotationDrafts.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No quotation drafts created for this lead yet.
                  </div>
                ) : (
                  quotationModalLead.quotationDrafts.map((draft) => {
                    const isFinalized = draft.status === 'FINALIZED'
                    const isShort = draft.draftKey.toLowerCase().startsWith('short')
                    const displayTitle = isShort
                      ? 'Short Quotation'
                      : draft.draftKey.toLowerCase() === 'detail'
                        ? 'Detail Quotation'
                        : `Quotation (${draft.draftKey.toUpperCase()})`

                    return (
                      <div key={draft.id} className="rounded-lg border border-border p-3.5 bg-muted/20 space-y-2.5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-sm text-foreground">{displayTitle}</span>
                              <span
                                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                                  isFinalized
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                                }`}
                              >
                                {draft.status}
                              </span>
                              {draft.quotationType ? (
                                <span className="rounded bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 px-2 py-0.5 text-[10px] font-bold uppercase">
                                  {draft.quotationType}
                                </span>
                              ) : null}
                            </div>

                            <div className="text-sm font-bold text-foreground">
                              Grand Total:{' '}
                              <span className="text-primary font-extrabold text-base">
                                ৳ {draft.grandTotal.toLocaleString('en-IN')}
                              </span>
                              {draft.projectSqft ? (
                                <span className="text-xs font-normal text-muted-foreground ml-2">
                                  ({draft.projectSqft.toLocaleString()} sqft)
                                </span>
                              ) : null}
                            </div>

                            <div className="text-xs text-muted-foreground space-y-0.5 pt-0.5">
                              {draft.createdBy ? (
                                <div>
                                  Created by: <span className="font-medium text-foreground">{draft.createdBy.fullName}</span>
                                </div>
                              ) : null}
                              {draft.updatedAt ? (
                                <div>Last updated: {formatDate(draft.updatedAt, { includeTime: true })}</div>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0 pt-1">
                            {/* Button 1: Download / Print Quotation */}
                            <Link
                              href={`/crm/sr/quotation/leads/${quotationModalLead.id}`}
                              target="_blank"
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5 text-xs font-semibold border-border hover:bg-muted"
                              >
                                <Download className="h-3.5 w-3.5" />
                                <span>Download Quotation</span>
                              </Button>
                            </Link>

                            {/* Button 2: Open Quotation Studio (Edit & Manage) */}
                            <Link href={`/crm/sr/quotation/leads/${quotationModalLead.id}`}>
                              <Button
                                size="sm"
                                className="h-8 gap-1.5 text-xs font-semibold"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span>Open Quotation Studio</span>
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <DialogFooter className="px-6 py-3 border-t bg-muted/20">
                <Button variant="outline" onClick={() => setQuotationModalLead(null)}>
                  Close
                </Button>
                {quotationModalLead ? (
                  <Link href={`/crm/sr/quotation/leads/${quotationModalLead.id}`}>
                    <Button variant="secondary">Open Quotation Studio</Button>
                  </Link>
                ) : null}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  )
}
