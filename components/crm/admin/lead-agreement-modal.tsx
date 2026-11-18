'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileCheck2,
  Download,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileEdit,
  BadgePercent,
  Coins,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'
import type { AgreementData, AgreementPaymentStage } from '@/lib/agreement-types'
import { defaultAgreementStages } from '@/lib/agreement-types'
import { AgreementDocument } from '@/components/crm/agreement/AgreementDocument'
import { AgreementEditModal } from '@/components/crm/agreement/AgreementEditModal'
import { downloadPdfFromDocument } from '@/components/crm/quotation/pdf/pdf-download'
import { amountInWordsTaka } from '@/lib/number-to-words'

export type LeadSummaryForAgreement = {
  id: string
  clientId?: number | null
  name: string
  phone: string | null
  email?: string | null
  location: string | null
  stage: string
  agreementType?: string | null
  agreementValue?: number | null
  quotationDrafts?: Array<{
    id: string
    draftKey: string
    quotationType?: string | null
    grandTotal: number
    status: string
    updatedAt: string
  }>
}

interface LeadAgreementModalProps {
  isOpen: boolean
  onClose: () => void
  lead: LeadSummaryForAgreement | null
  onSuccess?: () => void
}

const AGREEMENT_TYPES = [
  { value: 'FITOUT_AGREEMENT', label: 'Interior Fitout Agreement' },
  { value: 'DESIGN_AGREEMENT', label: 'Interior Design Agreement' },
]

