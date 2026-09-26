'use client'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Flame, Sun, Snowflake, AlertTriangle } from 'lucide-react'

export type FollowUpCategoryValue = 'LAYOUT_REVIEW' | 'BUDGET_NEGOTIATION' | 'SITE_VISIT' | 'CONTRACT_SIGNING' | 'GENERAL'
export type ClientSentimentValue = 'HOT' | 'WARM' | 'COLD' | 'AT_RISK'
export type ClientObjectionValue = 'BUDGET_TOO_HIGH' | 'COMPETITOR_COMPARISON' | 'DESIGN_REVISION_NEEDED' | 'SPACE_PLANNING_QUERY' | 'TIMELINE_DELAY' | 'OTHER'

export const FOLLOWUP_CATEGORIES: { value: FollowUpCategoryValue; label: string; icon: string }[] = [
  { value: 'GENERAL', label: '📞 General Follow-Up', icon: '📞' },
  { value: 'LAYOUT_REVIEW', label: '📐 3D & Layout Review', icon: '📐' },
  { value: 'BUDGET_NEGOTIATION', label: '💰 Quotation & Budget Negotiation', icon: '💰' },
  { value: 'SITE_VISIT', label: '🏗️ Material Selection / Site Visit', icon: '🏗️' },
  { value: 'CONTRACT_SIGNING', label: '🖊️ Contract Signing / Advance Booking', icon: '🖊️' },
]

export const CLIENT_SENTIMENTS: { value: ClientSentimentValue; label: string; badgeClass: string; icon: any }[] = [
  { value: 'HOT', label: '🔥 Hot (Ready to sign)', badgeClass: 'bg-red-500/10 text-red-600 border-red-200', icon: Flame },
  { value: 'WARM', label: '🟡 Warm (Evaluating options)', badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-200', icon: Sun },
  { value: 'COLD', label: '❄️ Cold (Needs nurturing)', badgeClass: 'bg-blue-500/10 text-blue-600 border-blue-200', icon: Snowflake },
  { value: 'AT_RISK', label: '⚠️ At Risk / Objection', badgeClass: 'bg-rose-500/10 text-rose-700 border-rose-300 font-semibold', icon: AlertTriangle },
]

export const CLIENT_OBJECTIONS: { value: ClientObjectionValue; label: string }[] = [
  { value: 'BUDGET_TOO_HIGH', label: '💵 Budget Too High' },
  { value: 'COMPETITOR_COMPARISON', label: '⚔️ Comparing Competitors' },
  { value: 'DESIGN_REVISION_NEEDED', label: '✏️ Design Revision Needed' },
  { value: 'SPACE_PLANNING_QUERY', label: '📐 Space Planning Query' },
  { value: 'TIMELINE_DELAY', label: '⏱️ Timeline / Move-in Delayed' },
  { value: 'OTHER', label: '❓ Other Issue / Query' },
]

type FollowUpIntelligenceFieldsProps = {
  category: FollowUpCategoryValue
  onCategoryChange: (value: FollowUpCategoryValue) => void
  sentiment?: ClientSentimentValue
  onSentimentChange: (value: ClientSentimentValue | undefined) => void
  objection?: ClientObjectionValue
  onObjectionChange: (value: ClientObjectionValue | undefined) => void
  objectionNote?: string
  onObjectionNoteChange?: (value: string) => void
  className?: string
}

export function FollowUpIntelligenceFields({
  category,
  onCategoryChange,
  sentiment,
  onSentimentChange,
  objection,
  onObjectionChange,
  objectionNote,
  onObjectionNoteChange,
  className = '',
}: FollowUpIntelligenceFieldsProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Follow-Up Category */}
      <div className="space-y-1">
        <Label className="text-xs font-medium">Follow-Up Type / Purpose</Label>
        <Select value={category} onValueChange={(val) => onCategoryChange(val as FollowUpCategoryValue)}>
          <SelectTrigger className="h-8 text-xs bg-background">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {FOLLOWUP_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value} className="text-xs">
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Client Intent / Sentiment Rating */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Client Intent / Deal Health</Label>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {CLIENT_SENTIMENTS.map((item) => {
            const isSelected = sentiment === item.value
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onSentimentChange(isSelected ? undefined : item.value)}
                className={`flex items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] font-medium transition-all ${
                  isSelected
                    ? `${item.badgeClass} ring-2 ring-primary ring-offset-1`
                    : 'bg-background hover:bg-accent text-muted-foreground border-input'
                }`}
              >
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Objection Tracker - shown if AT_RISK or explicitly selected */}
      {(sentiment === 'AT_RISK' || objection) && (
        <div className="space-y-2 rounded-md border border-rose-200 bg-rose-50/50 p-2.5 dark:bg-rose-950/20 dark:border-rose-800">
          <Label className="text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            Client Objection / Delay Reason
          </Label>
          <Select value={objection || ''} onValueChange={(val) => onObjectionChange((val as ClientObjectionValue) || undefined)}>
            <SelectTrigger className="h-8 text-xs bg-background">
              <SelectValue placeholder="Select primary objection" />
            </SelectTrigger>
            <SelectContent>
              {CLIENT_OBJECTIONS.map((obj) => (
                <SelectItem key={obj.value} value={obj.value} className="text-xs">
                  {obj.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {onObjectionNoteChange && (
            <Input
              placeholder="Specific details regarding client objection..."
              value={objectionNote || ''}
              onChange={(e) => onObjectionNoteChange(e.target.value)}
              className="h-8 text-xs bg-background"
            />
          )}
        </div>
      )}
    </div>
  )
}
