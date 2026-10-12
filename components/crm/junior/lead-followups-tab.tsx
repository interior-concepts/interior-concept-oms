'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  Calendar,
  User,
  Phone,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Sparkles,
  Layers,
  Plus,
  FileSpreadsheet,
  MapPin,
  CreditCard,
} from 'lucide-react'
import { FOLLOWUP_CATEGORIES, type FollowUpCategoryValue } from '@/components/crm/shared/followup-intelligence-fields'
import { FOLLOWUP_DEPARTMENTS, DepartmentRoleBadge } from '@/components/crm/shared/followup-departments'

type Followup = {
  id: string
  followupDate: string
  notes: string | null
  status: string
  category?: string
  crmRole?: 'JR_CRM' | 'SR_CRM' | 'GENERAL'
  departmentRole?: string
  stepNumber?: number
  sentiment?: string | null
  objection?: string | null
  assignedTo: {
    id: string
    fullName: string
    email: string
  }
}

interface LeadFollowupsTabProps {
  followups: Followup[]
  leadId: string
  currentUserId: string | null
  onRefreshFollowups: () => void
  onAddFollowup: () => void
  leadName?: string
  leadPhone?: string | null
  assignedJrCrm?: { id: string; fullName: string; email: string } | null
  assignedSrCrm?: { id: string; fullName: string; email: string } | null
}

const WHATSAPP_TEMPLATES = [
  {
    id: 'quotation',
    label: '📊 Quotation Discussion',
    getText: (name: string) =>
      `Hi ${name || 'there'}, checking in regarding the interior quotation we shared. Do you have any questions or require any adjustments?`,
  },
  {
    id: 'design',
    label: '📐 3D Design Review',
    getText: (name: string) =>
      `Hi ${name || 'there'}, we have updated the 3D design concepts for your project. Let me know when you are available for a quick review call!`,
  },
  {
    id: 'meeting',
    label: '🤝 Site Visit / Meeting',
    getText: (name: string) =>
      `Hi ${name || 'there'}, confirming our upcoming meeting for your interior project design discussion. Looking forward to speaking with you!`,
  },
  {
    id: 'general',
    label: '💬 General Check-in',
    getText: (name: string) =>
      `Hi ${name || 'there'}, checking in on your interior design requirements. Please let me know if you would like to proceed with the next steps.`,
  },
]

