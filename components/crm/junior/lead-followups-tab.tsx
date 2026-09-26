'use client'

import { useMemo, useState } from 'react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, User, Phone, MessageSquare, ExternalLink, Send } from 'lucide-react'

type Followup = {
  id: string
  followupDate: string
  notes: string
  status: string
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

export function LeadFollowupsTab({
  followups,
  leadId,
  currentUserId,
  onRefreshFollowups,
  onAddFollowup,
  leadName,
  leadPhone,
}: LeadFollowupsTabProps) {
  const [completeOpen, setCompleteOpen] = useState(false)
  const [selectedFollowup, setSelectedFollowup] = useState<Followup | null>(null)
  const [completionNote, setCompletionNote] = useState('')
  const [completing, setCompleting] = useState(false)
  const [completeError, setCompleteError] = useState<string | null>(null)
  
  // WhatsApp Modal state
  const [waModalOpen, setWaModalOpen] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState('quotation')
  const [waMessage, setWaMessage] = useState('')

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

    setCompleting(true)
    setCompleteError(null)

    const completionStatus = selectedFollowup.status === 'MISSED' ? 'LATELY_DONE' : 'DONE'

    try {
      const followupRes = await fetch(
        `/api/followup/${leadId}/${selectedFollowup.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: completionStatus,
            notes: completionNote.trim(),
            userId: currentUserId ?? undefined,
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
      onRefreshFollowups()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete follow-up.'
      setCompleteError(message)
    } finally {
      setCompleting(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Quick Action Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
        <div className="text-sm font-medium text-foreground">
          Client Quick Engagement Actions
        </div>
        <div className="flex items-center gap-2">
          {leadPhone ? (
            <>
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs text-green-700 border-green-300 hover:bg-green-50" onClick={openWaModal}>
                <MessageSquare className="h-3.5 w-3.5 fill-green-600 text-green-600" />
                WhatsApp Follow-Up
              </Button>
              <a href={`tel:${leadPhone}`}>
                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs text-blue-700 border-blue-300 hover:bg-blue-50">
                  <Phone className="h-3.5 w-3.5 text-blue-600" />
                  Call Client
                </Button>
              </a>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">No phone number available</span>
          )}
          <Button size="sm" onClick={onAddFollowup} className="h-8 text-xs">
            + Schedule Follow-Up
          </Button>
        </div>
      </div>

      {followups.length === 0 ? (
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground text-sm">No followups scheduled.</p>
            <Button
              className="mt-4"
              onClick={onAddFollowup}
            >
              Add Followup
            </Button>
          </CardContent>
        </Card>
      ) : (
        followups.map((followup) => (
          <Card
            key={followup.id}
            className="border-border hover:shadow-sm transition-shadow"
          >
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <p className="font-semibold text-foreground">
                      {new Date(followup.followupDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{followup.notes}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{followup.assignedTo.fullName}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge
                    className={
                      followup.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200'
                        : followup.status === 'MISSED'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
                    }
                  >
                    {followup.status}
                  </Badge>
                  {pendingOrMissed.has(followup.status) ? (
                    <Button size="sm" variant="outline" onClick={() => openCompleteModal(followup)}>
                      Complete
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Complete Follow-Up Dialog */}
      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete follow-up</DialogTitle>
            <DialogDescription>
              {selectedFollowup?.status === 'MISSED'
                ? 'This follow-up will be marked as lately done.'
                : 'This follow-up will be marked as done.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              value={completionNote}
              onChange={(event) => setCompletionNote(event.target.value)}
              placeholder="Follow-up outcome & client notes"
              rows={4}
            />
            {completeError ? <p className="text-sm text-destructive">{completeError}</p> : null}
          </div>
          <DialogFooter>
            <Button onClick={handleComplete} disabled={completing}>
              {completing ? 'Saving...' : 'Complete follow-up'}
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