export function LeadAgreementModal({
  isOpen,
  onClose,
  lead,
  onSuccess,
}: LeadAgreementModalProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [showFullEditModal, setShowFullEditModal] = useState(false)
  const [showMilestones, setShowMilestones] = useState(true)
  const [editableStages, setEditableStages] = useState<AgreementPaymentStage[]>([])

  // Agreement State
  const [agreementData, setAgreementData] = useState<AgreementData | null>(null)
  const [isSaved, setIsSaved] = useState(false)

  // Quotations detection
  const quotations = useMemo(() => {
    return (lead?.quotationDrafts || []).filter((d) => d.draftKey !== 'agreement')
  }, [lead?.quotationDrafts])

  const hasQuotation = quotations.length > 0
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>('')

  // Form fields
  const [agreementType, setAgreementType] = useState('FITOUT_AGREEMENT')
  const [manualGrossValue, setManualGrossValue] = useState<number | ''>('')
  const [discountValue, setDiscountValue] = useState<number | ''>('')

  // Selected quotation
  const activeQuotation = useMemo(() => {
    if (!hasQuotation) return null
    if (selectedQuotationId) {
      return quotations.find((q) => q.id === selectedQuotationId) || quotations[0]
    }
    // Default to the one with the highest grand total or first
    return [...quotations].sort((a, b) => b.grandTotal - a.grandTotal)[0] || null
  }, [hasQuotation, quotations, selectedQuotationId])

  // Calculated values
  const grossValue = useMemo(() => {
    if (hasQuotation && activeQuotation) {
      return activeQuotation.grandTotal
    }
    return typeof manualGrossValue === 'number' ? manualGrossValue : 0
  }, [hasQuotation, activeQuotation, manualGrossValue])

  const discountNum = typeof discountValue === 'number' ? discountValue : 0
  const finalValue = Math.max(0, grossValue - discountNum)

  // Load existing agreement / default agreement
  useEffect(() => {
    if (!isOpen || !lead) return

    let cancelled = false
    async function fetchAgreement() {
      try {
        setLoading(true)
        const res = await fetch(`/api/agreements/${lead?.id}`, { cache: 'no-store' })
        const json = await res.json()
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to load agreement')
        }
        if (!cancelled) {
          const fetchedData: AgreementData = json.data
          setAgreementData(fetchedData)
          setIsSaved(Boolean(json.isSaved))

          // Initialize form state
          if (fetchedData.agreementType) {
            setAgreementType(fetchedData.agreementType)
          } else if (lead?.agreementType) {
            setAgreementType(lead.agreementType)
          }

          // If there's an existing quotation, select it
          if (quotations.length > 0) {
            setSelectedQuotationId(quotations[0].id)
          }

          // If agreement was already saved with a value, or no quotation, set manual gross
          if (!hasQuotation) {
            const initialVal = fetchedData.grandTotal || lead?.agreementValue || ''
            setManualGrossValue(initialVal)
          }

          if (fetchedData.discountAmount) {
            setDiscountValue(fetchedData.discountAmount)
          }

          // Initialize editable payment milestones
          if (fetchedData.paymentSchedule?.length) {
            setEditableStages(fetchedData.paymentSchedule)
          } else {
            const initialVal = fetchedData.grandTotal || (typeof lead?.agreementValue === 'number' ? lead.agreementValue : 0)
            setEditableStages(defaultAgreementStages(initialVal > 0 ? initialVal : 1000000))
          }
        }
      } catch (err) {
        console.error('Failed to load agreement data:', err)
        toast.error('Could not load agreement information.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchAgreement()
    return () => {
      cancelled = true
    }
  }, [isOpen, lead, hasQuotation, quotations])

  // Recalculate milestone amounts whenever finalValue changes
  useEffect(() => {
    if (!isOpen || finalValue <= 0) return
    setEditableStages((prevStages) => {
      if (!prevStages.length) return defaultAgreementStages(finalValue)
      return prevStages.map((stg) => {
        const pctNum = parseFloat(stg.percentage.replace(/[^0-9.]/g, ''))
        if (!isNaN(pctNum) && pctNum > 0) {
          return {
            ...stg,
            amount: String(Math.round((pctNum / 100) * finalValue)),
            fraction: pctNum / 100,
          }
        }
        return stg
      })
    })
  }, [finalValue, isOpen])

  const handleStagePercentageChange = (idx: number, newPctStr: string) => {
    const cleanNum = parseFloat(newPctStr.replace(/[^0-9.]/g, ''))
    setEditableStages((prev) => {
      const updated = [...prev]
      const current = updated[idx]
      let calcAmount = current.amount
      if (!isNaN(cleanNum) && finalValue > 0) {
        calcAmount = String(Math.round((cleanNum / 100) * finalValue))
      }
      updated[idx] = {
        ...current,
        percentage: newPctStr ? `${newPctStr}%` : '',
        amount: calcAmount,
        fraction: !isNaN(cleanNum) ? cleanNum / 100 : current.fraction,
      }
      return updated
    })
  }

  const handleStageAmountChange = (idx: number, newAmount: string) => {
    setEditableStages((prev) => {
      const updated = [...prev]
      const current = updated[idx]
      const amtNum = parseFloat(newAmount.replace(/,/g, ''))
      let newPct = current.percentage
      if (!isNaN(amtNum) && finalValue > 0) {
        const pct = ((amtNum / finalValue) * 100).toFixed(2).replace(/\.00$/, '')
        newPct = `${pct}%`
      }
      updated[idx] = {
        ...current,
        amount: newAmount,
        percentage: newPct,
      }
      return updated
    })
  }

  if (!isOpen || !lead) return null

  // Save Agreement
  const handleSaveAgreement = async () => {
    if (finalValue <= 0) {
      toast.error('Please enter a valid agreement value greater than 0.')
      return
    }

    try {
      setSaving(true)
      const baseData: Partial<AgreementData> = agreementData || {}

      const updatedPayload: Partial<AgreementData> = {
        ...baseData,
        clientName: lead.name,
        clientPhone: lead.phone || '',
        projectName: lead.location || 'Dhaka, Bangladesh',
        siteAddress: lead.location || 'Dhaka, Bangladesh',
        agreementType,
        grossTotal: grossValue,
        discountAmount: discountNum > 0 ? discountNum : undefined,
        grandTotal: finalValue,
        agreementValue: finalValue,
        inWordsText: `${amountInWordsTaka(finalValue)} Taka Only.`,
        paymentSchedule: editableStages.length > 0 ? editableStages : defaultAgreementStages(finalValue),
      }

      const res = await fetch(`/api/agreements/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPayload),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save agreement')
      }

      setAgreementData(json.data)
      setIsSaved(true)
      toast.success(`Agreement confirmed successfully for ${lead.name}!`)
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Save agreement failed:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to save agreement')
    } finally {
      setSaving(false)
    }
  }

  // Download PDF
  const handleDownloadPdf = async () => {
    if (!agreementData) {
      toast.error('Agreement data not ready for download.')
      return
    }
    try {
      setDownloading(true)
      const safeName = (agreementData.clientName || lead.name).replace(/[^a-z0-9]/gi, '_').toLowerCase()
      const fileName = `Agreement_${safeName}.pdf`
      await downloadPdfFromDocument(<AgreementDocument {...agreementData} />, fileName)
      toast.success('Agreement PDF downloaded successfully!')
    } catch (err) {
      console.error('PDF download error:', err)
      toast.error('Failed to generate PDF document.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Client Agreement</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Confirm agreement and generate legal contract paper
                </DialogDescription>
              </div>
            </div>

            {/* Lead Brief Banner */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/30 p-2.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground text-sm">{lead.name}</span>
                {lead.clientId ? (
                  <Badge variant="secondary" className="font-mono text-[11px] font-bold">
                    #{lead.clientId}
                  </Badge>
                ) : null}
              </div>
              <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                <span>Phone: <strong className="text-foreground">{lead.phone || '—'}</strong></span>
                <span>•</span>
                <span>Location: <strong className="text-foreground">{lead.location || '—'}</strong></span>
              </div>
            </div>
          </DialogHeader>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Loading agreement information...</span>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {/* Existing Status Notice */}
              {isSaved ? (
                <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-50/60 p-3 dark:border-emerald-800/40 dark:bg-emerald-950/20 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-semibold text-emerald-800 dark:text-emerald-300">Agreement is Confirmed</span>
                      <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                        Total Value: <strong>৳{agreementData?.grandTotal?.toLocaleString('en-IN') || lead.agreementValue?.toLocaleString('en-IN') || '—'}</strong>
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1 border-emerald-500/40 text-emerald-700 hover:bg-emerald-100/50 dark:text-emerald-300"
                    onClick={handleDownloadPdf}
                    disabled={downloading}
                  >
                    {downloading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                    <span>PDF Paper</span>
                  </Button>
                </div>
              ) : null}

              {/* CASE A: Quotation Exists */}
              {hasQuotation ? (
                <div className="rounded-lg border border-sky-500/30 bg-sky-50/50 p-3.5 dark:border-sky-800/40 dark:bg-sky-950/20 space-y-3">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-sky-900 dark:text-sky-200">
                          Quotation Detected ({quotations.length})
                        </span>
                        <Badge variant="outline" className="text-[10px] bg-sky-100/70 border-sky-300 text-sky-800 dark:bg-sky-900 dark:text-sky-200">
                          Auto-Sourced
                        </Badge>
                      </div>
                      <p className="text-[11px] text-sky-700/90 dark:text-sky-300/80">
                        Agreement value is automatically linked from the client's quotation. No manual input is required.
                      </p>
                    </div>
                  </div>

                  {/* Multi-quotation selector if lead has more than 1 draft */}
                  {quotations.length > 1 ? (
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-sky-900 dark:text-sky-200">Select Quotation</Label>
                      <Select value={selectedQuotationId || quotations[0].id} onValueChange={setSelectedQuotationId}>
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue placeholder="Select quotation" />
                        </SelectTrigger>
                        <SelectContent>
                          {quotations.map((q) => (
                            <SelectItem key={q.id} value={q.id} className="text-xs">
                              {q.draftKey.toUpperCase()} — ৳{q.grandTotal.toLocaleString('en-IN')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}

                  {/* Values Row */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="rounded-md border border-border/60 bg-background/80 p-2.5">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Quotation Total</span>
                      <div className="text-base font-bold text-foreground">
                        ৳{grossValue.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div className="rounded-md border border-border/60 bg-background/80 p-2">
                      <Label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Discount (Optional ৳)</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value === '' ? '' : Number(e.target.value))}
                        className="h-7 text-xs font-semibold mt-1"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* CASE B: No Quotation */
                <div className="rounded-lg border border-amber-500/30 bg-amber-50/50 p-3.5 dark:border-amber-800/40 dark:bg-amber-950/20 space-y-3">
                  <div className="flex items-start gap-2">
                    <FileEdit className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                          Direct Agreement (No Quotation)
                        </span>
                        <Badge variant="outline" className="text-[10px] bg-amber-100/70 border-amber-300 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                          Manual Input
                        </Badge>
                      </div>
                      <p className="text-[11px] text-amber-700/90 dark:text-amber-300/80">
                        No quotation exists for this lead. Enter the agreed project value and any discount below:
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-foreground">
                        Agreement Value (Gross ৳) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="e.g. 1500000"
                        value={manualGrossValue}
                        onChange={(e) => setManualGrossValue(e.target.value === '' ? '' : Number(e.target.value))}
                        className="h-8 text-xs font-semibold"
                        autoFocus
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-foreground">Discount (Optional ৳)</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value === '' ? '' : Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Net Final Agreement Value Card */}
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Coins className="h-3.5 w-3.5" /> Final Agreed Amount
                  </span>
                  <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
                    ৳{finalValue > 0 ? finalValue.toLocaleString('en-IN') : '0'}
                  </span>
                </div>
                {finalValue > 0 ? (
                  <p className="text-[11px] text-muted-foreground italic border-t border-border/40 pt-1">
                    "{amountInWordsTaka(finalValue)} Taka Only."
                  </p>
                ) : null}
              </div>

              {/* Agreement Type */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Agreement Type / Format</Label>
                <Select value={agreementType} onValueChange={setAgreementType}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select Agreement Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGREEMENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="text-xs">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Editable Payment Milestones */}
              <div className="rounded-lg border border-border/60 bg-muted/20">
                <button
                  type="button"
                  onClick={() => setShowMilestones(!showMilestones)}
                  className="w-full flex items-center justify-between p-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className="flex items-center gap-1.5 font-semibold text-foreground">
                    <BadgePercent className="h-3.5 w-3.5 text-primary" />
                    Payment Milestones ({editableStages.length} Stages)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground font-mono">
                      Total: {editableStages.reduce((sum, s) => sum + (parseFloat(s.percentage.replace(/[^0-9.]/g, '')) || 0), 0).toFixed(1)}%
                    </span>
                    {showMilestones ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </div>
                </button>

                {showMilestones ? (
                  <div className="p-2.5 pt-0 border-t border-border/40 space-y-1.5 text-xs">
                    <div className="grid grid-cols-[1fr_75px_110px] gap-2 text-[10px] font-semibold text-muted-foreground uppercase pt-2 pb-0.5 px-0.5">
                      <span>Milestone Stage</span>
                      <span className="text-center">Percent</span>
                      <span className="text-right">Amount (৳)</span>
                    </div>
                    {editableStages.map((stg, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_75px_110px] gap-2 items-center py-1 border-b border-border/30 last:border-none">
                        <span className="text-[11px] text-muted-foreground line-clamp-2 leading-tight" title={stg.stage}>
                          {idx + 1}. {stg.stage}
                        </span>
                        <div className="relative flex items-center">
                          <Input
                            type="text"
                            value={stg.percentage.replace('%', '').trim()}
                            onChange={(e) => handleStagePercentageChange(idx, e.target.value)}
                            placeholder="%"
                            className="h-7 text-xs text-center font-bold pr-3.5"
                          />
                          <span className="absolute right-1 text-[10px] text-muted-foreground pointer-events-none">%</span>
                        </div>
                        <div className="relative flex items-center">
                          <Input
                            type="number"
                            value={stg.amount}
                            onChange={(e) => handleStageAmountChange(idx, e.target.value)}
                            placeholder="৳"
                            className="h-7 text-xs text-right font-semibold pl-3.5"
                          />
                          <span className="absolute left-1.5 text-[10px] text-muted-foreground pointer-events-none">৳</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2 pt-2 border-t border-border/60">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {isSaved ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowFullEditModal(true)}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Edit Clauses</span>
                </Button>
              ) : null}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={onClose}>
                Cancel
              </Button>

              {isSaved ? (
                <Button
                  type="button"
                  size="sm"
                  className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleDownloadPdf}
                  disabled={downloading}
                >
                  {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  <span>Download Agreement PDF</span>
                </Button>
              ) : null}

              <Button
                type="button"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={handleSaveAgreement}
                disabled={saving || loading || finalValue <= 0}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{isSaved ? 'Update Agreement' : 'Confirm & Save Agreement'}</span>
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full Agreement Clauses Editor if needed */}
      {showFullEditModal ? (
        <AgreementEditModal
          isOpen={showFullEditModal}
          onClose={() => setShowFullEditModal(false)}
          leadId={lead.id}
          leadName={lead.name}
          onSaved={() => {
            if (onSuccess) onSuccess()
          }}
        />
      ) : null}
    </>
  )
}
