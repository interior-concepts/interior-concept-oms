'use client'

import { Badge } from '@/components/ui/badge'
import { Flame, Sun, Snowflake, AlertTriangle, Clock } from 'lucide-react'
import type { ClientSentimentValue, ClientObjectionValue } from './followup-intelligence-fields'

export function isLeadStale(lastContactedAt?: string | Date | null, createdAt?: string | Date | null, thresholdDays = 3): boolean {
  const lastDate = lastContactedAt ? new Date(lastContactedAt) : createdAt ? new Date(createdAt) : null
  if (!lastDate || Number.isNaN(lastDate.getTime())) return false
  const diffTime = Math.abs(Date.now() - lastDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays >= thresholdDays
}

type LeadHealthBadgeProps = {
  sentiment?: ClientSentimentValue | string | null
  objection?: ClientObjectionValue | string | null
  lastContactedAt?: string | Date | null
  createdAt?: string | Date | null
  showStaleBadge?: boolean
  className?: string
}

export function LeadHealthBadge({
  sentiment,
  objection,
  lastContactedAt,
  createdAt,
  showStaleBadge = true,
  className = '',
}: LeadHealthBadgeProps) {
  const stale = showStaleBadge && isLeadStale(lastContactedAt, createdAt, 3)

  return (
    <div className={`inline-flex flex-wrap items-center gap-1 ${className}`}>
      {sentiment === 'HOT' && (
        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200 text-[10px] py-0 px-1.5 font-medium gap-1">
          <Flame className="h-3 w-3" /> Hot Deal
        </Badge>
      )}
      {sentiment === 'WARM' && (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200 text-[10px] py-0 px-1.5 font-medium gap-1">
          <Sun className="h-3 w-3" /> Warm
        </Badge>
      )}
      {sentiment === 'COLD' && (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200 text-[10px] py-0 px-1.5 font-medium gap-1">
          <Snowflake className="h-3 w-3" /> Cold Nurture
        </Badge>
      )}
      {sentiment === 'AT_RISK' && (
        <Badge variant="outline" className="bg-rose-500/10 text-rose-700 border-rose-300 text-[10px] py-0 px-1.5 font-semibold gap-1">
          <AlertTriangle className="h-3 w-3" /> At Risk
        </Badge>
      )}

      {objection && (
        <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 text-[10px] py-0 px-1.5">
          {objection === 'BUDGET_TOO_HIGH' && 'Budget Issue'}
          {objection === 'COMPETITOR_COMPARISON' && 'Competitor'}
          {objection === 'DESIGN_REVISION_NEEDED' && 'Revision Needed'}
          {objection === 'SPACE_PLANNING_QUERY' && 'Layout Query'}
          {objection === 'TIMELINE_DELAY' && 'Timeline Delay'}
          {objection === 'OTHER' && 'Objection Raised'}
        </Badge>
      )}

      {stale && (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-300 text-[10px] py-0 px-1.5 font-medium gap-1 animate-pulse">
          <Clock className="h-3 w-3" /> Cold Lead Risk (3d+)
        </Badge>
      )}
    </div>
  )
}
