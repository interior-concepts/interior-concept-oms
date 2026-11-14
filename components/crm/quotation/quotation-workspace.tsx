'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, CheckCircle2, Sparkles, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QuotationMaker } from '@/components/crm/quotation/quotation-maker'
import { ShortQuotationBuilder } from '@/components/crm/quotation/short-quotation-builder'
import { FurnitureQuotationBuilder } from '@/components/crm/quotation/furniture-quotation-builder'
import { InstantQuotationSubmitModal } from '@/components/crm/quotation/instant-quotation-submit-modal'

type QuotationWorkspaceProps = {
  leadId: string
  leadName: string
  leadLocation: string | null
  leadSubStatus: string | null
  isInstantQuotation?: boolean
  leadBudget?: number | null
  onApproved?: () => void
}

export function QuotationWorkspace({
  leadId,
  leadName,
  leadLocation,
  leadSubStatus,
  isInstantQuotation = false,
  leadBudget,
  onApproved,
}: QuotationWorkspaceProps) {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState<'short' | 'detail' | 'furniture'>('short')
  const [currentSubStatus, setCurrentSubStatus] = useState<string | null>(leadSubStatus)
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [sqftSummary, setSqftSummary] = useState<{
    avgDetailSqft: number
    avgShortSqft: number
    detailVersionsCount: number
    shortPackagesCount: number
  } | null>(null)

  useEffect(() => {
    setCurrentSubStatus(leadSubStatus)
  }, [leadSubStatus])

  const loadDraftMeta = useCallback(async (options?: { updateActiveTab?: boolean }) => {
    try {
      const response = await fetch(`/api/lead/${leadId}/quotation-draft`, { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok || !payload?.success || !payload?.data) return
      if (payload.data.sqftSummary) {
        setSqftSummary(payload.data.sqftSummary)
      }
      if (options?.updateActiveTab === false) return
      const documentType = payload.data.documentType as 'short' | 'detail' | undefined
      if (payload.data.draft && documentType === 'detail') {
        setActiveTab('detail')
      } else {
        setActiveTab('short')
      }
    } catch {
      if (options?.updateActiveTab !== false) {
        setActiveTab('short')
      }
    }
  }, [leadId])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDraftMeta()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadDraftMeta])

  const isApproved = currentSubStatus === 'QUOTATION_APPROVED'
  const budgetQueueUrl = pathname.includes('/crm/sr')
    ? '/crm/sr/budget-queue'
    : '/crm/admin/budget-queue'

  const activeSqft =
    activeTab === 'detail'
      ? sqftSummary?.avgDetailSqft ?? 0
      : sqftSummary?.avgShortSqft ?? 0

  return (
    <div className="space-y-4">
      {/* Workflow Action Banner */}
      {isApproved ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50/80 p-4 shadow-sm dark:border-emerald-800/70 dark:bg-emerald-950/30">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                  Quotation Approved
                </p>
                <span className="rounded bg-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200">
                  Ready for Agreement
                </span>
              </div>
              <p className="text-xs text-emerald-800/90 dark:text-emerald-300/80">
                This lead is actively in the Budget Queue. You can confirm the Agreement directly.
              </p>
            </div>
          </div>
          <Link href={budgetQueueUrl}>
            <Button
              size="sm"
              className="gap-1.5 bg-emerald-600 font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              <span>Go to Budget Queue</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-sky-300 bg-gradient-to-r from-sky-50 via-indigo-50/40 to-emerald-50/60 p-4 shadow-sm dark:border-sky-800/70 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-sky-100 p-2.5 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-800">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-foreground">
                  Instant Quotation Submission
                </p>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Direct Approval
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Submit this quotation directly to Quotation Approved in the Budget Queue for instant Agreement generation.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setSubmitModalOpen(true)}
            className="gap-2 bg-emerald-600 font-semibold text-white shadow hover:bg-emerald-700 shrink-0"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Submit & Approve Quotation</span>
          </Button>
        </div>
      )}

      {/* SQFT Overview Cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-sky-100/60 p-4 shadow-sm dark:border-cyan-800/60 dark:from-cyan-950/40 dark:via-slate-950 dark:to-sky-950/20">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-900 dark:text-cyan-300">
                Short Quotation SQFT
              </p>
              <p className="mt-1 text-2xl font-black text-cyan-950 dark:text-cyan-100">
                {sqftSummary ? sqftSummary.avgShortSqft.toLocaleString() : 0}{' '}
                <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-400">sqft</span>
              </p>
              <p className="mt-0.5 text-[11px] text-cyan-700/80 dark:text-cyan-400/80">
                {sqftSummary && sqftSummary.avgShortSqft > 0
                  ? 'Calculated from short quotation items'
                  : '0 sqft created in software'}
              </p>
            </div>
            <div className="rounded-xl bg-cyan-100/80 p-2.5 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-200 dark:ring-cyan-800">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 via-white to-indigo-100/60 p-4 shadow-sm dark:border-purple-800/60 dark:from-purple-950/40 dark:via-slate-950 dark:to-indigo-950/20">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300">
                Detail Quotation SQFT
              </p>
              <p className="mt-1 text-2xl font-black text-purple-950 dark:text-purple-100">
                {sqftSummary ? sqftSummary.avgDetailSqft.toLocaleString() : 0}{' '}
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">sqft</span>
              </p>
              <p className="mt-0.5 text-[11px] text-purple-700/80 dark:text-purple-400/80">
                {sqftSummary && sqftSummary.avgDetailSqft > 0
                  ? 'Calculated from detail quotation items'
                  : '0 sqft created in software'}
              </p>
            </div>
            <div className="rounded-xl bg-purple-100/80 p-2.5 text-purple-700 ring-1 ring-purple-200 dark:bg-purple-900/40 dark:text-purple-200 dark:ring-purple-800">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value as 'short' | 'detail' | 'furniture')
        }}
      >
        <TabsList className="h-auto flex-wrap print:hidden">
          <TabsTrigger value="short">Short Quotation</TabsTrigger>
          <TabsTrigger value="detail">Detail Quotation</TabsTrigger>
          <TabsTrigger value="furniture">Furniture Quotation</TabsTrigger>
        </TabsList>
        <TabsContent value="short" className="mt-4">
          {activeTab === 'short' ? (
            <ShortQuotationBuilder
              leadId={leadId}
              leadName={leadName}
              leadLocation={leadLocation}
              leadSubStatus={currentSubStatus}
              onDraftSaved={() => void loadDraftMeta({ updateActiveTab: false })}
            />
          ) : null}
        </TabsContent>
        <TabsContent value="detail" className="mt-4">
          {activeTab === 'detail' ? (
            <QuotationMaker
              leadId={leadId}
              leadName={leadName}
              leadLocation={leadLocation}
              leadSubStatus={currentSubStatus}
              onDraftSaved={() => void loadDraftMeta({ updateActiveTab: false })}
            />
          ) : null}
        </TabsContent>
        <TabsContent value="furniture" className="mt-4">
          {activeTab === 'furniture' ? (
            <FurnitureQuotationBuilder
              leadId={leadId}
              leadName={leadName}
              leadLocation={leadLocation}
              onDraftSaved={() => void loadDraftMeta({ updateActiveTab: false })}
            />
          ) : null}
        </TabsContent>
      </Tabs>

      {/* Instant Quotation Submit Modal */}
      <InstantQuotationSubmitModal
        open={submitModalOpen}
        onOpenChange={setSubmitModalOpen}
        leadId={leadId}
        leadName={leadName}
        leadLocation={leadLocation}
        leadBudget={leadBudget}
        activeTab={activeTab}
        approxSqft={activeSqft}
        isInstantQuotation={isInstantQuotation}
        onApproved={() => {
          setCurrentSubStatus('QUOTATION_APPROVED')
          if (onApproved) {
            onApproved()
          }
        }}
      />
    </div>
  )
}
