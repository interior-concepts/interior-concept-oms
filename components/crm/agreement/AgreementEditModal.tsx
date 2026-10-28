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
  ScrollText,
} from 'lucide-react'
import { toast } from 'sonner'
import type { AgreementData, AgreementPaymentStage, AgreementClauseGroup } from '@/lib/agreement-types'
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
  const handlePaymentChange = (index: number, field: keyof AgreementPaymentStage, value: string) => {
    if (!data) return
    const updated = [...(data.paymentSchedule || [])]
    updated[index] = { ...updated[index], [field]: value }
    setData({ ...data, paymentSchedule: updated })
  }

  const handleAddPaymentRow = () => {
    if (!data) return
    const current = data.paymentSchedule || []
    const updated: AgreementPaymentStage[] = [
      ...current,
      { stage: 'Additional Stage Milestone', percentage: '10 %', amount: '0' },
    ]
    setData({ ...data, paymentSchedule: updated })
  }

  const handleRemovePaymentRow = (index: number) => {
    if (!data) return
    const current = data.paymentSchedule || []
    const updated = current.filter((_, i) => i !== index)
    setData({ ...data, paymentSchedule: updated })
  }

  // Annexure handlers
  const handleAnnexureChange = (index: number, value: string) => {
    if (!data) return
    const updated = [...(data.annexures || [])]
    updated[index] = value
    setData({ ...data, annexures: updated })
  }

  const handleAddAnnexure = () => {
    if (!data) return
    const current = data.annexures || []
    const nextIdx = current.length + 1
    setData({ ...data, annexures: [...current, `Annexure A${nextIdx}: New annexure provision.`] })
  }

  const handleRemoveAnnexure = (index: number) => {
    if (!data) return
    const current = data.annexures || []
    setData({ ...data, annexures: current.filter((_, i) => i !== index) })
  }

  // Clause Groups handlers
  const handleClauseChange = (groupIndex: number, clauseIndex: number, value: string) => {
    if (!data) return
    const groups = [...(data.clauseGroups || [])]
    const clauses = [...(groups[groupIndex]?.clauses || [])]
    clauses[clauseIndex] = value
    groups[groupIndex] = { ...groups[groupIndex], clauses }
    setData({ ...data, clauseGroups: groups })
  }

  const handleAddClause = (groupIndex: number) => {
    if (!data) return
    const groups = [...(data.clauseGroups || [])]
    const clauses = [...(groups[groupIndex]?.clauses || [])]
    clauses.push('New Clause: Description and terms of this provision.')
    groups[groupIndex] = { ...groups[groupIndex], clauses }
    setData({ ...data, clauseGroups: groups })
  }

  const handleRemoveClause = (groupIndex: number, clauseIndex: number) => {
    if (!data) return
    const groups = [...(data.clauseGroups || [])]
    const clauses = (groups[groupIndex]?.clauses || []).filter((_, i) => i !== clauseIndex)
    groups[groupIndex] = { ...groups[groupIndex], clauses }
    setData({ ...data, clauseGroups: groups })
  }

  // Witness handlers
  const handleWitnessChange = (index: number, value: string) => {
    if (!data) return
    const updated = [...(data.witnessNames || ['', '', ''])]
    updated[index] = value
    setData({ ...data, witnessNames: updated })
  }

  // Grand Total change handler
  const handleGrandTotalChange = (val: number) => {
    if (!data) return
    const inWords = `${amountInWordsTaka(val)} Taka Only.`
    setData({
      ...data,
      grandTotal: val,
      interiorWorkTotal: val,
      agreementValue: val,
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
      const safeName = (data.clientName || leadName).replace(/[^a-z0-9]/gi, '_').toLowerCase()
      const fileName = `Agreement_${safeName}.pdf`
      await downloadPdfFromDocument(<AgreementDocument {...data} />, fileName)
      toast.success('Agreement PDF downloaded successfully!')
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to download PDF')
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
                Segmented agreement specifications, clauses, schedule of rates, and client contract for{' '}
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
                  1. Parties & Recitals
                </TabsTrigger>
                <TabsTrigger value="letter" className="text-xs">
                  2. Work Order Letter
                </TabsTrigger>
                <TabsTrigger value="payment" className="text-xs">
                  3. Payment & Annexures
                </TabsTrigger>
                <TabsTrigger value="detail" className="text-xs">
                  4. Detail Schedule
                </TabsTrigger>
                <TabsTrigger value="clauses" className="text-xs">
                  5. Agreement Clauses
                </TabsTrigger>
                <TabsTrigger value="signatures" className="text-xs">
                  6. Signatures & Witnesses
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: PARTIES & RECITALS */}
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
                      <Label className="text-xs font-medium">Sub Contract ID</Label>
                      <Input
                        value={data.subContractId}
                        onChange={(e) => handleFieldChange('subContractId', e.target.value)}
                        className="text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Reference Code</Label>
                      <Input
                        value={data.reference}
                        onChange={(e) => {
                          handleFieldChange('reference', e.target.value)
                          handleFieldChange('referenceNo', e.target.value)
                        }}
                        className="text-xs mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs font-medium">Agreement Date</Label>
                      <Input
                        value={data.agreementDate}
                        onChange={(e) => handleFieldChange('agreementDate', e.target.value)}
                        className="text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Client / Owner Name</Label>
                      <Input
                        value={data.ownerName || data.clientName}
                        onChange={(e) => {
                          handleFieldChange('ownerName', e.target.value)
                          handleFieldChange('clientName', e.target.value)
                        }}
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
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium">Site Address / Project Location</Label>
                      <Input
                        value={data.projectAddress || data.siteAddress}
                        onChange={(e) => {
                          handleFieldChange('projectAddress', e.target.value)
                          handleFieldChange('siteAddress', e.target.value)
                          handleFieldChange('ownerAddress', e.target.value)
                        }}
                        className="text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Senior CRM / Coordinator</Label>
                      <Input
                        value={data.srCrmName}
                        onChange={(e) => handleFieldChange('srCrmName', e.target.value)}
                        className="text-xs mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t">
                    <div>
                      <Label className="text-xs font-medium">Company Name</Label>
                      <Input
                        value={data.companyName}
                        onChange={(e) => handleFieldChange('companyName', e.target.value)}
                        className="text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Trade License No</Label>
                      <Input
                        value={data.tradeLicenseNo}
                        onChange={(e) => handleFieldChange('tradeLicenseNo', e.target.value)}
                        className="text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Consultant Representative (GM)</Label>
                      <Input
                        value={data.companyRepresentative}
                        onChange={(e) => handleFieldChange('companyRepresentative', e.target.value)}
                        className="text-xs mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium">CEO Signatory Name</Label>
                      <Input
                        value={data.ceoName}
                        onChange={(e) => handleFieldChange('ceoName', e.target.value)}
                        className="text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Company Address</Label>
                      <Input
                        value={data.companyAddress}
                        onChange={(e) => handleFieldChange('companyAddress', e.target.value)}
                        className="text-xs mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Recitals */}
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <ScrollText className="h-4 w-4 text-primary" />
                    Agreement Preamble & Recitals (Page 2)
                  </h3>

                  <div>
                    <Label className="text-xs font-medium">WHEREAS Clause 1 (Owner Requirement)</Label>
                    <Textarea
                      rows={2}
                      value={data.whereasText1}
                      onChange={(e) => handleFieldChange('whereasText1', e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium">WHEREAS Clause 2 (Consultant Qualification)</Label>
                    <Textarea
                      rows={2}
                      value={data.whereasText2}
                      onChange={(e) => handleFieldChange('whereasText2', e.target.value)}
                      className="text-xs mt-1"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* TAB 2: WORK ORDER LETTER */}
              <TabsContent value="letter" className="space-y-4">
                <div className="rounded-lg border bg-card p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Page 1: Work Order For Interior Works
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Formal award letter issued by the Owner to the Consultant
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Full Work Order Letter Body</Label>
                    <p className="text-[11px] text-muted-foreground mb-1">
                      Each paragraph separated by a blank line will be rendered on Page 1 before the signature block.
                    </p>
                    <Textarea
                      rows={12}
                      value={data.letterBody}
                      onChange={(e) => handleFieldChange('letterBody', e.target.value)}
                      className="text-xs font-mono leading-relaxed mt-1"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* TAB 3: PAYMENT & ANNEXURES */}
              <TabsContent value="payment" className="space-y-4">
                {/* Payment Schedule */}
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        Payment Milestones & Schedule (Page 3)
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Structured payment stages with percentage and amount in BDT
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
                        <TableHead className="w-[8%]">SL</TableHead>
                        <TableHead className="w-[52%]">Payment Stage Description</TableHead>
                        <TableHead className="w-[18%] text-center">Percentage</TableHead>
                        <TableHead className="w-[17%] text-right">Amount (৳)</TableHead>
                        <TableHead className="w-[5%]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(data.paymentSchedule || []).map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-semibold text-xs">{String(idx + 1).padStart(2, '0')}</TableCell>
                          <TableCell>
                            <Input
                              value={row.stage}
                              onChange={(e) => handlePaymentChange(idx, 'stage', e.target.value)}
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
                            <Input
                              value={row.amount}
                              onChange={(e) => handlePaymentChange(idx, 'amount', e.target.value)}
                              className="h-8 text-xs text-right font-medium"
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
                </div>

                {/* Annexures */}
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                        <ScrollText className="h-4 w-4 text-primary" />
                        Annexures (Page 3)
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Specific terms for government charges, completion period, and additional work
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 h-7 text-xs"
                      onClick={handleAddAnnexure}
                    >
                      <Plus className="h-3 w-3" /> Add Annexure
                    </Button>
                  </div>

                  {(data.annexures || []).map((annexure, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-xs font-bold text-primary mt-2 w-7 shrink-0">
                        A{idx + 1}:
                      </span>
                      <Textarea
                        rows={2}
                        value={annexure}
                        onChange={(e) => handleAnnexureChange(idx, e.target.value)}
                        className="text-xs flex-1"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 mt-1"
                        onClick={() => handleRemoveAnnexure(idx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* TAB 4: DETAIL QUOTATION SCHEDULE */}
              <TabsContent value="detail" className="space-y-4">
                <div className="rounded-lg border bg-card p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                        Detail Schedule of Rates & Grand Total
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Synchronized with client quotation draft
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 h-8 text-xs"
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/agreements/${leadId}?refresh=true`)
                          const json = await res.json()
                          if (json.success && json.data) {
                            setData((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    items: json.data.items,
                                    grandTotal: json.data.grandTotal,
                                    interiorWorkTotal: json.data.grandTotal,
                                    agreementValue: json.data.grandTotal,
                                    inWordsText: json.data.inWordsText,
                                    quotationDraft: json.data.quotationDraft,
                                    quotationTotals: json.data.quotationTotals,
                                  }
                                : json.data,
                            )
                            toast.success('Quotation draft re-synced successfully')
                          }
                        } catch {
                          toast.error('Failed to sync quotation')
                        }
                      }}
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Re-sync from Quotation
                    </Button>
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

              {/* TAB 5: AGREEMENT CLAUSES */}
              <TabsContent value="clauses" className="space-y-4">
                <div className="rounded-lg border bg-card p-4 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-primary" />
                        Agreement Clauses (Segmented into 4 Sections)
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Edit, reorder, or add clauses within each designated agreement section
                      </p>
                    </div>
                  </div>

                  {(data.clauseGroups || []).map((group, groupIdx) => (
                    <div key={groupIdx} className="border rounded-lg p-3 bg-muted/20 space-y-3">
                      <div className="flex items-center justify-between border-b pb-2">
                        <h4 className="text-xs font-bold text-primary uppercase tracking-wide">
                          Section {groupIdx + 1}: {group.title}
                        </h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs gap-1 text-primary"
                          onClick={() => handleAddClause(groupIdx)}
                        >
                          <Plus className="h-3 w-3" /> Add Clause
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {group.clauses.map((clause, clauseIdx) => (
                          <div key={clauseIdx} className="flex items-start gap-2">
                            <span className="text-xs font-bold text-primary mt-2 w-8 shrink-0">
                              {groupIdx + 1}.{clauseIdx + 1}
                            </span>
                            <Textarea
                              rows={2}
                              value={clause}
                              onChange={(e) => handleClauseChange(groupIdx, clauseIdx, e.target.value)}
                              className="text-xs flex-1"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0 mt-1"
                              onClick={() => handleRemoveClause(groupIdx, clauseIdx)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* TAB 6: SIGNATURES & WITNESSES */}
              <TabsContent value="signatures" className="space-y-4">
                <div className="rounded-lg border bg-card p-4 space-y-4">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                    Witness Names (Final Signatures Page)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs font-medium">Witness 1</Label>
                      <Input
                        value={data.witnessNames?.[0] || ''}
                        onChange={(e) => handleWitnessChange(0, e.target.value)}
                        placeholder="1. __________________"
                        className="text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Witness 2</Label>
                      <Input
                        value={data.witnessNames?.[1] || ''}
                        onChange={(e) => handleWitnessChange(1, e.target.value)}
                        placeholder="2. __________________"
                        className="text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Witness 3</Label>
                      <Input
                        value={data.witnessNames?.[2] || ''}
                        onChange={(e) => handleWitnessChange(2, e.target.value)}
                        placeholder="3. __________________"
                        className="text-xs mt-1"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <Label className="text-xs font-medium">Consultant Declaration & Acknowledgment Statement</Label>
                    <p className="text-[11px] text-muted-foreground mb-1">
                      Official statement acknowledged and signed by the Consultant General Manager on the final page.
                    </p>
                    <Textarea
                      rows={5}
                      value={data.consultantDeclaration}
                      onChange={(e) => handleFieldChange('consultantDeclaration', e.target.value)}
                      className="text-xs mt-1"
                    />
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
