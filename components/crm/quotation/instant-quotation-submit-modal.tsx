'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
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
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/sonner'
import {
  CheckCircle2,
  FileCheck2,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'

type InstantQuotationSubmitModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadId: string
  leadName: string
  leadLocation?: string | null
  leadBudget?: number | null
  activeTab?: 'short' | 'detail' | 'furniture'
  approxSqft?: number | null
  isInstantQuotation?: boolean
  onApproved?: () => void
}

export function InstantQuotationSubmitModal({
  open,
  onOpenChange,
  leadId,
  leadName,
  leadLocation,
  leadBudget,
  activeTab = 'short',
  approxSqft,
  isInstantQuotation = true,
  onApproved,
}: InstantQuotationSubmitModalProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [submitting, setSubmitting] = useState(false)
  const [budgetValue, setBudgetValue] = useState<string>(
    leadBudget && leadBudget > 0 ? leadBudget.toString() : ''
  )
  const [note, setNote] = useState<string>('')

  const handleApprove = async () => {
    try {
      setSubmitting(true)
      const parsedBudget = budgetValue.trim()
        ? Number(budgetValue.replace(/,/g, ''))
        : undefined

      const response = await fetch(`/api/lead/${leadId}/quotation-instant-approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget: parsedBudget,
          note: note.trim() || undefined,
          quotationType: activeTab.toUpperCase(),
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'Failed to approve instant quotation')
      }

      toast.success(
        'Instant quotation approved! Lead moved to Quotation Approved in Budget Queue.'
      )

      onOpenChange(false)
      if (onApproved) {
        onApproved()
      }

      // Determine appropriate budget queue path
      const targetQueueUrl = pathname.includes('/crm/admin')
        ? '/crm/admin/budget-queue'
        : pathname.includes('/crm/sr')
          ? '/crm/sr/budget-queue'
          : payload.budgetQueueUrl || '/crm/admin/budget-queue'

      router.push(targetQueueUrl)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Approval failed')
    } finally {
      setSubmitting(false)
    }
  }

  const activeDocLabel =
    activeTab === 'detail'
      ? 'Detail Quotation'
      : activeTab === 'furniture'
        ? 'Furniture Quotation'
        : 'Short Quotation'

  return (
    <Dialog open={open} onOpenChange={(val) => !submitting && onOpenChange(val)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">Submit & Approve Instant Quotation</DialogTitle>
              <DialogDescription className="text-xs">
                Direct Approval — Bypasses Review Center and routes directly to Budget Queue for Agreement.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Summary Banner */}
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3.5 dark:border-emerald-900/60 dark:bg-emerald-950/30">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-emerald-950 dark:text-emerald-200">
                  Instant Quotation Workflow
                </p>
                <p className="text-emerald-800 dark:text-emerald-300">
                  This quotation will be marked as{' '}
                  <span className="font-bold underline">QUOTATION_APPROVED</span>. The lead will immediately appear in the{' '}
                  <span className="font-bold">Budget Queue</span>, where you or Senior CRM can confirm the Agreement.
                </p>
              </div>
            </div>
          </div>

          {/* Lead & Quotation Details */}
          <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/40 p-3 text-xs">
            <div>
              <span className="text-muted-foreground">Client Name</span>
              <p className="font-semibold text-foreground">{leadName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Location</span>
              <p className="font-semibold text-foreground">{leadLocation || 'Not specified'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Active Studio Document</span>
              <p className="font-semibold text-foreground">{activeDocLabel}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Project Area</span>
              <p className="font-semibold text-foreground">
                {approxSqft && approxSqft > 0 ? `${approxSqft.toLocaleString()} sqft` : 'N/A'}
              </p>
            </div>
          </div>

          {/* Optional Budget Override */}
          <div className="space-y-1.5">
            <Label htmlFor="quotation-budget" className="text-xs font-semibold">
              Quotation / Agreement Base Value (৳ BDT)
            </Label>
            <Input
              id="quotation-budget"
              type="text"
              placeholder="e.g. 850000"
              value={budgetValue}
              onChange={(e) => setBudgetValue(e.target.value)}
              className="text-sm font-medium"
            />
            <p className="text-[11px] text-muted-foreground">
              Optional. Sets the agreed quotation amount for the upcoming Budget Queue agreement.
            </p>
          </div>

          {/* Optional Approval Note */}
          <div className="space-y-1.5">
            <Label htmlFor="quotation-note" className="text-xs font-semibold">
              Approval Note / Remarks (Optional)
            </Label>
            <Textarea
              id="quotation-note"
              rows={2}
              placeholder="e.g. Instant quotation finalized with client. Ready for contract signing."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="text-xs resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => void handleApprove()}
            disabled={submitting}
            className="gap-1.5 bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Approving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Approve & Move to Budget Queue</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
