export type QuotationDraftLike = {
  draftKey: string
  projectSqft?: number | null
  content?: unknown
}

export type LeadQuotationSqftSummary = {
  avgDetailSqft: number
  avgShortSqft: number
  detailVersionsCount: number
  shortPackagesCount: number
  totalAvgSqft: number
}

/**
 * Extracts the SQFT value directly created in a quotation draft:
 * 1. Sum of quantitySqft from short quotation rooms (non lump-sum items)
 * 2. Sum of quantity from detail lineItems with unit sqft/sft (included items)
 * 3. Explicit projectSqft if stored and content is not present
 * 4. Returns 0 if nothing created in the software
 */
export function extractDraftSqft(draft: QuotationDraftLike, _fallbackSqft = 0): number {
  if (!draft) return 0

  if (draft.content) {
    let c = draft.content as Record<string, unknown>
    if (typeof c === 'string') {
      try {
        c = JSON.parse(c)
      } catch {
        c = {}
      }
    }

    if (typeof c === 'object' && c !== null) {
      // 1. Short quotation: rooms[].lines[].quantitySqft
      if (Array.isArray(c.rooms) && c.rooms.length > 0) {
        let shortSqft = 0
        for (const room of c.rooms as any[]) {
          if (room && Array.isArray(room.lines)) {
            for (const line of room.lines as any[]) {
              if (!line?.isLumpSum) {
                shortSqft += Number(line?.quantitySqft) || 0
              }
            }
          }
        }
        return Math.round(shortSqft * 100) / 100
      }

      // 2. Detail quotation: lineItems with unit sqft/sft (included items)
      if (Array.isArray(c.lineItems) && c.lineItems.length > 0) {
        let detailSqft = 0
        for (const item of c.lineItems as any[]) {
          if (item && item.included !== false) {
            const unit = String(item.unit || '').trim().toLowerCase()
            if (unit === 'sqft' || unit === 'sft') {
              detailSqft += Number(item.quantity) || 0
            }
          }
        }
        return Math.round(detailSqft * 100) / 100
      }
    }
  }

  // If draft has explicit positive projectSqft and no content with items was found
  if (draft.projectSqft && Number(draft.projectSqft) > 0) {
    return Number(draft.projectSqft)
  }

  return 0
}

/**
 * Identifies a detail draft key (handles :owner: suffix).
 * Matches: 'detail', 'detail:slot:2', 'detail:owner:xxx', 'detail:slot:2:owner:xxx'
 */
function isDetailDraftKey(key: string): boolean {
  return key === 'detail' || key.startsWith('detail:')
}

/**
 * Identifies a short draft key (handles :owner: suffix).
 * Matches: 'short:premium', 'short:premium:owner:xxx', etc.
 */
function isShortDraftKey(key: string): boolean {
  return key.startsWith('short:')
}

export function calculateLeadQuotationSqftSummary(
  drafts: QuotationDraftLike[],
  _fallbackSqft = 0,
): LeadQuotationSqftSummary {
  const detailDrafts = drafts.filter((d) => isDetailDraftKey(d.draftKey))
  const shortDrafts = drafts.filter((d) => isShortDraftKey(d.draftKey))

  // Detail drafts: calculate created sqft for each draft
  const detailSqfts = detailDrafts
    .map((draft) => extractDraftSqft(draft))
    .filter((sqft) => sqft > 0)

  const avgDetailSqft =
    detailSqfts.length > 0
      ? Math.round(detailSqfts.reduce((sum, s) => sum + s, 0) / detailSqfts.length)
      : 0

  // Short drafts: calculate created sqft for each draft
  const shortSqfts = shortDrafts
    .map((draft) => extractDraftSqft(draft))
    .filter((sqft) => sqft > 0)

  const avgShortSqft =
    shortSqfts.length > 0
      ? Math.round(shortSqfts.reduce((sum, s) => sum + s, 0) / shortSqfts.length)
      : 0

  return {
    avgDetailSqft,
    avgShortSqft,
    detailVersionsCount: detailSqfts.length,
    shortPackagesCount: shortSqfts.length,
    totalAvgSqft: avgDetailSqft + avgShortSqft,
  }
}
