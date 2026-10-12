'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  ArrowRight,
  Phone,
  Mail,
  ShieldCheck,
  UserCheck,
  Plus,
} from 'lucide-react'

type ConnectedFollowupItem = {
  id: string
  leadId: string
  followupDate: string
  status: 'PENDING' | 'DONE' | 'LATELY_DONE' | 'MISSED'
  notes: string | null
  category: string
  crmRole?: 'JR_CRM' | 'SR_CRM' | 'GENERAL'
  stepNumber?: number
  assignedTo: {
    id: string
    fullName: string
    email: string
  }
}

type ConnectedLeadInfo = {
  id: string
  name: string
  email: string
  phone: string
  stage?: string
  subStatus?: string | null
  assignedJrCrm?: { id: string; fullName: string; email: string } | null
  assignedSrCrm?: { id: string; fullName: string; email: string } | null
}

interface ConnectedFollowupChainDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadId: string | null
  leadName?: string
  leadPhone?: string
  leadEmail?: string
  assignedJrCrm?: { id: string; fullName: string; email: string } | null
  assignedSrCrm?: { id: string; fullName: string; email: string } | null
  onScheduleNext?: (leadId: string) => void
}

export function ConnectedFollowupChainDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  leadPhone,
  leadEmail,
  assignedJrCrm: initialJrCrm,
  assignedSrCrm: initialSrCrm,
  onScheduleNext,
}: ConnectedFollowupChainDialogProps) {
  const [items, setItems] = useState<ConnectedFollowupItem[]>([])
  const [leadInfo, setLeadInfo] = useState<ConnectedLeadInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !leadId) return

    let active = true
    setLoading(true)
    setError(null)

    fetch(`/api/followup/${leadId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!active) return
        if (data.success && Array.isArray(data.data)) {
          setItems(data.data)
          if (data.lead) {
            setLeadInfo(data.lead)
          }
        } else {
          setError(data.error || 'Failed to load follow-up chain.')
        }
      })
      .catch((err) => {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Failed to fetch follow-ups.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [open, leadId])

  const jrCrm = leadInfo?.assignedJrCrm || initialJrCrm
  const srCrm = leadInfo?.assignedSrCrm || initialSrCrm

  const getStatusBadge = (status: ConnectedFollowupItem['status']) => {
    switch (status) {
      case 'DONE':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200">Done</Badge>
      case 'LATELY_DONE':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">Lately Done</Badge>
      case 'MISSED':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200">Missed</Badge>
      case 'PENDING':
      default:
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">Pending</Badge>
    }
  }

  const getCrmRoleBadge = (role?: string) => {
    if (role === 'SR_CRM') {
      return (
        <Badge className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-200">
          <ShieldCheck className="w-3 h-3 mr-1 text-purple-600" /> Sr CRM Touch
        </Badge>
      )
    }
    if (role === 'JR_CRM') {
      return (
        <Badge className="bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/40 dark:text-sky-200">
          <UserCheck className="w-3 h-3 mr-1 text-sky-600" /> Jr CRM Touch
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        CRM Touch
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-lg font-bold">
              Connected Follow-Up Journey
            </DialogTitle>
            <Badge variant="outline" className="text-xs bg-muted">
              {items.length} {items.length === 1 ? 'Action' : 'Actions'} on Record
            </Badge>
          </div>
          <DialogDescription>
            Continuous follow-up timeline connecting Junior CRM and Senior CRM interactions.
          </DialogDescription>
        </DialogHeader>

        {/* Lead & Connected CRM Partnership Banner */}
        <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-foreground text-sm">
              {leadInfo?.name || leadName || 'Client'}
            </span>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {(leadInfo?.phone || leadPhone) && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {leadInfo?.phone || leadPhone}
                </span>
              )}
              {(leadInfo?.email || leadEmail) && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {leadInfo?.email || leadEmail}
                </span>
              )}
            </div>
          </div>

          <div className="pt-2 border-t grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="font-medium text-foreground">Assigned Jr CRM:</span>
              {jrCrm ? (
                <Badge variant="secondary" className="font-normal text-xs bg-sky-50 text-sky-800 border border-sky-200">
                  {jrCrm.fullName}
                </Badge>
              ) : (
                <span className="text-muted-foreground italic">None assigned</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="font-medium text-foreground">Assigned Sr CRM:</span>
              {srCrm ? (
                <Badge variant="secondary" className="font-normal text-xs bg-purple-50 text-purple-800 border border-purple-200">
                  {srCrm.fullName}
                </Badge>
              ) : (
                <span className="text-muted-foreground italic">Pending handover</span>
              )}
            </div>
          </div>
        </div>

        {/* Timeline Content */}
        {loading && (
          <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">
            Loading connected follow-up chain...
          </div>
        )}

        {error && (
          <div className="py-4 text-center text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No follow-ups recorded yet for this client.
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
            {items.map((item, index) => {
              const dateObj = new Date(item.followupDate)
              const isLast = index === items.length - 1
              const isSr = item.crmRole === 'SR_CRM'

              return (
                <div key={item.id} className="relative group">
                  {/* Timeline Node Dot */}
                  <div
                    className={`absolute -left-[27px] top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                      item.status === 'DONE' || item.status === 'LATELY_DONE'
                        ? 'bg-green-600 border-green-600 text-white'
                        : item.status === 'MISSED'
                          ? 'bg-red-600 border-red-600 text-white'
                          : isSr
                            ? 'bg-purple-600 border-purple-600 text-white'
                            : 'bg-primary border-primary text-primary-foreground'
                    }`}
                  >
                    {item.status === 'DONE' || item.status === 'LATELY_DONE' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : item.status === 'MISSED' ? (
                      <AlertCircle className="w-3.5 h-3.5" />
                    ) : (
                      index + 1
                    )}
                  </div>

                  <div className="bg-card border rounded-lg p-3.5 shadow-sm space-y-2 hover:border-primary/40 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                          Step {index + 1}
                        </span>
                        {getCrmRoleBadge(item.crmRole)}
                        {getStatusBadge(item.status)}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {dateObj.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}{' '}
                          at{' '}
                          {dateObj.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {item.category && item.category !== 'GENERAL' && (
                      <div>
                        <Badge variant="outline" className="text-[11px] font-normal">
                          Category: {item.category.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    )}

                    {item.notes ? (
                      <p className="text-sm text-foreground bg-muted/30 p-2.5 rounded border border-border/50">
                        {item.notes}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No notes added</p>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Assigned to: <strong className="text-foreground">{item.assignedTo.fullName}</strong></span>
                      </div>

                      {!isLast && (
                        <span className="text-[11px] text-primary flex items-center gap-1 font-medium">
                          Next step connected <ArrowRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>

          {leadId && onScheduleNext && (
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => {
                onOpenChange(false)
                onScheduleNext(leadId)
              }}
            >
              <Plus className="w-4 h-4" />
              Schedule Next Connected Follow-Up
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
