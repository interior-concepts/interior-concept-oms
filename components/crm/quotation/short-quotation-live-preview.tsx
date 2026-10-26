'use client'

import { useEffect, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ShortQuotationPrint } from '@/components/crm/quotation/short-quotation-print'
import { ShortQuotationDocument } from '@/components/crm/quotation/pdf/ShortQuotationDocument'
import { downloadPdfFromDocument } from '@/components/crm/quotation/pdf/pdf-download'
import { normalizeShortQuotationContent } from '@/lib/short-quotation-calculations'
import { loadPlaygroundShortDraft } from '@/lib/quotation-playground-storage'
import type { ShortQuotationContent } from '@/lib/short-quotation-types'
import { toast } from '@/components/ui/sonner'
import {
  readShortPreview,
  subscribeShortPreview,
  type ShortPreviewContext,
  type ShortPreviewPayload,
} from '@/lib/short-quotation-preview-sync'


function generateShortQuotationCode(packageTier: string) {
  const now = new Date()
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('')
  const timePart = [
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('')
  const randomPart = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `SQ-${packageTier.slice(0, 3)}-${datePart}-${timePart}-${randomPart}`
}

export function ShortQuotationLivePreview({
  context,
  contextId,
  packageTier,
}: {
  context: ShortPreviewContext
  contextId: string
  packageTier?: string
}) {
  const [payload, setPayload] = useState<ShortPreviewPayload | null>(null)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [loading, setLoading] = useState(true)

  const cleanPackage = (
    packageTier && ['PLATINUM', 'PREMIUM', 'LUXURY'].includes(packageTier.toUpperCase())
      ? packageTier.toUpperCase()
      : 'PREMIUM'
  ) as 'PLATINUM' | 'PREMIUM' | 'LUXURY'

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      // 1. Try localStorage preview cache
      const cached = readShortPreview(context, contextId)
      if (cached) {
        if (isMounted) {
          setPayload(cached)
          setLoading(false)
        }
        return
      }

      // 2. Fallback: fetch saved draft directly from DB API
      if (context === 'lead') {
        try {
          const response = await fetch(
            `/api/lead/${contextId}/quotation-draft?documentType=short&packageTier=${cleanPackage}`,
            { cache: 'no-store' },
          )
          const result = await response.json()
          if (response.ok && result?.success && result?.data) {
            const source = result.data.draft ?? result.data.defaultDraft
            if (source?.content && isMounted) {
              setPayload({
                updatedAt: new Date().toISOString(),
                context,
                contextId,
                content: source.content as ShortQuotationContent,
              })
            }
          }
        } catch {
          // ignore error, will display fallback or empty state
        }
      } else if (context === 'playground') {
        const stored = loadPlaygroundShortDraft(cleanPackage)
        if (stored && isMounted) {
          setPayload({
            updatedAt: new Date().toISOString(),
            context,
            contextId,
            content: stored,
          })
        }
      }

      if (isMounted) setLoading(false)
    }

    void load()
    const unsubscribe = subscribeShortPreview(context, contextId, () => void load())
    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [context, contextId, cleanPackage])

  const targetPackage = (
    cleanPackage || payload?.content?.packageTier || 'PREMIUM'
  ) as 'PLATINUM' | 'PREMIUM' | 'LUXURY'

  const activeContent = payload
    ? normalizeShortQuotationContent({
        ...payload.content,
        packageTier: targetPackage,
      })
    : null

  const handleDownloadPdf = async () => {
    if (!activeContent) return
    setGeneratingPdf(true)
    try {
      const downloadedAt = new Date().toISOString()
      const contentForDownload = normalizeShortQuotationContent({
        ...activeContent,
        quotationCode: generateShortQuotationCode(activeContent.packageTier),
        downloadedAt,
      })
      const safeClientName = (contentForDownload.clientName || 'Quotation').replace(/[^a-z0-9]/gi, '_').toLowerCase()
      await downloadPdfFromDocument(
        <ShortQuotationDocument content={contentForDownload} />,
        `Short_Quotation_${safeClientName}_${contentForDownload.packageTier}_${contentForDownload.quotationCode}.pdf`,
      )
      toast.success(`PDF downloaded for ${contentForDownload.packageTier} package with code ${contentForDownload.quotationCode}`)
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate PDF')
    } finally {
      setGeneratingPdf(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 p-6">
        <Card className="max-w-md">
          <CardContent className="flex items-center justify-center gap-2.5 p-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Loading quotation live preview...
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!activeContent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 p-6">
        <Card className="max-w-md">
          <CardContent className="space-y-3 p-6 text-center text-sm text-muted-foreground">
            <p>No short quotation preview is available yet.</p>
            <p>Open Live Preview from the short quotation editor to start the separate preview page.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-100 py-6 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-[794px] items-center justify-between rounded-xl border bg-white px-4 py-3 shadow-sm print:hidden">
        <div>
          <p className="text-sm font-semibold">
            Short quotation live preview — <span className="text-primary font-bold">{activeContent.packageTier} Package</span>
          </p>
          <p className="text-xs text-muted-foreground">Updates automatically while you edit.</p>
        </div>
        <Button type="button" disabled={generatingPdf} onClick={() => void handleDownloadPdf()}>
          {generatingPdf ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download {activeContent.packageTier} Short PDF
            </>
          )}
        </Button>
      </div>

      <ShortQuotationPrint content={activeContent} />
    </div>
  )
}
