'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CrmPageHeader } from '@/components/crm/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileCheck2,
  Download,
  Search,
  Loader2,
  Calendar,
  Building2,
  User,
  Sparkles,
  Phone,
  MapPin,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import { AgreementDocument, type AgreementPdfProps } from './AgreementDocument'
import { downloadPdfFromDocument } from '@/components/crm/quotation/pdf/pdf-download'
import { buildDetailPreviewUrl } from '@/lib/detail-quotation-preview-sync'

type AgreementLead = {
  id: string
  clientId: number
  name: string
  phone: string | null
  location: string | null
  stage: string
  subStatus: string | null
  agreementType: string | null
  agreementValue: number | null
  budget: number | null
  projectSqft: number | null
  visitDate: string | null
  hasQuotationDraft?: boolean
  quotationFiles?: Array<{ id: string; fileName: string; url: string }>
  updatedAt: string
  createdAt: string
  srCrm: { id: string; fullName: string; email: string } | null
  visualizer: { id: string; fullName: string; email: string } | null
  quotation: { id: string; fullName: string; email: string } | null
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 'N/A'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatLabel(val: string | null | undefined): string {
  if (!val) return 'N/A'
  return val.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

export function AgreementCenterView({
  title = 'Agreement Center',
  subtitle = 'Manage confirmed client agreements, review project scopes, and download agreement papers.',
  leadBasePath = '/crm/sr/leads',
}: {
  title?: string
  subtitle?: string
  leadBasePath?: string
}) {
  const [leads, setLeads] = useState<AgreementLead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (typeFilter !== 'ALL') params.set('agreementType', typeFilter)

      const res = await fetch(`/api/agreements?${params.toString()}`)
      const payload = await res.json()
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to fetch agreement leads')
      }
      setLeads(payload.data || [])
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to fetch agreements')
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter])

  useEffect(() => {
    void fetchLeads()
  }, [fetchLeads])

  const stats = useMemo(() => {
    const total = leads.length
    const design = leads.filter((l) => l.agreementType?.includes('DESIGN')).length
    const fitout = leads.filter((l) => l.agreementType?.includes('FITOUT')).length
    const totalValue = leads.reduce((acc, l) => acc + (l.agreementValue || 0), 0)
    return { total, design, fitout, totalValue }
  }, [leads])

  const handleDownloadAgreement = async (lead: AgreementLead) => {
    setDownloadingId(lead.id)
    try {
      const pdfProps: AgreementPdfProps = {
        clientName: lead.name,
        clientPhone: lead.phone,
        clientLocation: lead.location,
        agreementType: lead.agreementType || 'DESIGN_AGREEMENT',
        agreementValue: lead.agreementValue,
        projectSqft: lead.projectSqft,
        dateStr: formatDate(lead.updatedAt),
        srCrmName: lead.srCrm?.fullName,
        visualizerName: lead.visualizer?.fullName,
        agreementCode: `AGR-${lead.clientId || lead.id.slice(0, 6).toUpperCase()}`,
      }

      const safeName = lead.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
      const typeStr = lead.agreementType?.includes('FITOUT') ? 'Fitout' : 'Design'
      const fileName = `Agreement_${safeName}_${typeStr}.pdf`

      await downloadPdfFromDocument(<AgreementDocument {...pdfProps} />, fileName)
      toast.success(`Agreement paper downloaded for ${lead.name}`)
    } catch (err) {
      console.error('Download error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to generate agreement paper')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <CrmPageHeader title={title} subtitle={subtitle} />

      <main className="mx-auto max-w-[1440px] px-4 py-6">
        {/* KPI Intelligence Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/70 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30 p-4 shadow-sm dark:from-blue-950/20 dark:via-slate-900 dark:to-indigo-950/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Agreements</p>
                <p className="mt-2 text-2xl font-black text-foreground">{stats.total}</p>
              </div>
              <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                <FileCheck2 className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="border-border/70 bg-gradient-to-br from-purple-50/50 via-white to-pink-50/30 p-4 shadow-sm dark:from-purple-950/20 dark:via-slate-900 dark:to-pink-950/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Design Agreements</p>
                <p className="mt-2 text-2xl font-black text-purple-700 dark:text-purple-300">{stats.design}</p>
              </div>
              <div className="rounded-xl bg-purple-100 p-2.5 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300">
                <Sparkles className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="border-border/70 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 p-4 shadow-sm dark:from-emerald-950/20 dark:via-slate-900 dark:to-teal-950/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fitout Agreements</p>
                <p className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-300">{stats.fitout}</p>
              </div>
              <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
                <Building2 className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="border-border/70 bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30 p-4 shadow-sm dark:from-amber-950/20 dark:via-slate-900 dark:to-orange-950/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Agreed Value</p>
                <p className="mt-2 text-2xl font-black text-amber-700 dark:text-amber-300">
                  {stats.totalValue > 0 ? `${(stats.totalValue / 100000).toFixed(2)}L ৳` : '0 ৳'}
                </p>
              </div>
              <div className="rounded-xl bg-amber-100 p-2.5 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filter Bar */}
        <Card className="mb-6 border-border/70">
          <CardContent className="flex flex-wrap items-center gap-4 p-4">
            <div className="relative min-w-[260px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by client name, phone, or location..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="w-full sm:w-56">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Agreement Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Agreement Types</SelectItem>
                  <SelectItem value="DESIGN_AGREEMENT">Design Agreement</SelectItem>
                  <SelectItem value="FITOUT_AGREEMENT">Fitout Agreement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={() => void fetchLeads()} disabled={loading}>
              Refresh
            </Button>
          </CardContent>
        </Card>

        {/* Agreements Table */}
        <Card className="border-border/70">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : leads.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                No agreements found. When a lead completes agreement from Meeting Queue or Budget Queue, it will appear here.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[18%]">Client / Lead</TableHead>
                    <TableHead className="w-[14%]">Agreement Type</TableHead>
                    <TableHead className="w-[14%]">Agreed Value</TableHead>
                    <TableHead className="w-[14%]">Assigned 3D Visualizer</TableHead>
                    <TableHead className="w-[14%]">SR CRM Owner</TableHead>
                    <TableHead className="w-[12%]">Current Stage</TableHead>
                    <TableHead className="w-[14%] text-right">Agreement Paper</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => {
                    const isDesign = lead.agreementType?.includes('DESIGN')
                    const isDownloading = downloadingId === lead.id

                    return (
                      <TableRow key={lead.id} className="hover:bg-muted/40 transition">
                        <TableCell>
                          <div className="space-y-1">
                            <Link
                              href={`${leadBasePath}/${lead.id}`}
                              className="font-semibold text-foreground hover:text-primary hover:underline"
                            >
                              {lead.name}
                            </Link>
                            {lead.phone && (
                              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {lead.phone}
                              </p>
                            )}
                            {lead.location && (
                              <p className="flex items-center gap-1 text-xs text-muted-foreground truncate max-w-[200px]" title={lead.location}>
                                <MapPin className="h-3 w-3 shrink-0" />
                                {lead.location}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              isDesign
                                ? 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                            }
                          >
                            {isDesign ? 'Design Agreement' : 'Fitout Agreement'}
                          </Badge>
                          {lead.projectSqft && (
                            <p className="mt-1 text-xs text-muted-foreground">{lead.projectSqft} sqft</p>
                          )}
                        </TableCell>

                        <TableCell>
                          <span className="font-bold text-foreground">
                            {lead.agreementValue ? `${lead.agreementValue.toLocaleString()} ৳` : 'N/A'}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium text-foreground">
                              {lead.visualizer?.fullName || (
                                <span className="text-xs italic text-muted-foreground">Unassigned</span>
                              )}
                            </p>
                            {lead.visualizer?.email && (
                              <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {lead.visualizer.email}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <p className="text-sm font-medium text-foreground">
                            {lead.srCrm?.fullName || 'Unassigned'}
                          </p>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant="outline" className="text-xs">
                              {formatLabel(lead.stage)}
                            </Badge>
                            {lead.subStatus && (
                              <p className="text-[11px] text-muted-foreground">{formatLabel(lead.subStatus)}</p>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Final Quotation Download */}
                            <a
                              href={buildDetailPreviewUrl({ context: 'lead', contextId: lead.id })}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-9 items-center justify-center rounded-md border border-amber-300 bg-amber-50 px-3 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
                              title="Download Final Detail Quotation PDF"
                            >
                              <FileText className="mr-1.5 h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                              Quotation PDF
                            </a>

                            {/* Agreement Paper Download */}
                            <Button
                              size="sm"
                              className="gap-1.5 shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
                              disabled={isDownloading}
                              onClick={() => void handleDownloadAgreement(lead)}
                            >
                              {isDownloading ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  <span>Generating...</span>
                                </>
                              ) : (
                                <>
                                  <Download className="h-3.5 w-3.5" />
                                  <span>Agreement Paper</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
