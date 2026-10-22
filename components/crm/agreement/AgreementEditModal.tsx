'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Loader2,
  Save,
  Download,
  Plus,
  Trash2,
  RefreshCw,
  FileCheck2,
  FileText,
  Clock,
  ShieldAlert,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import type { AgreementData, PaymentScheduleItem } from '@/lib/agreement-types'
import { AgreementDocument } from './AgreementDocument'
import { downloadPdfFromDocument } from '@/components/crm/quotation/pdf/pdf-download'
import { amountInWordsTaka } from '@/lib/number-to-words'

type AgreementEditModalProps = {
  isOpen: boolean
  onClose: () => void
  leadId: string
  leadName: string
  onSaved?: () => void
}

export function AgreementEditModal({
  isOpen,
  onClose,
  leadId,
  leadName,
  onSaved,
}: AgreementEditModalProps) {
  const [data, setData] = useState<AgreementData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [activeTab, setActiveTab] = useState('parties')

  useEffect(() => {
    if (!isOpen || !leadId) return

    let cancelled = false
    async function loadAgreement() {
      try {
        setLoading(true)
        const res = await fetch(`/api/agreements/${leadId}`, { cache: 'no-store' })
        const json = await res.json()
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to load agreement')
        }
        if (!cancelled) {
          setData(json.data)
        }
      } catch (err) {
        console.error('Failed to load agreement:', err)
        toast.error(err instanceof Error ? err.message : 'Failed to load agreement')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadAgreement()
    return () => {
      cancelled = true
    }
  }, [isOpen, leadId])

  if (!isOpen) return null

  const handleFieldChange = <K extends keyof AgreementData>(key: K, value: AgreementData[K]) => {
    if (!data) return
    setData({ ...data, [key]: value })
  }

  // Payment Schedule handlers
  const handlePaymentChange = (index: number, field: keyof PaymentScheduleItem, value: string) => {
    if (!data) return
    const updated = [...(data.paymentSchedule || [])]
    updated[index] = { ...updated[index], [field]: value }
    setData({ ...data, paymentSchedule: updated })
  }

  const handleAddPaymentRow = () => {
    if (!data) return
    const current = data.paymentSchedule || []
    const nextSl = String(current.length + 1).padStart(2, '0')
    const updated: PaymentScheduleItem[] = [
      ...current,
      { sl: nextSl, milestone: 'Custom Milestone', details: '', percentage: '10%' },
    ]
    setData({ ...data, paymentSchedule: updated })
  }

  const handleRemovePaymentRow = (index: number) => {
    if (!data) return
    const current = data.paymentSchedule || []
    const updated = current.filter((_, i) => i !== index).map((row, i) => ({
      ...row,
      sl: String(i + 1).padStart(2, '0'),
    }))
    setData({ ...data, paymentSchedule: updated })
  }

  // Other Terms handlers
  const handleTermChange = (index: number, value: string) => {
    if (!data) return
    const updated = [...(data.otherTerms || [])]
    updated[index] = value
    setData({ ...data, otherTerms: updated })
  }

  const handleAddTerm = () => {
    if (!data) return
    const current = data.otherTerms || []
    setData({ ...data, otherTerms: [...current, 'New term or condition statement.'] })
  }

  const handleRemoveTerm = (index: number) => {
    if (!data) return
    const current = data.otherTerms || []
    setData({ ...data, otherTerms: current.filter((_, i) => i !== index) })
  }

  // Grand Total change handler
  const handleGrandTotalChange = (val: number) => {
    if (!data) return
    const inWords = `${amountInWordsTaka(val)} Taka Only.`
    setData({
      ...data,
      grandTotal: val,
      interiorWorkTotal: val,
      inWordsText: inWords,
    })
  }

  // Save Agreement
  const handleSave = async () => {
    if (!data) return
    try {
      setSaving(true)
      const res = await fetch(`/api/agreements/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save agreement')
      }
      toast.success('Agreement successfully saved and updated!')
      onSaved?.()
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to save agreement')
    } finally {
      setSaving(false)
    }
  }

  // Download PDF
  const handleDownload = async () => {
    if (!data) return
    try {
      setDownloading(true)
      const safeName = data.clientName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
      const fileName = `Agreement_${safeName}_${data.agreementDate.replace(/\s+/g, '_')}.pdf`
      await downloadPdfFromDocument(<AgreementDocument {...data} />, fileName)
      toast.success(`Agreement PDF downloaded for ${data.clientName}`)
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to generate PDF')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden sm:max-w-4xl">
        <DialogHeader className="px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-primary" />
                Agreement Editor & Management
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Customize agreement clauses, payment schedules, and download the client agreement for{' '}
                <span className="font-semibold text-foreground">{leadName}</span>
              </p>
            </div>
            {data && (
              <Badge variant="outline" className="border-primary/40 text-primary text-xs font-semibold">
                {data.workOrderId}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Loading agreement specifications...</p>
          </div>
        ) : !data ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Failed to load agreement data. Please try again.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-6 w-full mb-6">
                <TabsTrigger value="parties" className="text-xs">
                  1. Parties & Intro
                </TabsTrigger>
                <TabsTrigger value="summary" className="text-xs">
                  2. Preamble
                </TabsTrigger>
                <TabsTrigger value="payment" className="text-xs">
                  3. Payment & Time
                </TabsTrigger>
                <TabsTrigger value="detail" className="text-xs">
                  4. Detail Table
                </TabsTrigger>
                <TabsTrigger value="conditions" className="text-xs">
                  5. Conditions
                </TabsTrigger>
                <TabsTrigger value="signatures" className="text-xs">
                  6. Signatures
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: PARTIES & INTRO LETTER */}
              <TabsContent value="parties" className="space-y-4">
                <div className="rounded-lg border bg-card p-4 space-y-4">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Agreement Header & Identification
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs font-medium">Work Order ID</Label>
                      <Input
                        value={data.workOrderId}
                        onChange={(e) => handleFieldChange('workOrderId', e.target.value)}
                        className="text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Reference Code</Label>
                      <Input
                        value={data.referenceNo}
                        onChange={(e) => handleFieldChange('referenceNo', e.target.value)}
                        className="text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Agreement Date</Label>
                      <Input
                        value={data.agreementDate}
                        onChange={(e) => handleFieldChange('agreementDate', e.target.value)}
                        className="text-xs mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs font-medium">Client / Owner Name</Label>
                      <Input
                        value={data.clientName}
                        onChange={(e) => handleFieldChange('clientName', e.target.value)}
                        className="text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Client Phone</Label>
                      <Input
                        value={data.clientPhone}
                        onChange={(e) => handleFieldChange('clientPhone', e.target.value)}
                        className="text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Site Address / Location</Label>
                      <Input
                        value={data.siteAddress}
                        onChange={(e) => handleFieldChange('siteAddress', e.target.value)}
                        className="text-xs mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
                    <div>
                      <Label className="text-xs font-medium">Company CEO Signatory</Label>
                      <Input
                        value={data.ceoName}
                        onChange={(e) => handleFieldChange('ceoName', e.target.value)}
                        className="text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Office Admin Witness</Label>
                      <Input
                        value={data.officeAdminName}
                        onChange={(e) => handleFieldChange('officeAdminName', e.target.value)}
                        className="text-xs mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Intro Letter (Work Order) */}
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Intro Letter (Work Order Document)
                  </h3>

                  <div>
                    <Label className="text-xs font-medium">Subject Line</Label>
                    <Input
                      value={data.introSubject}
                      onChange={(e) => handleFieldChange('introSubject', e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Salutation</Label>
                    <Input
                      value={data.introSalutation}
                      onChange={(e) => handleFieldChange('introSalutation', e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Award Announcement Paragraph</Label>
                    <Textarea
                      rows={2}
                      value={data.introAwardText}
                      onChange={(e) => handleFieldChange('introAwardText', e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Governing Terms Paragraph</Label>
                    <Textarea
                      rows={2}
                      value={data.introTermsText}
                      onChange={(e) => handleFieldChange('introTermsText', e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Work Commencement Instructions</Label>
                    <Textarea
                      rows={2}
                      value={data.introCommenceText}
                      onChange={(e) => handleFieldChange('introCommenceText', e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Token of Acceptance Statement</Label>
                    <Input
                      value={data.introAcceptanceText}
                      onChange={(e) => handleFieldChange('introAcceptanceText', e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* TAB 2: AGREEMENT SUMMARY & PREAMBLE */}
              <TabsContent value="summary" className="space-y-4">
                <div className="rounded-lg border bg-card p-4 space-y-4">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                    2. Agreement Preamble & Recitals
                  </h3>

                  <div>
                    <Label className="text-xs font-medium">Agreement Execution City</Label>
                    <Input
                      value={data.agreementPlace}
                      onChange={(e) => handleFieldChange('agreementPlace', e.target.value)}
                      className="text-xs mt-1 max-w-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium">WHEREAS Clause 1 (Owner Desire)</Label>
                    <Textarea
                      rows={2}
                      value={data.whereasText1}
                      onChange={(e) => handleFieldChange('whereasText1', e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium">WHEREAS Clause 2 (Consultant Capability)</Label>
                    <Textarea
                      rows={2}
                      value={data.whereasText2}
                      onChange={(e) => handleFieldChange('whereasText2', e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Agreement Scope & Directive</Label>
                    <Textarea
                      rows={3}
                      value={data.agreementScopeText}
                      onChange={(e) => handleFieldChange('agreementScopeText', e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* TAB 3: PAYMENT SCHEDULE & DURATION */}
              <TabsContent value="payment" className="space-y-4">
                {/* Duration */}
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Project Duration & Handover Terms
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium">Duration (Working Days)</Label>
                      <Input
                        type="number"
                        value={data.durationWorkingDays}
                        onChange={(e) => {
                          const num = parseInt(e.target.value, 10) || 0
                          handleFieldChange('durationWorkingDays', num)
                        }}
                        className="text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Duration In Words</Label>
                      <Input
                        value={data.durationWorkingDaysWords}
                        onChange={(e) => handleFieldChange('durationWorkingDaysWords', e.target.value)}
                        className="text-xs mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Duration Clause Text</Label>
                    <Textarea
                      rows={2}
                      value={data.durationText}
                      onChange={(e) => handleFieldChange('durationText', e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Handover & Adjustment Terms</Label>
                    <Textarea
                      rows={2}
                      value={data.durationDiscussionsText}
                      onChange={(e) => handleFieldChange('durationDiscussionsText', e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>
                </div>

                {/* Payment Schedule */}
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                        Payment Milestones & Schedule
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Configure client payment stages and percentage breakdown
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 h-7 text-xs"
                      onClick={handleAddPaymentRow}
                    >
                      <Plus className="h-3 w-3" /> Add Stage
                    </Button>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[10%]">SL</TableHead>
                        <TableHead className="w-[45%]">Milestone Stage</TableHead>
                        <TableHead className="w-[30%]">Details / Description</TableHead>
                        <TableHead className="w-[15%]">Percentage</TableHead>
                        <TableHead className="w-[5%]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(data.paymentSchedule || []).map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-semibold text-xs">{row.sl}</TableCell>
                          <TableCell>
                            <Input
                              value={row.milestone}
                              onChange={(e) => handlePaymentChange(idx, 'milestone', e.target.value)}
                              className="h-8 text-xs"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={row.details || ''}
                              onChange={(e) => handlePaymentChange(idx, 'details', e.target.value)}
                              placeholder="e.g. (After finishing ceiling)"
                              className="h-8 text-xs"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={row.percentage}
                              onChange={(e) => handlePaymentChange(idx, 'percentage', e.target.value)}
                              className="h-8 text-xs text-center font-bold"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemovePaymentRow(idx)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="pt-2">
                    <Label className="text-xs font-medium">Costing Summary Note</Label>
                    <Input
                      value={data.projectCostSummaryNote}
                      onChange={(e) => handleFieldChange('projectCostSummaryNote', e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* TAB 4: DETAIL QUOTATION TABLE & COSTING */}
              <TabsContent value="detail" className="space-y-4">
                <div className="rounded-lg border bg-card p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                        Detail Quotation Line Items & Costing
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Extracted directly from the client’s final detail quotation
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 h-8 text-xs"
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/agreements/${leadId}?refresh=true`)
                            const json = await res.json()
                            if (json.success && json.data) {
                              setData((prev) => (prev ? { ...prev, items: json.data.items, grandTotal: json.data.grandTotal, interiorWorkTotal: json.data.grandTotal, inWordsText: json.data.inWordsText } : json.data))
                              toast.success('Quotation items re-synced successfully')
                            }
                          } catch {
                            toast.error('Failed to sync quotation')
                          }
                        }}
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> Re-sync from Quotation
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg">
                    <div>
                      <Label className="text-xs font-medium">Grand Total Value (BDT)</Label>
                      <Input
                        type="number"
                        value={data.grandTotal}
                        onChange={(e) => handleGrandTotalChange(parseFloat(e.target.value) || 0)}
                        className="text-sm font-bold mt-1 text-primary"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Amount In Words</Label>
                      <Input
                        value={data.inWordsText}
                        onChange={(e) => handleFieldChange('inWordsText', e.target.value)}
                        className="text-xs mt-1 italic font-medium"
                      />
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-[8%]">SL</TableHead>
                          <TableHead className="w-[20%]">Name</TableHead>
                          <TableHead className="w-[42%]">Materials & Specification</TableHead>
                          <TableHead className="w-[12%] text-center">Qty</TableHead>
                          <TableHead className="w-[18%] text-right">Total (BDT)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(data.items || []).map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-xs font-medium">{item.sl}</TableCell>
                            <TableCell className="text-xs font-semibold">{item.name}</TableCell>
                            <TableCell className="text-xs text-muted-foreground line-clamp-2 max-w-[300px]">
                              {item.materials}
                            </TableCell>
                            <TableCell className="text-xs text-center">{item.qtySft}</TableCell>
                            <TableCell className="text-xs text-right font-bold">
                              {item.total.toLocaleString('en-IN')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              {/* TAB 5: CONDITIONS */}
              <TabsContent value="conditions" className="space-y-4">
                <div className="rounded-lg border bg-card p-4 space-y-4">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-primary" />
                    Agreement Conditions & Clauses
                  </h3>

                  <div>
                    <Label className="text-xs font-medium">Provisions Regarding Working Procedure</Label>
                    <Textarea
                      rows={2}
                      value={data.workingProcedureText}
                      onChange={(e) => handleFieldChange('workingProcedureText', e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Site Inspection Clause</Label>
                    <Textarea
                      rows={2}
                      value={data.siteInspectionText}
                      onChange={(e) => handleFieldChange('siteInspectionText', e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Defective Work / Materials Clause</Label>
                    <Textarea
                      rows={2}
                      value={data.defectiveWorkText}
                      onChange={(e) => handleFieldChange('defectiveWorkText', e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Inspection of Work Clause</Label>
                    <Textarea
                      rows={2}
                      value={data.inspectionOfWorkText}
                      onChange={(e) => handleFieldChange('inspectionOfWorkText', e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Clerical Errors to be Rectified</Label>
                    <Textarea
                      rows={2}
                      value={data.clericalErrorsText}
                      onChange={(e) => handleFieldChange('clericalErrorsText', e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Dispute Resolution & Arbitration</Label>
                    <Textarea
                      rows={3}
                      value={data.disputeResolutionText}
                      onChange={(e) => handleFieldChange('disputeResolutionText', e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Legal Jurisdiction</Label>
                    <Input
                      value={data.jurisdictionText}
                      onChange={(e) => handleFieldChange('jurisdictionText', e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Warranty (1 Year Service Guarantee)</Label>
                    <Textarea
                      rows={2}
                      value={data.warrantyText}
                      onChange={(e) => handleFieldChange('warrantyText', e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Warranty Exclusions</Label>
                    <Textarea
                      rows={2}
                      value={data.warrantyExclusionsText}
                      onChange={(e) => handleFieldChange('warrantyExclusionsText', e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Taxes and VAT Terms</Label>
                    <Textarea
                      rows={2}
                      value={data.taxesAndVatText}
                      onChange={(e) => handleFieldChange('taxesAndVatText', e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>

                  {/* Other Terms list */}
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Other Terms & Conditions (14 Points)
                      </Label>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 h-7 text-xs"
                        onClick={handleAddTerm}
                      >
                        <Plus className="h-3 w-3" /> Add Point
                      </Button>
                    </div>

                    {(data.otherTerms || []).map((term, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-xs font-bold text-primary mt-2 w-6 shrink-0">
                          {String(idx + 1).padStart(2, '0')}.
                        </span>
                        <Textarea
                          rows={2}
                          value={term}
                          onChange={(e) => handleTermChange(idx, e.target.value)}
                          className="text-xs flex-1"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 mt-1"
                          onClick={() => handleRemoveTerm(idx)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* TAB 6: SIGNATURES */}
              <TabsContent value="signatures" className="space-y-4">
                <div className="rounded-lg border bg-card p-4 space-y-4">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                    6. Signatures & Witness Titles
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs font-medium">Witness 1 Title (Owner)</Label>
                      <Input
                        value={data.witness1Title}
                        onChange={(e) => handleFieldChange('witness1Title', e.target.value)}
                        className="text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Witness 2 Title (Admin)</Label>
                      <Input
                        value={data.witness2Title}
                        onChange={(e) => handleFieldChange('witness2Title', e.target.value)}
                        className="text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Witness 3 Title (CEO)</Label>
                      <Input
                        value={data.witness3Title}
                        onChange={(e) => handleFieldChange('witness3Title', e.target.value)}
                        className="text-xs mt-1"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        <DialogFooter className="px-6 py-3 border-t bg-muted/20 flex flex-row items-center justify-between sm:justify-between">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving || downloading}>
            Close
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={loading || saving || downloading}
              onClick={() => void handleDownload()}
            >
              {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Download Agreement PDF
            </Button>

            <Button
              size="sm"
              className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={loading || saving || downloading}
              onClick={() => void handleSave()}
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
