'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, ExternalLink, FileDown } from 'lucide-react'
import { CrmPageHeader } from '@/components/crm/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QuotationWorkspace } from '@/components/crm/quotation/quotation-workspace'
import { buildDetailPreviewUrl } from '@/lib/detail-quotation-preview-sync'

type LeadDetail = {
  id: string
  name: string
  stage: string
  subStatus: string | null
  location: string | null
  phone: string | null
}

export default function AdminQuotationLeadWorkspacePage() {
  const params = useParams<{ id: string }>()
  const leadId = params?.id
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lead, setLead] = useState<LeadDetail | null>(null)

  useEffect(() => {
    const loadLead = async () => {
      if (!leadId) return
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/lead/${leadId}`, { cache: 'no-store' })
        const payload = await response.json()
        if (!response.ok || !payload?.success || !payload?.data) {
          throw new Error(payload?.error ?? 'Failed to load lead')
        }
        setLead(payload.data as LeadDetail)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load lead')
        setLead(null)
      } finally {
        setLoading(false)
      }
    }

    void loadLead()
  }, [leadId])

  return (
    <div className="min-h-screen bg-background">
      <CrmPageHeader
        title={lead ? `${lead.name} — Quotation Studio (Admin)` : 'Quotation Studio (Admin)'}
        subtitle="Full administrative control to build, customize, and finalize short and detailed quotations."
      />

      <main className="mx-auto max-w-[1440px] px-6 py-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/crm/admin/leads">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Leads</span>
            </Button>
          </Link>
          {lead ? (
            <Link href={`/crm/admin/leads/${lead.id}`}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open Lead Profile</span>
              </Button>
            </Link>
          ) : null}
        </div>
        {loading ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Loading quotation workspace...
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : lead ? (
          <>
            <Card className="border-sky-200 bg-sky-50/40 dark:border-sky-900/50 dark:bg-sky-950/20">
              <CardContent className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Detail Quotation Live Document</p>
                  <p className="text-xs text-muted-foreground">
                    Open client-facing preview to review formatted typography and export official PDF.
                  </p>
                </div>
                <Link
                  href={buildDetailPreviewUrl({ context: 'lead', contextId: lead.id })}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-md border bg-white px-3.5 py-1.5 text-xs font-semibold shadow-sm hover:bg-muted dark:bg-slate-900"
                >
                  <FileDown className="h-3.5 w-3.5 text-primary" />
                  <span>Download Detail PDF</span>
                </Link>
              </CardContent>
            </Card>

            <QuotationWorkspace
              leadId={lead.id}
              leadName={lead.name}
              leadLocation={lead.location}
              leadSubStatus={lead.subStatus}
            />
          </>
        ) : null}
      </main>
    </div>
  )
}
