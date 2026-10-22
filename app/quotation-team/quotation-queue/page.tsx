'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  HandMetal,
  Loader2,
  MapPin,
  PenTool,
  Phone,
  Sparkles,
  UserCheck,
  UserPlus,
  UserRound,
} from 'lucide-react'
import { CrmPageHeader } from '@/components/crm/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/sonner'
import { AddQuotationClientModal } from '@/components/quotation/AddQuotationClientModal'

type QueueLead = {
  id: string
  name: string
  phone: string | null
  location: string | null
  stage: string
  subStatus: string | null
  updatedAt: string
  createdAt: string
  budget: number | null
  quotationAssignee: { id: string; fullName: string; email: string } | null
  isAssignedToMe: boolean
  isUnassigned: boolean
  srCrmAssignee: { id: string; fullName: string; email: string } | null
  jrArchitectAssignee: { id: string; fullName: string; email: string } | null
  latestFirstMeeting: { id: string; title: string; notes: string | null; startsAt: string } | null
  projectSqft: number | null
  avgDetailSqft: number
  avgShortSqft: number
  attachments: Array<{ id: string; fileName: string; url: string; fileType: string | null }>
}

function formatLabel(value: string | null | undefined) {
  if (!value) return 'N/A'
  if (value === 'DISCOVERY') return 'Consulting Phase'
  if (value === 'PROPOSAL_SENT') return 'Quotation Sent'
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function QuotationQueuePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'unassigned' | 'all'>('unassigned')
  const [leads, setLeads] = useState<QueueLead[]>([])
  const [claimingId, setClaimingId] = useState<string | null>(null)

  const loadQueue = useCallback(async (currentFilter: 'unassigned' | 'all') => {
    setLoading(true)
    try {
      const response = await fetch(`/api/quotation/queue?filter=${currentFilter}`, {
        cache: 'no-store',
      })
      const payload = await response.json()
      if (!response.ok || !payload?.success || !Array.isArray(payload.data)) {
        throw new Error(payload?.error ?? 'Failed to load quotation queue')
      }
      setLeads(payload.data as QueueLead[])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load quotation queue')
      setLeads([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadQueue(filter)
  }, [loadQueue, filter])

  const claimLead = async (leadId: string, openWorkspace = true) => {
    setClaimingId(leadId)
    try {
      const response = await fetch('/api/quotation/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
      })
      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to claim lead')
      }
      toast.success(payload.message ?? 'Lead claimed successfully!')
      if (openWorkspace) {
        router.push(`/quotation-team/leads/${leadId}`)
      } else {
        await loadQueue(filter)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to claim lead')
    } finally {
      setClaimingId(null)
    }
  }

  const metrics = useMemo(() => {
    const unassigned = leads.filter((l) => l.isUnassigned).length
    const total = leads.length
    const totalShortSqft = leads.reduce((sum, l) => sum + (l.avgShortSqft || 0), 0)
    const totalDetailSqft = leads.reduce((sum, l) => sum + (l.avgDetailSqft || 0), 0)
    return { unassigned, total, totalShortSqft, totalDetailSqft }
  }, [leads])

  return (
    <div className="min-h-screen bg-background">
      <CrmPageHeader
        title="Quotation Queue"
        subtitle="Incoming leads requiring quotation preparation. Claim leads or add a direct client."
        actions={<AddQuotationClientModal onClientCreated={() => void loadQueue(filter)} />}
      />

      <main className="mx-auto max-w-[1440px] px-6 py-6 space-y-4">
        {/* Top Summary Cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50/60 p-4 shadow-sm dark:border-blue-900/40 dark:from-blue-950/20 dark:to-sky-950/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
                  Unassigned Leads
                </p>
                <p className="mt-1 text-2xl font-black text-blue-950 dark:text-blue-100">
                  {metrics.unassigned}
                </p>
              </div>
              <div className="rounded-lg bg-blue-100 p-2 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                <HandMetal className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-muted/40 p-4 shadow-sm dark:border-slate-800 dark:from-slate-900/40 dark:to-muted/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Total in Queue View
                </p>
                <p className="mt-1 text-2xl font-black text-foreground">{metrics.total}</p>
              </div>
              <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                <ClipboardList className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50/60 p-4 shadow-sm dark:border-cyan-900/40 dark:from-cyan-950/20 dark:to-sky-950/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-900 dark:text-cyan-300">
                  Queue Short SQFT
                </p>
                <p className="mt-1 text-2xl font-black text-cyan-950 dark:text-cyan-100">
                  {metrics.totalShortSqft.toLocaleString()}{' '}
                  <span className="text-xs font-semibold">sqft</span>
                </p>
              </div>
              <div className="rounded-lg bg-cyan-100 p-2 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50/60 p-4 shadow-sm dark:border-purple-900/40 dark:from-purple-950/20 dark:to-indigo-950/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300">
                  Queue Detail SQFT
                </p>
                <p className="mt-1 text-2xl font-black text-purple-950 dark:text-purple-100">
                  {metrics.totalDetailSqft.toLocaleString()}{' '}
                  <span className="text-xs font-semibold">sqft</span>
                </p>
              </div>
              <div className="rounded-lg bg-purple-100 p-2 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Button
              variant={filter === 'unassigned' ? 'secondary' : 'ghost'}
              size="sm"
              className="text-xs h-8"
              onClick={() => setFilter('unassigned')}
            >
              Unassigned Only ({metrics.unassigned})
            </Button>
            <Button
              variant={filter === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              className="text-xs h-8"
              onClick={() => setFilter('all')}
            >
              All Queue Leads ({metrics.total})
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Claiming a lead assigns you as the quotation member and opens the quotation workspace.
          </p>
        </div>

        {/* Queue Lead List */}
        {loading ? (
          <div className="flex items-center justify-center rounded-lg border border-border bg-card py-14">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : leads.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground space-y-3">
              <ClipboardList className="mx-auto h-8 w-8 text-muted-foreground/60" />
              <p>No quotation leads found in this view.</p>
              <AddQuotationClientModal
                triggerLabel="Add Direct Client Now"
                triggerVariant="outline"
                onClientCreated={() => void loadQueue(filter)}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => (
              <Card
                key={lead.id}
                className={`overflow-hidden border transition hover:shadow-md ${
                  lead.isUnassigned
                    ? 'border-blue-200/80 bg-gradient-to-br from-blue-50/20 via-background to-sky-50/20'
                    : 'border-border/70 hover:border-primary/40'
                }`}
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/quotation-team/leads/${lead.id}`}
                          className="text-base font-semibold hover:text-primary hover:underline"
                        >
                          {lead.name}
                        </Link>
                        {lead.isUnassigned ? (
                          <Badge className="bg-blue-600 text-white text-[10px]">Unassigned</Badge>
                        ) : lead.quotationAssignee ? (
                          <Badge variant="secondary" className="text-[10px]">
                            Assigned to: {lead.quotationAssignee.fullName}
                          </Badge>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{formatLabel(lead.stage)}</Badge>
                        <Badge variant="outline">{formatLabel(lead.subStatus)}</Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/quotation-team/leads/${lead.id}`}>Open Workspace</Link>
                      </Button>
                      <Button
                        size="sm"
                        disabled={claimingId === lead.id}
                        onClick={() => void claimLead(lead.id, true)}
                        className="gap-1.5"
                      >
                        {claimingId === lead.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <HandMetal className="h-4 w-4" />
                        )}
                        Claim & Start Work
                      </Button>
                    </div>
                  </div>

                  {/* Attachments */}
                  {lead.attachments.length > 0 ? (
                    <div className="space-y-1 pt-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Attachments ({lead.attachments.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {lead.attachments.map((attachment) => (
                          <a
                            key={attachment.id}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="inline-flex min-h-8 max-w-full items-center gap-2 rounded-md border border-border/60 bg-card px-2.5 py-1.5 text-xs text-foreground transition hover:border-primary/40 hover:bg-secondary/30"
                            title={attachment.fileName}
                          >
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="max-w-[200px] truncate">{attachment.fileName}</span>
                            <Download className="h-3.5 w-3.5 text-primary" />
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground border-t border-border/40 pt-3 mt-2">
                    {lead.phone ? (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-primary/70" />
                        {lead.phone}
                      </span>
                    ) : null}
                    {lead.location ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-primary/70" />
                        <span className="max-w-[200px] truncate" title={lead.location}>
                          {lead.location}
                        </span>
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50/80 px-2.5 py-1 text-xs font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                      <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      Short SQFT: <strong>{lead.avgShortSqft ? lead.avgShortSqft.toLocaleString() : 0}</strong>
                      <span className="opacity-40">|</span>
                      Detail SQFT: <strong>{lead.avgDetailSqft ? lead.avgDetailSqft.toLocaleString() : 0}</strong>
                    </span>
                    {lead.srCrmAssignee ? (
                      <span className="inline-flex items-center gap-1">
                        <UserRound className="h-3.5 w-3.5 text-primary/70" />
                        SR CRM: {lead.srCrmAssignee.fullName}
                      </span>
                    ) : null}
                    {lead.jrArchitectAssignee ? (
                      <span className="inline-flex items-center gap-1">
                        <PenTool className="h-3.5 w-3.5 text-primary/70" />
                        Jr Arch: {lead.jrArchitectAssignee.fullName}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5 text-primary/70" />
                      Visit / Meeting:
                      <span className="font-medium text-foreground">
                        {lead.latestFirstMeeting?.startsAt
                          ? new Date(lead.latestFirstMeeting.startsAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Not set'}
                      </span>
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