function defaultNextFollowupDatetime(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(11, 0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`
}

export function LeadFollowupsTab({
  followups,
  leadId,
  currentUserId,
  onRefreshFollowups,
  onAddFollowup,
  leadName,
  leadPhone,
  assignedJrCrm: propJrCrm,
  assignedSrCrm: propSrCrm,
}: LeadFollowupsTabProps) {
  // Complete modal state
  const [completeOpen, setCompleteOpen] = useState(false)
  const [selectedFollowup, setSelectedFollowup] = useState<Followup | null>(null)
  const [completionNote, setCompletionNote] = useState('')
  const [completing, setCompleting] = useState(false)
  const [completeError, setCompleteError] = useState<string | null>(null)

  // Next connected follow-up in modal
  const [setNextFollowup, setSetNextFollowup] = useState(true)
  const [nextFollowupDatetime, setNextFollowupDatetime] = useState('')
  const [nextFollowupNote, setNextFollowupNote] = useState('')
  const [nextFollowupCategory, setNextFollowupCategory] = useState<FollowUpCategoryValue>('GENERAL')
  const [nextAssignRole, setNextAssignRole] = useState<string>('SR_CRM')

  // Fetched lead team if available
  const [fetchedJrCrm, setFetchedJrCrm] = useState<{ id: string; fullName: string; email: string } | null>(null)
  const [fetchedSrCrm, setFetchedSrCrm] = useState<{ id: string; fullName: string; email: string } | null>(null)

  // WhatsApp Modal state
  const [waModalOpen, setWaModalOpen] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState('quotation')
  const [waMessage, setWaMessage] = useState('')

  useEffect(() => {
    if (!leadId) return
    fetch(`/api/followup/${leadId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.lead) {
          if (data.lead.assignedJrCrm) setFetchedJrCrm(data.lead.assignedJrCrm)
          if (data.lead.assignedSrCrm) setFetchedSrCrm(data.lead.assignedSrCrm)
        }
      })
      .catch(() => {})
  }, [leadId])

  const jrCrm = propJrCrm || fetchedJrCrm
  const srCrm = propSrCrm || fetchedSrCrm

  const openWaModal = () => {
    const tpl = WHATSAPP_TEMPLATES.find((t) => t.id === selectedTemplateId) || WHATSAPP_TEMPLATES[0]
    setWaMessage(tpl.getText(leadName || ''))
    setWaModalOpen(true)
  }

  const handleTemplateChange = (tplId: string) => {
    setSelectedTemplateId(tplId)
    const tpl = WHATSAPP_TEMPLATES.find((t) => t.id === tplId)
    if (tpl) {
      setWaMessage(tpl.getText(leadName || ''))
    }
  }

  const sendWhatsApp = () => {
    if (!leadPhone) return
    const cleanedPhone = leadPhone.replace(/[^\d+]/g, '')
    const formattedPhone = cleanedPhone.startsWith('+')
      ? cleanedPhone.slice(1)
      : cleanedPhone.length === 11 && cleanedPhone.startsWith('0')
        ? `88${cleanedPhone}`
        : cleanedPhone
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(waMessage)}`
    window.open(url, '_blank')
    setWaModalOpen(false)
  }

  const openCompleteModal = (followup: Followup) => {
    setSelectedFollowup(followup)
    setCompletionNote('')
    setCompleteError(null)
    setSetNextFollowup(true)
    setNextFollowupDatetime(defaultNextFollowupDatetime())
    setNextFollowupNote('')
    setNextFollowupCategory('GENERAL')
    // Default next handover role: if current is Jr CRM, suggest Sr CRM; else Myself
    const currentDept = followup.departmentRole || followup.crmRole
    setNextAssignRole(currentDept === 'JR_CRM' ? 'SR_CRM' : 'SELF')
    setCompleteOpen(true)
  }

  const pendingOrMissed = useMemo(
    () => new Set(['PENDING', 'MISSED']),
    [],
  )

  const handleComplete = async () => {
    if (!selectedFollowup) return
    if (!completionNote.trim()) {
      setCompleteError('Please add completion notes.')
      return
    }
    if (setNextFollowup && !nextFollowupDatetime) {
      setCompleteError('Please set the next follow-up date and time.')
      return
    }

    setCompleting(true)
    setCompleteError(null)

    const completionStatus = selectedFollowup.status === 'MISSED' ? 'LATELY_DONE' : 'DONE'

    try {
      const nextFollowUpPayload = setNextFollowup && nextFollowupDatetime
        ? {
            followupDate: new Date(nextFollowupDatetime).toISOString(),
            notes: nextFollowupNote.trim() || undefined,
            category: nextFollowupCategory,
            targetDepartment: nextAssignRole !== 'SELF' ? nextAssignRole : undefined,
            targetCrmRole: nextAssignRole === 'SR_CRM' ? 'SR_CRM' : nextAssignRole === 'JR_CRM' ? 'JR_CRM' : undefined,
            assignedToId: nextAssignRole === 'SELF' && currentUserId ? currentUserId : undefined,
          }
        : undefined

      const followupRes = await fetch(
        `/api/followup/${leadId}/${selectedFollowup.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: completionStatus,
            notes: completionNote.trim(),
            userId: currentUserId ?? undefined,
            nextFollowUp: nextFollowUpPayload,
          }),
        },
      )
      const followupData = await followupRes.json()
      if (!followupRes.ok || !followupData.success) {
        throw new Error(followupData.error || 'Failed to update follow-up.')
      }

      setCompleteOpen(false)
      setSelectedFollowup(null)
      setCompletionNote('')
      setNextFollowupNote('')
      setNextFollowupDatetime('')
      onRefreshFollowups()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete follow-up.'
      setCompleteError(message)
    } finally {
      setCompleting(false)
    }
  }

  // Sort followups chronologically so the timeline flows in order
  const chronologicalFollowups = useMemo(() => {
    return [...followups].sort(
      (a, b) => new Date(a.followupDate).getTime() - new Date(b.followupDate).getTime()
    )
  }, [followups])

  const completedCount = useMemo(() => {
    return followups.filter((f) => f.status === 'DONE' || f.status === 'LATELY_DONE').length
  }, [followups])

  const pendingCount = useMemo(() => {
    return followups.filter((f) => f.status === 'PENDING').length
  }, [followups])

  const getStatusBadge = (status: string) => {
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
        <Badge className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-200 text-xs">
          <ShieldCheck className="w-3 h-3 mr-1 text-purple-600" /> Sr CRM Action
        </Badge>
      )
    }
    if (role === 'JR_CRM') {
      return (
        <Badge className="bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/40 dark:text-sky-200 text-xs">
          <UserCheck className="w-3 h-3 mr-1 text-sky-600" /> Jr CRM Action
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-muted-foreground text-xs">
        CRM Action
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      {/* Connected CRM Partnership & Quick Actions Bar */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-card to-background p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Connected Lead Follow-Up System
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Unified journey connecting Junior CRM qualification and Senior CRM closing follow-ups.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {leadPhone ? (
              <>
                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs text-green-700 border-green-300 hover:bg-green-50" onClick={openWaModal}>
                  <MessageSquare className="h-3.5 w-3.5 fill-green-600 text-green-600" />
                  WhatsApp
                </Button>
                <a href={`tel:${leadPhone}`}>
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs text-blue-700 border-blue-300 hover:bg-blue-50">
                    <Phone className="h-3.5 w-3.5 text-blue-600" />
                    Call
                  </Button>
                </a>
              </>
            ) : null}
            <Button size="sm" onClick={onAddFollowup} className="h-8 text-xs gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Schedule Follow-Up
            </Button>
          </div>
        </div>

        {/* Assigned Duo and Follow-up Stats */}
        <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground">Assigned Jr CRM:</span>
              {jrCrm ? (
                <Badge variant="secondary" className="bg-sky-50 text-sky-800 border-sky-200">
                  <UserCheck className="w-3 h-3 mr-1 text-sky-600" />
                  {jrCrm.fullName}
                </Badge>
              ) : (
                <span className="text-muted-foreground italic">Unassigned</span>
              )}
            </div>

            <div className="text-border">|</div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground">Assigned Sr CRM:</span>
              {srCrm ? (
                <Badge variant="secondary" className="bg-purple-50 text-purple-800 border-purple-200">
                  <ShieldCheck className="w-3 h-3 mr-1 text-purple-600" />
                  {srCrm.fullName}
                </Badge>
              ) : (
                <span className="text-muted-foreground italic">Pending Handover</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-background">
              Total: {followups.length}
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Completed: {completedCount}
            </Badge>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Pending: {pendingCount}
            </Badge>
          </div>
        </div>
      </div>

      {/* Connected Follow-Up Chain Timeline */}
      {chronologicalFollowups.length === 0 ? (
        <Card>
          <CardContent className="pt-10 pb-10 text-center">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="font-medium text-foreground">No follow-ups scheduled yet.</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Start the client engagement thread by scheduling the first follow-up action.
            </p>
            <Button className="mt-4 gap-1.5" size="sm" onClick={onAddFollowup}>
              <Plus className="w-4 h-4" />
              Schedule First Follow-Up
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-4 before:bottom-4 before:w-0.5 before:bg-border pt-2 pb-2">
          {chronologicalFollowups.map((followup, index) => {
            const dateObj = new Date(followup.followupDate)
            const isLast = index === chronologicalFollowups.length - 1
            const canComplete = pendingOrMissed.has(followup.status)
            const isSr = followup.crmRole === 'SR_CRM'

            return (
              <div key={followup.id} className="relative group">
                {/* Timeline Circle Node */}
                <div
                  className={`absolute -left-[27px] top-2 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                    followup.status === 'DONE' || followup.status === 'LATELY_DONE'
                      ? 'bg-green-600 border-green-600 text-white'
                      : followup.status === 'MISSED'
                        ? 'bg-red-600 border-red-600 text-white'
                        : isSr
                          ? 'bg-purple-600 border-purple-600 text-white'
                          : 'bg-primary border-primary text-primary-foreground'
                  }`}
                >
                  {followup.status === 'DONE' || followup.status === 'LATELY_DONE' ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : followup.status === 'MISSED' ? (
                    <AlertCircle className="w-3.5 h-3.5" />
                  ) : (
                    index + 1
                  )}
                </div>

                <Card className="border hover:border-primary/40 hover:shadow-sm transition-all">
                  <CardContent className="pt-4 pb-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                          Step {index + 1}
                        </span>
                        <DepartmentRoleBadge departmentKey={followup.departmentRole || followup.crmRole} />
                        {getStatusBadge(followup.status)}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span className="font-medium text-foreground">
                          {dateObj.toLocaleDateString('en-US', {
                            weekday: 'short',
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

                    {followup.category && followup.category !== 'GENERAL' && (
                      <div>
                        <Badge variant="outline" className="text-[11px] font-normal">
                          Category: {followup.category.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    )}

                    {followup.notes ? (
                      <p className="text-sm text-foreground bg-muted/30 p-2.5 rounded border border-border/50">
                        {followup.notes}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No notes provided</p>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1 border-t border-border/60 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <User className="w-3.5 h-3.5" />
                        <span>Assigned to: <strong className="text-foreground">{followup.assignedTo.fullName}</strong></span>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isLast && (
                          <span className="text-[11px] text-primary flex items-center gap-1 font-medium mr-2">
                            Next step connected <ArrowRight className="w-3 h-3" />
                          </span>
                        )}

                        {canComplete && (
                          <Button size="sm" onClick={() => openCompleteModal(followup)} className="h-7 text-xs gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Complete & Connect Next
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      )}

      {/* Complete & Connect Follow-Up Dialog */}
      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Complete & Connect Next Follow-Up</DialogTitle>
            <DialogDescription>
              {selectedFollowup?.status === 'MISSED'
                ? 'Mark this action lately done and connect the next client journey step.'
                : 'Save discussion notes and seamlessly schedule the connected next action.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground">
                Follow-Up Outcome & Notes <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
                placeholder="What did the client say? e.g. Discussed budget range; agreed to Senior CRM meeting..."
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
                  id="tabSetNextFollowup"
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
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
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
                        Architect / CAD
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
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">Other department:</span>
                      <Select
                        value={['JR_CRM', 'SR_CRM', 'JR_ARCHITECT', 'VISUALIZER_3D', 'QUOTATION', 'VISIT_TEAM', 'ACCOUNTS', 'SELF'].includes(nextAssignRole) ? '' : nextAssignRole}
                        onValueChange={(val) => {
                          if (val) setNextAssignRole(val)
                        }}
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
                      placeholder="e.g. Call client to review 3D visualizer layout options"
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
            <Button size="sm" onClick={handleComplete} disabled={completing}>
              {completing ? 'Saving & Connecting...' : 'Complete & Connect'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Quick Message Dialog */}
      <Dialog open={waModalOpen} onOpenChange={setWaModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <MessageSquare className="h-5 w-5 fill-green-600 text-green-600" />
              Send WhatsApp Follow-Up
            </DialogTitle>
            <DialogDescription>
              Select a message template or edit the text before sending to {leadName || 'the client'}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Select Template</label>
              <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a message template" />
                </SelectTrigger>
                <SelectContent>
                  {WHATSAPP_TEMPLATES.map((tpl) => (
                    <SelectItem key={tpl.id} value={tpl.id}>
                      {tpl.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Message Preview</label>
              <Textarea
                value={waMessage}
                onChange={(e) => setWaMessage(e.target.value)}
                rows={4}
                className="text-sm font-sans"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setWaModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendWhatsApp} className="bg-green-600 hover:bg-green-700 text-white gap-2">
              <Send className="h-4 w-4" />
              Open WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
