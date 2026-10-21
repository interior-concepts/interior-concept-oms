'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  FileText,
  UserCheck,
  Calendar,
  Layers,
  History,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { fetchMeCached } from '@/lib/client-me'

type SeniorCrmUser = {
  id: string
  fullName: string
  email: string
}

type LeadFollowupData = {
  id: string
  followupDate?: string | null
  status?: string | null
  notes?: string | null
  assignedTo?: { fullName?: string | null } | null
}

export type InstantQuotationLead = {
  id: string
  name: string
  clientId?: number | null
  phone?: string | null
  stage: string
  location?: string | null
  assignments?: Array<{
    department: string
    user: { id: string; fullName: string }
  }>
  latestVisit?: {
    id: string
    scheduledAt: string
    projectSqft?: number | null
    status: string
  } | null
  lastFollowup?: LeadFollowupData | null
  nextFollowup?: LeadFollowupData | null
}

type InstantQuotationModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: InstantQuotationLead | null
  onSuccess?: (quotationUrl: string) => void
}

export function InstantQuotationModal({
  open,
  onOpenChange,
  lead,
  onSuccess,
}: InstantQuotationModalProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [seniorUsers, setSeniorUsers] = useState<SeniorCrmUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Form State
  const [projectSqft, setProjectSqft] = useState('')
  const [seniorCrmUserId, setSeniorCrmUserId] = useState('')
  const [visitDate, setVisitDate] = useState('')
  const [followupDate, setFollowupDate] = useState('')
  const [followupNotes, setFollowupNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch active Senior CRM users
  useEffect(() => {
    if (!open) return
    let active = true

    const fetchSeniorUsers = async () => {
      setLoadingUsers(true)
      try {
        const res = await fetch('/api/department/available/SR_CRM', { cache: 'no-store' })
        const json = await res.json()
        if (active && json?.success && Array.isArray(json.users)) {
          setSeniorUsers(json.users)
        }
      } catch (err) {
        console.error('Failed to load Senior CRM users:', err)
      } finally {
        if (active) setLoadingUsers(false)
      }
    }

    void fetchSeniorUsers()
    return () => {
      active = false
    }
  }, [open])

  // Initialize form fields when modal opens with a lead
  useEffect(() => {
    if (!open || !lead) return

    // Pre-fill Project Size if existing
    const existingSqft = lead.latestVisit?.projectSqft
    setProjectSqft(existingSqft ? String(existingSqft) : '')

    // Pre-fill Senior CRM if already assigned, or fallback to current user if they are in SR_CRM
    const currentSr = lead.assignments?.find((a) => a.department === 'SR_CRM')
    if (currentSr?.user?.id) {
      setSeniorCrmUserId(currentSr.user.id)
    } else {
      void fetchMeCached()
        .then((me) => {
          if (!open) return
          const isSr = (me?.userDepartments ?? []).some(
            (d) => d?.department?.name === 'SR_CRM',
          )
          if (isSr && me?.id) {
            setSeniorCrmUserId(me.id)
          }
        })
        .catch(() => undefined)
    }

    // Pre-fill Visit Date if scheduled
    if (lead.latestVisit?.scheduledAt && lead.latestVisit.status === 'SCHEDULED') {
      try {
        const dateObj = new Date(lead.latestVisit.scheduledAt)
        // Format to YYYY-MM-DDTHH:mm for datetime-local input
        const localIso = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)
        setVisitDate(localIso)
      } catch {
        setVisitDate('')
      }
    } else {
      setVisitDate('')
    }

    // Reset follow-up form & errors
    setFollowupDate('')
    setFollowupNotes('')
    setError(null)
  }, [open, lead])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lead) return

    const parsedSqft = Number(projectSqft.trim().replace(/,/g, ''))
    if (!Number.isFinite(parsedSqft) || parsedSqft <= 0) {
      setError('Please provide a valid project size (sqft) greater than 0.')
      return
    }

    if (!seniorCrmUserId) {
      setError('Please select an assigned Senior CRM.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/leads/${lead.id}/instant-quotation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectSqft: parsedSqft,
          seniorCrmUserId,
          visitDate: visitDate ? new Date(visitDate).toISOString() : null,
          followupDate: followupDate ? new Date(followupDate).toISOString() : null,
          followupNotes: followupNotes.trim() || null,
        }),
      })

      const payload = (await response.json()) as {
        success: boolean
        data?: { quotationUrl?: string }
        error?: string
      }

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to initialize instant quotation.')
      }

      const targetUrl = payload.data?.quotationUrl || `/crm/admin/quotation/leads/${lead.id}`

      onOpenChange(false)
      if (onSuccess) {
        onSuccess(targetUrl)
      } else {
        startTransition(() => {
          router.push(targetUrl)
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center dark:bg-sky-950/60 dark:text-sky-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <span>Instant Quotation Setup</span>
                <span className="rounded bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-800 dark:bg-sky-950/50 dark:text-sky-300">
                  Fast Track
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Move lead directly into quotation phase, configure essential metadata, and open Quotation Studio.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : null}

          {/* Lead Quick Overview Banner */}
          <div className="rounded-lg border border-border/80 bg-muted/30 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-foreground text-sm">{lead?.name}</span>
              <div className="text-muted-foreground">
                {lead?.clientId ? `Client ID: #${lead.clientId}` : ''}
                {lead?.phone ? ` • Phone: ${lead.phone}` : ''}
                {lead?.location ? ` • 📍 ${lead.location}` : ''}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Current Stage</span>
              <div className="font-semibold text-foreground">{lead?.stage.replace(/_/g, ' ')}</div>
            </div>
          </div>

          {/* Section: Follow-up Check */}
          <div className="rounded-lg border border-border bg-card p-3.5 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <History className="h-3.5 w-3.5 text-primary" />
              <span>Check Follow-up History</span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 text-xs">
              <div className="rounded border border-border/60 bg-muted/20 p-2.5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Last Follow-up
                </span>
                {lead?.lastFollowup ? (
                  <div className="space-y-1 text-foreground">
                    <p className="font-medium">
                      {lead.lastFollowup.notes ? `"${lead.lastFollowup.notes}"` : 'No remarks recorded'}
                    </p>
                    <div className="text-[11px] text-muted-foreground">
                      Status: <span className="font-medium text-foreground">{lead.lastFollowup.status || 'DONE'}</span>
                      {lead.lastFollowup.assignedTo?.fullName ? ` • By: ${lead.lastFollowup.assignedTo.fullName}` : ''}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground/80 italic">No previous follow-up recorded</p>
                )}
              </div>

              <div className="rounded border border-border/60 bg-muted/20 p-2.5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Next Scheduled Follow-up
                </span>
                {lead?.nextFollowup?.followupDate ? (
                  <div className="space-y-1 text-foreground">
                    <p className="font-medium">
                      Date: {new Date(lead.nextFollowup.followupDate).toLocaleDateString()}{' '}
                      {new Date(lead.nextFollowup.followupDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {lead.nextFollowup.assignedTo?.fullName ? (
                      <p className="text-[11px] text-muted-foreground">
                        Assigned: {lead.nextFollowup.assignedTo.fullName}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-muted-foreground/80 italic">None currently pending</p>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields: The 4 required fields */}
          <div className="space-y-4">
            {/* Field 1: Project Size (sqft) */}
            <div className="space-y-1.5">
              <label htmlFor="modal-project-sqft" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-primary" />
                <span>1. Project Size (sqft) <span className="text-destructive">*</span></span>
              </label>
              <Input
                id="modal-project-sqft"
                type="number"
                min="1"
                step="any"
                placeholder="e.g. 1500"
                value={projectSqft}
                onChange={(e) => setProjectSqft(e.target.value)}
                required
                className="h-9 text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                This square footage is applied automatically to the quotation studio draft.
              </p>
            </div>

            {/* Field 2: Assigned Senior CRM */}
            <div className="space-y-1.5">
              <label htmlFor="modal-sr-crm" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-primary" />
                <span>2. Assigned Senior CRM <span className="text-destructive">*</span></span>
              </label>
              <select
                id="modal-sr-crm"
                value={seniorCrmUserId}
                onChange={(e) => setSeniorCrmUserId(e.target.value)}
                required
                disabled={loadingUsers}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">
                  {loadingUsers ? 'Loading Senior CRM users...' : 'Select Senior CRM...'}
                </option>
                {seniorUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.email})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">
                Assigns primary lead ownership and enables Senior CRM collaboration.
              </p>
            </div>

            {/* Field 3: Visit Date (optional) */}
            <div className="space-y-1.5">
              <label htmlFor="modal-visit-date" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>3. Visit Date <span className="text-muted-foreground font-normal">(Optional)</span></span>
              </label>
              <Input
                id="modal-visit-date"
                type="datetime-local"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="h-9 text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Leave blank if no physical site visit is planned or already scheduled.
              </p>
            </div>

            {/* Field 4: Follow-up Data (Set/Schedule next follow up) */}
            <div className="space-y-2 border-t pt-3">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span>4. Follow-up Data</span>
              </label>

              <div className="grid gap-2.5 sm:grid-cols-2">
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium">Follow-up Date & Time (Optional)</span>
                  <Input
                    type="datetime-local"
                    value={followupDate}
                    onChange={(e) => setFollowupDate(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium">Follow-up Notes / Remarks</span>
                  <Textarea
                    placeholder="Enter instructions or remarks for Senior CRM..."
                    value={followupNotes}
                    onChange={(e) => setFollowupNotes(e.target.value)}
                    rows={2}
                    className="text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 border-t flex flex-row items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="gap-1.5 font-semibold bg-sky-600 hover:bg-sky-700 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing & Redirecting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Activate & Open Quotation Studio</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
