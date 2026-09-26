'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { CrmPageHeader } from '@/components/crm/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
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

export default function SrQuotationLeadWorkspacePage() {
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
        title={lead ? `${lead.name} - Quotation Studio (Senior CRM)` : 'Quotation Studio (Senior CRM)'}
        subtitle="Manage short and detailed quotation pricing directly within your Senior CRM lead workspace."
      />

      <main className="mx-auto max-w-[1440px] px-6 py-6 space-y-4">
        {loading ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">Loading lead details...</CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-8 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : lead ? (
          <>
            <Card>
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">Detail Quotation PDF</p>
                  <p className="text-xs text-muted-foreground">Open the PDF preview, then click Download PDF to save this lead's detail quotation.</p>
                </div>
                <Link
                  href={buildDetailPreviewUrl({ context: 'lead', contextId: lead.id })}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-fit items-center justify-center rounded-md border bg-white px-4 py-2 text-sm font-medium hover:bg-muted dark:bg-slate-900"
                >
                  Download Detail PDF
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
