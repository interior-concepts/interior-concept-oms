'use client'

import { Document, Font, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { AgreementData, AgreementClauseGroup } from '@/lib/agreement-types'
import type { QuotationDraftContent, QuotationTotals } from '@/lib/quotation-types'
import {
  buildDetailFloorSummaries,
  formatDetailAmount,
  formatDetailQtyCell,
  formatDetailUnitPriceCell,
  formatDetailTotalCell,
  isPackageLine,
  isRateOnlyLine,
} from '@/lib/detail-quotation-format'
import { amountInWordsTaka } from '@/lib/number-to-words'

// ─── Deed-Paper Color Palette ────────────────────────────────────────────────
const PRIMARY       = '#111111'   // Classic Black
const ACCENT        = '#8a6d2b'   // Warm Antique Gold
const GOLD          = '#c5a059'   // Deed Gold Accent
const BORDER        = '#d1c7b7'   // Subtle parchment border line
const BG_LIGHT      = '#f7faf9'   // Light background 1
const BG_ALT        = '#fffdfa'   // Light background 2
const TEXT_DARK     = '#111111'   // Black text
const TEXT_MUTED    = '#4b5563'   // Muted slate text
const PAGE_BG       = '#ffffff'   // Clean page background
const PAGE_PADDING  = 30
const BDT_SYMBOL    = '৳'
const DETAIL_ROW_LINE_HEIGHT    = 1.25
const DETAIL_ROW_VERTICAL_PADDING = 3.5

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return window.location.origin
  return 'https://interiorconcepts.com'
}

Font.register({
  family: 'Noto Sans Bengali',
  fonts: [
    { src: `${getBaseUrl()}/fonts/NotoSansBengali-Regular.ttf` },
    { src: `${getBaseUrl()}/fonts/NotoSansBengali-Regular.ttf`, fontStyle: 'italic' },
    { src: `${getBaseUrl()}/fonts/NotoSansBengali-Bold.ttf`, fontWeight: 'bold' },
    { src: `${getBaseUrl()}/fonts/NotoSansBengali-Bold.ttf`, fontWeight: 'bold', fontStyle: 'italic' },
  ],
})

Font.register({
  family: 'Playfair Display',
  fonts: [
    { src: `${getBaseUrl()}/fonts/PlayfairDisplay-Regular.ttf` },
    { src: `${getBaseUrl()}/fonts/PlayfairDisplay-Bold.ttf`, fontWeight: 'bold' },
  ],
})

Font.register({
  family: 'Roboto Mono',
  fonts: [
    { src: `${getBaseUrl()}/fonts/RobotoMono-Regular.ttf` },
    { src: `${getBaseUrl()}/fonts/RobotoMono-Medium.ttf`, fontWeight: 500 },
  ],
})

Font.registerHyphenationCallback((word) => [word])

const logoSrc = `${getBaseUrl()}/Logo/interior-concept-logobg-removed.png`
const watermarkSrc = `${getBaseUrl()}/Logo/interior-concept-icon-light.png`

const styles = StyleSheet.create({
  page: {
    paddingTop: 76,
    paddingBottom: 72,
    paddingHorizontal: PAGE_PADDING,
    fontFamily: 'Noto Sans Bengali',
    fontSize: 9.5,
    color: TEXT_DARK,
    backgroundColor: PAGE_BG,
    lineHeight: 1.55,
  },
  detailPage: {
    paddingTop: 76,
    paddingBottom: 72,
    paddingLeft: 16,
    paddingRight: 16,
    fontFamily: 'Noto Sans Bengali',
    fontSize: 9,
    color: '#000000',
    backgroundColor: PAGE_BG,
    lineHeight: 1.4,
  },
  deedFrame: {
    position: 'absolute',
    top: 10,
    bottom: 10,
    left: 10,
    right: 10,
    borderWidth: 1.5,
    borderColor: GOLD,
    pointerEvents: 'none',
  },
  deedFrameInner: {
    position: 'absolute',
    top: 13,
    bottom: 13,
    left: 13,
    right: 13,
    borderWidth: 0.5,
    borderColor: BORDER,
    pointerEvents: 'none',
  },
  watermark: {
    position: 'absolute',
    top: 220,
    left: 98,
    width: 400,
    height: 400,
    zIndex: -1,
    opacity: 0.04,
  },
  header: {
    position: 'absolute',
    top: 18,
    left: PAGE_PADDING,
    right: PAGE_PADDING,
    height: 50,
    borderBottomWidth: 1.2,
    borderBottomColor: GOLD,
    paddingBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerBrand: {
    width: 140,
  },
  headerMeta: {
    alignItems: 'flex-end',
  },
  headerDocTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: PRIMARY,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontFamily: 'Playfair Display',
  },
  headerSubText: {
    fontSize: 7.5,
    color: TEXT_MUTED,
    marginTop: 1,
  },
  footerFixed: {
    position: 'absolute',
    bottom: 14,
    left: PAGE_PADDING,
    right: PAGE_PADDING,
    height: 40,
    backgroundColor: PAGE_BG,
    zIndex: 10,
  },
  footerText: {
    fontSize: 7.5,
    color: '#4b5563',
  },
  footerMeta: {
    fontSize: 6.5,
    color: '#6b7280',
    fontFamily: 'Roboto Mono',
    letterSpacing: 0.3,
  },
  // Work Order / Deed specific titles
  workOrderHeaderBox: {
    alignItems: 'center',
    textAlign: 'center',
    marginTop: 0,
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: GOLD,
  },
  workOrderTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 18,
    fontWeight: 'bold',
    color: PRIMARY,
    textAlign: 'center',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  workOrderMetaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  metaMonoBadge: {
    fontFamily: 'Roboto Mono',
    fontSize: 7.8,
    color: PRIMARY,
    letterSpacing: 1,
    backgroundColor: BG_LIGHT,
    paddingVertical: 2.5,
    paddingHorizontal: 6,
    borderWidth: 0.6,
    borderColor: BORDER,
    borderRadius: 2,
  },
  // Recipient address header (clean, no box)
  recipientBlock: {
    marginBottom: 16,
    paddingBottom: 4,
  },
  recipientTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: PRIMARY,
    marginBottom: 3,
  },
  recipientText: {
    fontSize: 8,
    color: '#4b5563',
    lineHeight: 1.4,
  },
  // Agreement page header (clean, centered, no box)
  agreementHeaderBox: {
    alignItems: 'center',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: GOLD,
  },
  agreementTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 19,
    fontWeight: 'bold',
    color: PRIMARY,
    textAlign: 'center',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  agreementSubtitle: {
    fontSize: 8.5,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  // Parties section (clean, no box)
  partiesContainer: {
    marginBottom: 14,
    paddingVertical: 4,
  },
  partyLabel: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: ACCENT,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  // Contract Overview (refined divider style, no box)
  contractOverviewContainer: {
    marginTop: 10,
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: GOLD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: 8,
  },
  titleBanner: {
    backgroundColor: BG_LIGHT,
    borderLeftWidth: 3.5,
    borderLeftColor: GOLD,
    borderRightWidth: 0.5,
    borderRightColor: BORDER,
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  docTitle: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: PRIMARY,
    letterSpacing: 1,
    fontFamily: 'Playfair Display',
  },
  docSubTitle: {
    fontSize: 8,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: PRIMARY,
    backgroundColor: BG_LIGHT,
    paddingVertical: 4.5,
    paddingHorizontal: 8,
    marginTop: 10,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: GOLD,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  detailSectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: PRIMARY,
    backgroundColor: BG_LIGHT,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginTop: 4,
    marginBottom: 6,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
    borderTopWidth: 0.8,
    borderTopColor: GOLD,
    borderBottomWidth: 0.8,
    borderBottomColor: GOLD,
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY,
    borderRightWidth: 3,
    borderRightColor: PRIMARY,
    fontFamily: 'Playfair Display',
  },
  letterText: {
    marginBottom: 8,
    lineHeight: 1.65,
    fontSize: 9.5,
    color: '#1f2937',
    textAlign: 'justify',
  },
  paragraph: {
    marginBottom: 6,
    lineHeight: 1.55,
    fontSize: 9.3,
    color: '#1f2937',
  },
  bold: {
    fontWeight: 'bold',
    color: PRIMARY,
  },
  card: {
    backgroundColor: BG_LIGHT,
    borderWidth: 0.75,
    borderColor: BORDER,
    borderRadius: 2,
    padding: 8,
    marginBottom: 10,
  },
  table: {
    width: '100%',
    borderTopWidth: 0.75,
    borderLeftWidth: 0.75,
    borderRightWidth: 0.75,
    borderBottomWidth: 0.75,
    borderColor: BORDER,
    marginBottom: 8,
  },
  tHead: {
    flexDirection: 'row',
    backgroundColor: PRIMARY,
    paddingVertical: 4.5,
    paddingHorizontal: 5,
  },
  thCol: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    paddingVertical: 4,
    paddingHorizontal: 5,
    alignItems: 'center',
  },
  tRowAlt: {
    backgroundColor: BG_ALT,
  },
  tdCol: {
    fontSize: 9,
    color: TEXT_DARK,
  },
  totalsRow: {
    flexDirection: 'row',
    borderTopWidth: 1.2,
    borderTopColor: PRIMARY,
    backgroundColor: BG_LIGHT,
    paddingVertical: 5,
    paddingHorizontal: 5,
    alignItems: 'center',
  },
  inWordsBlock: {
    backgroundColor: BG_LIGHT,
    borderLeftWidth: 3,
    borderLeftColor: GOLD,
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    borderRightWidth: 0.5,
    borderRightColor: BORDER,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 2,
    marginBottom: 8,
  },
  inWordsText: {
    fontSize: 8.8,
    fontWeight: 'bold',
    color: PRIMARY,
  },
  clauseRow: {
    flexDirection: 'row',
    marginBottom: 5,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  clauseNum: {
    width: 28,
    fontSize: 8.5,
    fontWeight: 'bold',
    color: ACCENT,
    fontFamily: 'Roboto Mono',
  },
  clauseBody: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.5,
    color: '#2d3748',
  },
  sigRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  sigBlock: {
    width: '45%',
    borderTopWidth: 1,
    borderTopColor: PRIMARY,
    paddingTop: 5,
  },
  sigName: {
    fontSize: 9.2,
    fontWeight: 'bold',
    color: PRIMARY,
    marginBottom: 1.5,
  },
  sigRole: {
    fontSize: 8.2,
    color: TEXT_MUTED,
    lineHeight: 1.3,
  },
  witnessGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 10,
  },
  witnessCol: {
    width: '30%',
    borderTopWidth: 0.75,
    borderTopColor: '#94a3b8',
    paddingTop: 4,
  },
  gmCard: {
    marginTop: 10,
    padding: 8,
    borderWidth: 0.8,
    borderColor: GOLD,
    backgroundColor: BG_ALT,
    borderRadius: 2,
  },

  // Detail Quotation specific styles
  detailTableWrapper: {
    width: '100%',
  },
  detailTHead: {
    flexDirection: 'row',
    borderTopWidth: 0.75,
    borderLeftWidth: 0.75,
    borderRightWidth: 0.75,
    borderBottomWidth: 0.75,
    borderColor: BORDER,
    backgroundColor: BG_LIGHT,
  },
  detailThCol: {
    fontSize: 9,
    fontWeight: 'bold',
    color: PRIMARY,
    textTransform: 'uppercase',
    paddingVertical: 4.5,
    paddingHorizontal: 4,
    borderRightWidth: 0.5,
    borderRightColor: BORDER,
  },
  thColLast: {
    borderRightWidth: 0,
  },
  detailTRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderLeftWidth: 0.75,
    borderRightWidth: 0.75,
    borderBottomWidth: 0.5,
    borderColor: BORDER,
  },
  detailTRowAlt: {
    backgroundColor: BG_ALT,
  },
  detailTdCol: {
    fontSize: 9,
    lineHeight: DETAIL_ROW_LINE_HEIGHT,
    paddingTop: DETAIL_ROW_VERTICAL_PADDING,
    paddingBottom: DETAIL_ROW_VERTICAL_PADDING,
    paddingHorizontal: 4,
    borderRightWidth: 0.5,
    borderRightColor: BORDER,
    color: '#000000',
  },
  wSl: { width: '6%', textAlign: 'center' },
  wName: { width: '16%' },
  wMats: { width: '44%' },
  wQty: { width: '10%', textAlign: 'center' },
  wPrice: { width: '12%', textAlign: 'center' },
  wTotal: { width: '12%', textAlign: 'center' },

  areaTitleRow: {
    backgroundColor: BG_LIGHT,
    borderLeftWidth: 0.75,
    borderRightWidth: 0.75,
    borderBottomWidth: 0.5,
    borderColor: BORDER,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  areaTitleText: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: PRIMARY,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  areaTotalRow: {
    backgroundColor: BG_ALT,
    borderLeftWidth: 0.75,
    borderRightWidth: 0.75,
    borderBottomWidth: 0.5,
    borderColor: BORDER,
  },
  areaTotalLabel: {
    textAlign: 'right',
    color: PRIMARY,
    textTransform: 'uppercase',
  },
  matText: {
    fontSize: 8.5,
    color: '#374151',
    lineHeight: DETAIL_ROW_LINE_HEIGHT,
    marginBottom: 0,
  },
  matCell: {
    lineHeight: DETAIL_ROW_LINE_HEIGHT,
  },
  grandTotalRow: {
    flexDirection: 'row',
    paddingTop: 8,
    marginTop: 6,
    borderTopWidth: 1.2,
    borderTopColor: PRIMARY,
  },
  grandTotalLabel: {
    width: '76%',
    textAlign: 'right',
    paddingRight: 10,
    fontWeight: 'bold',
    fontSize: 9.5,
    color: PRIMARY,
    textTransform: 'uppercase',
  },
  grandTotalValue: {
    width: '24%',
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: 9.5,
    color: PRIMARY,
  },
  inWords: {
    fontSize: 9,
    color: PRIMARY,
    marginTop: 6,
    textAlign: 'left',
    fontFamily: 'Noto Sans Bengali',
    fontWeight: 'bold',
    textDecoration: 'underline',
  },
})

function formatDateString(dateString: string | undefined | null) {
  if (!dateString) return 'N/A'
  try {
    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateString.trim())) {
      const [d, m, y] = dateString.trim().split('-').map(Number)
      const dateObj = new Date(y, m - 1, d)
      if (!isNaN(dateObj.getTime())) {
        return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(dateObj)
      }
    }
    const timestamp = Date.parse(dateString)
    if (isNaN(timestamp)) return dateString
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(timestamp))
  } catch {
    return dateString
  }
}

const DeedPaperFrame = () => (
  <>
    <View style={styles.deedFrame} fixed />
    <View style={styles.deedFrameInner} fixed />
  </>
)

const WatermarkBackground = () => (
  <View style={styles.watermark} fixed>
    <Image src={watermarkSrc} style={{ width: 400, height: 400 }} />
  </View>
)

const GlobalHeader = ({
  code,
  date,
  title = 'Agreement Paper',
  sidePadding = PAGE_PADDING,
}: {
  code: string
  date: string
  title?: string
  sidePadding?: number
}) => (
  <View style={[styles.header, { left: sidePadding, right: sidePadding }]} fixed>
    <View style={styles.headerBrand}>
      <Image src={logoSrc} style={{ width: 130 }} />
    </View>
    <View style={styles.headerMeta}>
      <Text style={styles.headerDocTitle}>{title}</Text>
      <Text style={styles.headerSubText}>Date: {formatDateString(date)}</Text>
      <Text style={styles.headerSubText}>WO ID: {code}</Text>
    </View>
  </View>
)

const GlobalFooter = ({
  companyName = 'Interior Concepts Studio',
  companyAddress = 'TA-174/1, Unit 4A, 3rd Floor(Lift-3) Khonikachroy, South Badda Lake View Road, Badda, Dhaka-1212',
  companyPhones = '+880 1334-935530 | +880 1334-935531',
  companyWebsite = 'interiorconceptsstudio.com',
  workOrderId,
  reference,
  sidePadding = PAGE_PADDING,
}: {
  companyName?: string
  companyAddress?: string
  companyPhones?: string
  companyWebsite?: string
  workOrderId: string
  reference: string
  sidePadding?: number
}) => (
  <View style={[styles.footerFixed, { left: sidePadding, right: sidePadding }]} fixed>
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: GOLD,
        paddingTop: 6,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <View style={{ width: '35%' }}>
        <Text style={[styles.footerText, { color: PRIMARY, fontWeight: 'bold', fontSize: 8 }]}>
          {companyName}
        </Text>
        <Text style={styles.footerText}>{companyAddress}</Text>
      </View>
      <View style={{ width: '30%', alignItems: 'center' }}>
        <Text style={styles.footerText}>{companyPhones}</Text>
        <Text style={[styles.footerText, { color: PRIMARY, fontWeight: 'bold' }]}>
          {companyWebsite}
        </Text>
      </View>
      <View style={{ width: '35%', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
        <Text
          style={styles.footerText}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        />
        <Text style={[styles.footerMeta, { marginTop: 2 }]}>
          Ref: {reference || workOrderId} · WO: {workOrderId}
        </Text>
      </View>
    </View>
  </View>
)

function softWrapPdfText(value: string | null | undefined, chunkSize = 24) {
  if (!value) return ''
  return value
    .split(/(\s+)/)
    .map((part) => {
      if (/^\s+$/.test(part) || part.length <= chunkSize) return part
      const chunks = part.match(new RegExp(`.{1,${chunkSize}}`, 'g')) ?? [part]
      return chunks.join('\u200B')
    })
    .join('')
}

function splitPdfTableLines(value: string | null | undefined, lineLength: number) {
  if (!value) return ['']
  const rawLines = value.split(/\r?\n/)
  if (rawLines.length === 0) return ['']

  const result: string[] = []

  for (const rawLine of rawLines) {
    if (rawLine === '') {
      result.push('')
      continue
    }

    const words = rawLine.split(' ')
    let current = ''

    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      const wordChunks =
        word.length > lineLength
          ? word.match(new RegExp(`.{1,${lineLength}}`, 'g')) ?? [word]
          : [word]

      for (let j = 0; j < wordChunks.length; j++) {
        const chunk = wordChunks[j]
        if (!current) {
          current = chunk
        } else if (current.length + 1 + chunk.length > lineLength) {
          result.push(current)
          current = chunk
        } else {
          current = `${current} ${chunk}`
        }
      }
    }

    if (current || rawLine !== '') {
      result.push(current)
    }
  }

  return result.length > 0 ? result : ['']
}

function parseMarkdownBoldPdf(text: string, defaultBold = false) {
  if (!text) return null
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <Text key={idx} style={styles.bold}>
          {softWrapPdfText(part.slice(2, -2))}
        </Text>
      )
    }
    return (
      <Text key={idx} style={defaultBold ? styles.bold : {}}>
        {softWrapPdfText(part)}
      </Text>
    )
  })
}

function SingleMaterialLine({ text, isFirstRowAndEmpty }: { text: string; isFirstRowAndEmpty?: boolean }) {
  if (!text) {
    if (isFirstRowAndEmpty) {
      return <Text wrap={false} style={styles.matText}>—</Text>
    }
    return <Text wrap={false} style={styles.matText}>{'\u00A0'}</Text>
  }
  const match = text.match(/^(\d{2}\.[^:]+:|[^:*]+:|\*[^:]+:)/)
  const isWithoutWiring =
    text.toLowerCase().includes('without supplying wiring') ||
    text.toLowerCase().includes('without suppling wiring')
  if (!match) {
    return (
      <Text wrap={false} style={styles.matText}>
        {parseMarkdownBoldPdf(text, isWithoutWiring)}
      </Text>
    )
  }
  const prefix = match[1]
  const rest = text.substring(prefix.length)
  return (
    <Text wrap={false} style={styles.matText}>
      <Text style={styles.bold}>{softWrapPdfText(prefix)}</Text>
      {parseMarkdownBoldPdf(rest, isWithoutWiring)}
    </Text>
  )
}

function formatDetailUnitPriceCurrency(line: QuotationDraftContent['lineItems'][number]) {
  if (isRateOnlyLine(line)) return formatDetailAmount(line.rate)
  if (line.rate <= 0) return formatDetailUnitPriceCell(line)
  return formatDetailAmount(line.rate)
}

function formatDetailTotalCurrency(line: QuotationDraftContent['lineItems'][number]) {
  if (isRateOnlyLine(line)) return formatDetailTotalCell(line)
  if (!line.amount || line.amount <= 0) return '---'
  return formatDetailAmount(line.amount)
}

export type AgreementPdfProps = AgreementData

export function AgreementDocument(props: AgreementPdfProps) {
  const quotation = props.quotationDraft || null
  const rows = quotation ? buildDetailFloorSummaries(quotation) : []

  const finalValue =
    Number(props.agreementValue) ||
    props.grandTotal ||
    props.quotationTotals?.grandTotal ||
    0
  const subtotalValue = props.quotationTotals?.subtotal ?? props.interiorWorkTotal ?? finalValue
  const discountAmount = props.quotationTotals?.discountAmount ?? 0

  const paymentSchedule = props.paymentSchedule || []
  const paymentPercentTotal = paymentSchedule.reduce(
    (sum, item) => sum + (Number.parseFloat(String(item.percentage).replace('%', '')) || 0),
    0,
  )
  const paymentAmountTotal = paymentSchedule.reduce(
    (sum, item) => sum + (Number.parseFloat(String(item.amount).replace(/,/g, '')) || 0),
    0,
  )

  const workOrderId = props.workOrderId || `WRK-${props.clientId || '001'}`
  const reference = props.reference || props.referenceNo || workOrderId
  const subContractId = props.subContractId || `SUB-${String(props.clientId || '001').padStart(4, '0')}`
  const agreementDate = props.agreementDate || formatDateString(new Date().toISOString())
  const clientName = props.ownerName || props.clientName || 'Valued Client'
  const projectAddress = props.projectAddress || props.siteAddress || props.ownerAddress || 'Dhaka, Bangladesh'
  const companyName = props.companyName || 'Interior Concepts'
  const companyAddress = props.companyAddress || 'TA-174/1, Unit 4A, 3rd Floor(Lift-3) Khonikachroy, South Badda Lake View Road, Badda, Dhaka-1212'
  const companyPhones = props.companyPhones || '+880 1334-935530 | +880 1334-935531'
  const companyWebsite = props.companyWebsite || 'interiorconceptsstudio.com'
  const tradeLicenseNo = props.tradeLicenseNo || 'TRAD/DNCC/048385/2025'
  const tinNo = props.tinNo || '469560437683'
  const ceoName = props.ceoName || 'Shopi Ullah Rashed'
  const ceoNid = props.ceoNid || '7762979297'
  const companyRepresentative = props.companyRepresentative || 'Shopi Ullah Rashed'
  const companyRepresentativeTitle = props.companyRepresentativeTitle || 'Chief Executive Officer'
  const srCrmName = props.srCrmName || props.officeAdminName || 'Senior Project Coordinator'

  const getAreaGroups = (entry: ReturnType<typeof buildDetailFloorSummaries>[number]) => {
    const isFinishingElectrical =
      entry.floor.id === 'finishing-electrical-works-section' ||
      Boolean(entry.floor.name && /finishing|electrical/i.test(entry.floor.name))

    if (isFinishingElectrical) {
      return [{ id: `fe-${entry.floor.id}`, name: '', lines: entry.lines }]
    }

    const floorAreas = [...(quotation?.areas ?? [])]
      .filter((area) => area.floorId === entry.floor.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)

    const unassignedLines = entry.lines.filter((line) => !line.areaId)
    if (floorAreas.length === 0) return [{ id: `general-${entry.floor.id}`, name: 'General Area', lines: entry.lines }]

    return [
      { id: `general-${entry.floor.id}`, name: 'General Area', lines: unassignedLines },
      ...floorAreas.map((area) => ({
        id: area.id,
        name: area.name || 'Area',
        lines: entry.lines.filter((line) => line.areaId === area.id),
      })),
    ].filter((area) => area.lines.length > 0)
  }

  // Precompute continuous global SL numbers across all detail sections
  const lineSlMap = new Map<string, number>()
  let globalSlCounter = 0
  rows.forEach((entry) => {
    const areaGroups = getAreaGroups(entry)
    areaGroups.forEach((area) => {
      area.lines.forEach((line) => {
        globalSlCounter += 1
        lineSlMap.set(line.id, globalSlCounter)
      })
    })
  })

  // Fallback item area grouping if no quotation draft
  const fallbackAreaGroups = new Map<string, typeof props.items>()
  if (rows.length === 0 && props.items && props.items.length > 0) {
    props.items.forEach((item) => {
      const area = item.areaName || 'General Interior Scope'
      if (!fallbackAreaGroups.has(area)) fallbackAreaGroups.set(area, [])
      fallbackAreaGroups.get(area)!.push(item)
    })
  }

  const clauseGroups: AgreementClauseGroup[] =
    props.clauseGroups && props.clauseGroups.length > 0
      ? props.clauseGroups
      : [
          {
            title: 'Working Procedure',
            clauses: [
              props.workingProcedureText ||
                'Project survey: Before we begin the interior work on the project, our team of architects and engineers will conduct a site survey.',
              props.siteInspectionText ||
                'Site Inspection: We will ensure that the project adheres to the client-approved 3D design and specifications.',
              props.defectiveWorkText ||
                'Defective Work: Any defective work shall be rectified or rebuilt to the satisfaction of the Owner.',
              props.inspectionOfWorkText ||
                'Inspection of Work: During progress of the work, the Site Engineer/Consultant shall have access to inspect the work.',
            ],
          },
          {
            title: 'Others Terms & Conditions',
            clauses: props.otherTerms || [
              'All workmanship must be of good standard and acceptable to Engineer-in-Charge/Consultant.',
              'Running bills will be prepared and submitted based on actual progress of work and agreed payment milestones.',
            ],
          },
        ]

  return (
    <Document title={`Agreement - ${clientName}`} author={companyName}>
      {/* ─── PAGE 1: WORK ORDER FOR INTERIOR WORKS ─────────────────── */}
      <Page size="A4" style={[styles.page, { paddingBottom: 120 }]}>
        <DeedPaperFrame />
        <WatermarkBackground />
        <GlobalHeader code={workOrderId} date={agreementDate} title="Work Order" />

        <View style={styles.workOrderHeaderBox}>
          <Text style={styles.workOrderTitle}>Work Order for Interior Works</Text>
          <View style={styles.workOrderMetaRow}>
            <Text style={styles.metaMonoBadge}>REF: {reference}</Text>
            <Text style={styles.metaMonoBadge}>SUBCONTRACT ID: {subContractId}</Text>
          </View>
        </View>

        <View style={styles.recipientBlock}>
          <Text style={styles.recipientTitle}>
            Dear, {companyName}
          </Text>
          <Text style={styles.recipientText}>{companyAddress}</Text>
          <Text style={styles.recipientText}>Phone No: {companyPhones}</Text>
        </View>

        {/* Center the letter vertically in the available page space */}
        <View style={{ flex: 1, justifyContent: 'center', marginVertical: 'auto' }}>
          {(props.letterBody || '')
            .split('\n')
            .filter(Boolean)
            .map((line, index) => (
              <Text key={index} style={styles.letterText}>
                {line}
              </Text>
            ))}
        </View>

        <View style={{ position: 'absolute', bottom: 58, left: PAGE_PADDING, right: PAGE_PADDING }}>
          <Text style={[styles.paragraph, { marginBottom: 16 }]}>Thanking you—</Text>
          <View style={styles.sigRow}>
            <View style={styles.sigBlock}>
              <Text style={styles.sigName}>{clientName}</Text>
              <Text style={styles.sigRole}>Owner (Project)</Text>
              <Text style={styles.sigRole}>Signature: ______________________</Text>
            </View>
            <View style={styles.sigBlock}>
              <Text style={styles.sigName}>{srCrmName}</Text>
              <Text style={styles.sigRole}>Assistant General Manager (AGM)</Text>
              <Text style={styles.sigRole}>{companyName}</Text>
            </View>
          </View>
        </View>

        <GlobalFooter
          companyName={companyName}
          companyAddress={companyAddress}
          companyPhones={companyPhones}
          companyWebsite={companyWebsite}
          workOrderId={workOrderId}
          reference={reference}
        />
      </Page>

      {/* ─── PAGE 2: AGREEMENT AND RECITALS ───────────────────────── */}
      <Page size="A4" style={styles.page}>
        <DeedPaperFrame />
        <WatermarkBackground />
        <GlobalHeader code={workOrderId} date={agreementDate} title="Agreement Paper" />

        {/* Centered Agreement title in Playfair Display with date caption, NO BOX */}
        <View style={styles.agreementHeaderBox}>
          <Text style={styles.agreementTitle}>Agreement</Text>
          <Text style={styles.agreementSubtitle}>
            This Agreement is made at Dhaka dated at {formatDateString(agreementDate)}.
          </Text>
        </View>

        {/* Between and section, clean flow, NO BOX */}
        <View style={styles.partiesContainer}>
          <Text style={styles.partyLabel}>BETWEEN</Text>
          <Text style={[styles.paragraph, { marginBottom: 6 }]}>
            <Text style={styles.bold}>{clientName}</Text>, Owner of the Apartment at{' '}
            {projectAddress}. (Hereinafter referred to as the{' '}
            <Text style={styles.bold}>&quot;Owner&quot;</Text>)
          </Text>

          <Text style={[styles.partyLabel, { marginTop: 4 }]}>AND</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>{companyName}</Text>, having registered address at {companyAddress},
            Trade License No: <Text style={styles.bold}>{tradeLicenseNo}</Text>. TIN: <Text style={styles.bold}>{tinNo}</Text>,
            Represented by Mr. <Text style={styles.bold}>{companyRepresentative}</Text>,
            Designation: {companyRepresentativeTitle}, NID No: <Text style={styles.bold}>{ceoNid}</Text>, (hereinafter referred to as the{' '}
            <Text style={styles.bold}>&quot;Consultant&quot;</Text> which expression shall, unless it be repugnant to the context or meaning
            thereof, be deemed to mean and include its successors and assigns) of the other part.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Recitals</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>WHEREAS</Text> the Owner is desirous of getting the Interior Design, Work and Execution for
          their proposed flat at {projectAddress}.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>AND WHEREAS</Text> the Consultant is a Design and Build Contractor having vast experience in
          interior turnkey works and has agreed to do the interior works in the above-mentioned site.
        </Text>

        <Text style={styles.sectionTitle}>NOW IT IS AGREED BY AND BETWEEN BOTH PARTIES AS FOLLOWS:</Text>
        <View style={{ marginBottom: 6 }}>
          <View style={styles.clauseRow}>
            <Text style={styles.clauseNum}>1.</Text>
            <Text style={styles.clauseBody}>
              {companyName} shall undertake and complete the design, supply, manufacturing, installation, execution,
              furnishing, and completion of the interior works of the Project in accordance with the terms and conditions of this
              Agreement, the approved Schedule of Rates, approved drawings and designs, material specifications, and any written
              instructions issued by the Owner or the Owner&apos;s duly authorized representative.
            </Text>
          </View>
          <View style={styles.clauseRow}>
            <Text style={styles.clauseNum}>2.</Text>
            <Text style={styles.clauseBody}>
              All works shall be carried out in accordance with the approved design, specifications, agreed quality standards, and
              applicable project requirements, under the supervision and coordination of the Owner&apos;s authorized representative,
              and to the reasonable satisfaction of the Owner, subject to the terms and conditions of this Agreement.
            </Text>
          </View>
          <View style={styles.clauseRow}>
            <Text style={styles.clauseNum}>3.</Text>
            <Text style={styles.clauseBody}>
              The detailed scope of work, description of works, specifications, Schedule of Rates, approved drawings, materials,
              finishes, and other contractual requirements shall constitute an integral part of this Agreement.
            </Text>
          </View>
        </View>

        {/* Contract Overview - refined divider style, NO BOX */}
        <View style={styles.contractOverviewContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontSize: 8, color: TEXT_MUTED }}>
              Project: <Text style={{ color: PRIMARY, fontWeight: 'bold' }}>{props.projectName || clientName}</Text>
            </Text>
            <Text style={{ fontSize: 8, color: TEXT_MUTED }}>
              WO ID: <Text style={{ color: PRIMARY, fontWeight: 'bold' }}>{workOrderId}</Text>
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 8, color: TEXT_MUTED }}>
              Senior CRM: <Text style={{ color: PRIMARY, fontWeight: 'bold' }}>{srCrmName}</Text>
            </Text>
            <Text style={{ fontSize: 8, color: TEXT_MUTED }}>
              Agreement Value: <Text style={{ color: ACCENT, fontWeight: 'bold' }}>৳ {formatDetailAmount(finalValue)}</Text>
            </Text>
          </View>
        </View>

        <GlobalFooter
          companyName={companyName}
          companyAddress={companyAddress}
          companyPhones={companyPhones}
          companyWebsite={companyWebsite}
          workOrderId={workOrderId}
          reference={reference}
        />
      </Page>

      {/* ─── PAGE 3: QUOTATION SUMMARY & PAYMENT SCHEDULE ─────────── */}
      <Page size="A4" style={styles.page}>
        <DeedPaperFrame />
        <WatermarkBackground />
        <GlobalHeader code={workOrderId} date={agreementDate} title="Quotation & Payment" />

        <Text style={styles.sectionTitle}>Quotation Summary</Text>
        <View style={styles.table}>
          <View style={styles.tHead}>
            <Text style={[styles.thCol, { width: '8%', textAlign: 'center' }]}>SL</Text>
            <Text style={[styles.thCol, { width: '64%' }]}>ITEM NAME</Text>
            <Text style={[styles.thCol, { width: '28%', textAlign: 'right' }]}>TOTAL (৳)</Text>
          </View>

          {rows.length > 0 ? (
            rows.map((section, index) => (
              <View key={section.floor.id} style={[styles.tRow, index % 2 ? styles.tRowAlt : {}]}>
                <Text style={[styles.tdCol, { width: '8%', textAlign: 'center' }]}>{String(index + 1).padStart(2, '0')}</Text>
                <Text style={[styles.tdCol, { width: '64%' }]}>{section.floor.name}</Text>
                <Text style={[styles.tdCol, { width: '28%', textAlign: 'right' }]}>{formatDetailAmount(section.total)}</Text>
              </View>
            ))
          ) : (
            <>
              <View style={styles.tRow}>
                <Text style={[styles.tdCol, { width: '8%', textAlign: 'center' }]}>01</Text>
                <Text style={[styles.tdCol, { width: '64%' }]}>Interior Work</Text>
                <Text style={[styles.tdCol, { width: '28%', textAlign: 'right' }]}>{formatDetailAmount(subtotalValue)}</Text>
              </View>
              <View style={[styles.tRow, styles.tRowAlt]}>
                <Text style={[styles.tdCol, { width: '8%', textAlign: 'center' }]}>02</Text>
                <Text style={[styles.tdCol, { width: '64%', fontSize: 7, color: TEXT_MUTED }]}>
                  Electrical work (Approx) (The electricity bill will be calculated after the material approval meeting, as there are variations in many brands).
                </Text>
                <Text style={[styles.tdCol, { width: '28%', textAlign: 'right', color: TEXT_MUTED }]}>------</Text>
              </View>
              <View style={styles.tRow}>
                <Text style={[styles.tdCol, { width: '8%', textAlign: 'center' }]}>03</Text>
                <Text style={[styles.tdCol, { width: '64%', fontSize: 7, color: TEXT_MUTED }]}>
                  Paint work (We will submit the painting bill after installing all the cabinets for the project. However, the painting rates are specified in this agreement.)
                </Text>
                <Text style={[styles.tdCol, { width: '28%', textAlign: 'right', color: TEXT_MUTED }]}>------</Text>
              </View>
            </>
          )}

          <View style={styles.tRow}>
            <Text style={[styles.tdCol, { width: '8%' }]} />
            <Text style={[styles.tdCol, { width: '64%', fontWeight: 'bold', color: PRIMARY }]}>Total</Text>
            <Text style={[styles.tdCol, { width: '28%', textAlign: 'right', fontWeight: 'bold' }]}>
              {formatDetailAmount(subtotalValue)}
            </Text>
          </View>

          {discountAmount > 0 ? (
            <View style={styles.tRow}>
              <Text style={[styles.tdCol, { width: '8%' }]} />
              <Text style={[styles.tdCol, { width: '64%', fontWeight: 'bold', color: GOLD }]}>Honor / Discount</Text>
              <Text style={[styles.tdCol, { width: '28%', textAlign: 'right', fontWeight: 'bold', color: GOLD }]}>
                - {formatDetailAmount(discountAmount)}
              </Text>
            </View>
          ) : null}

          <View style={styles.totalsRow}>
            <Text style={[styles.thCol, { width: '8%' }]} />
            <Text style={[styles.thCol, { width: '64%', color: PRIMARY, fontSize: 8.5 }]}>Grand Total</Text>
            <Text style={[styles.thCol, { width: '28%', textAlign: 'right', color: PRIMARY, fontSize: 9 }]}>
              ৳ {formatDetailAmount(finalValue)}
            </Text>
          </View>
        </View>

        <View style={styles.inWordsBlock}>
          <Text style={styles.inWordsText}>In Word: {amountInWordsTaka(finalValue)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Payment Schedule</Text>
        <View style={styles.table}>
          <View style={styles.tHead}>
            <Text style={[styles.thCol, { width: '8%', textAlign: 'center' }]}>SL</Text>
            <Text style={[styles.thCol, { width: '56%' }]}>Payment Stage</Text>
            <Text style={[styles.thCol, { width: '16%', textAlign: 'center' }]}>Percentage</Text>
            <Text style={[styles.thCol, { width: '20%', textAlign: 'right' }]}>Taka (৳)</Text>
          </View>

          {paymentSchedule.map((item, index) => (
            <View key={index} style={[styles.tRow, index % 2 ? styles.tRowAlt : {}]}>
              <Text style={[styles.tdCol, { width: '8%', textAlign: 'center' }]}>{String(index + 1).padStart(2, '0')}</Text>
              <Text style={[styles.tdCol, { width: '56%' }]}>{item.stage}</Text>
              <Text style={[styles.tdCol, { width: '16%', textAlign: 'center' }]}>{item.percentage}</Text>
              <Text style={[styles.tdCol, { width: '20%', textAlign: 'right' }]}>
                {typeof item.amount === 'number' ? formatDetailAmount(item.amount) : item.amount}
              </Text>
            </View>
          ))}

          <View style={styles.totalsRow}>
            <Text style={[styles.thCol, { width: '8%' }]} />
            <Text style={[styles.thCol, { width: '56%', color: PRIMARY }]}>Total</Text>
            <Text style={[styles.thCol, { width: '16%', textAlign: 'center', color: PRIMARY }]}>
              {paymentPercentTotal.toFixed(2).replace(/\.00$/, '')}%
            </Text>
            <Text style={[styles.thCol, { width: '20%', textAlign: 'right', color: PRIMARY }]}>
              ৳ {formatDetailAmount(paymentAmountTotal || finalValue)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Annexures</Text>
        {(props.annexures || []).map((item, index) => (
          <View key={index} style={{ marginBottom: 3 }}>
            <Text style={[styles.paragraph, { fontSize: 7.8, color: '#333333' }]}>
              <Text style={styles.bold}>Annexure A{index + 1}: </Text>
              {item.replace(/^Annexure\s*A\d+:\s*/i, '')}
            </Text>
          </View>
        ))}

        <GlobalFooter
          companyName={companyName}
          companyAddress={companyAddress}
          companyPhones={companyPhones}
          companyWebsite={companyWebsite}
          workOrderId={workOrderId}
          reference={reference}
        />
      </Page>

      {/* ─── PAGES 4+: DETAIL QUOTATION / SCHEDULE OF RATES ────────── */}
      {quotation && rows.length > 0 ? (
        rows.map((entry) => (
          <Page key={entry.floor.id} size="A4" style={styles.detailPage}>
            <DeedPaperFrame />
            <WatermarkBackground />
            <GlobalHeader
              code={workOrderId}
              date={agreementDate}
              title="Schedule of Rates"
              sidePadding={16}
            />

            <Text style={styles.detailSectionTitle}>{softWrapPdfText(entry.floor.name)}</Text>

            <View style={styles.detailTableWrapper}>
              <View style={styles.detailTHead}>
                <Text style={[styles.detailThCol, styles.wSl]}>SL</Text>
                <Text style={[styles.detailThCol, styles.wName]}>Name</Text>
                <Text style={[styles.detailThCol, styles.wMats]}>Material Description</Text>
                <Text style={[styles.detailThCol, styles.wQty]}>Qty/Sft</Text>
                <Text style={[styles.detailThCol, styles.wPrice]}>U/P ({BDT_SYMBOL})</Text>
                <Text style={[styles.detailThCol, styles.wTotal, styles.thColLast]}>Total ({BDT_SYMBOL})</Text>
              </View>

              {getAreaGroups(entry).map((area) => (
                <View key={area.id}>
                  {area.name ? (
                    <View style={styles.areaTitleRow} wrap={false}>
                      <Text style={styles.areaTitleText}>{softWrapPdfText(area.name)}</Text>
                    </View>
                  ) : null}

                  {area.lines.map((line, lineIndex) => {
                    const isPkg = isPackageLine(line)
                    const nameLines = splitPdfTableLines(line.description, 14)
                    const materialLines = splitPdfTableLines(line.materials, 50)

                    let priceTextRaw = ''
                    if (isPkg) {
                      const userWritten = line.unitPriceLabel?.trim()
                      priceTextRaw = userWritten && userWritten !== 'as per project design' ? userWritten : '--'
                    } else {
                      priceTextRaw = formatDetailUnitPriceCurrency(line)
                    }

                    const priceLines = isPkg
                      ? splitPdfTableLines(priceTextRaw, 18)
                      : splitPdfTableLines(priceTextRaw, 9)

                    const isFinishingElectricalEntry =
                      entry.floor.id === 'finishing-electrical-works-section' ||
                      Boolean(entry.floor.name && /finishing|electrical/i.test(entry.floor.name)) ||
                      Boolean(area.name && /finishing|electrical/i.test(area.name))

                    const feRate = Number.isFinite(line.rate) ? line.rate : 0
                    const feQty = Number.isFinite(line.quantity) ? line.quantity : 0
                    const isFEPackageMode =
                      isFinishingElectricalEntry && line.amount > 0 && !(feRate > 0 && feQty > 0)

                    let totalTextRaw = ''
                    if (isFinishingElectricalEntry) {
                      if (line.amount && line.amount > 0) {
                        totalTextRaw = `${formatDetailAmount(line.amount)}\n(approx.)`
                      } else {
                        totalTextRaw = '---'
                      }
                    } else if (isPkg) {
                      if (line.amount && line.amount > 0) {
                        totalTextRaw = formatDetailAmount(line.amount)
                      } else {
                        totalTextRaw = '---'
                      }
                    } else {
                      totalTextRaw = formatDetailTotalCurrency(line)
                    }
                    const totalLines = splitPdfTableLines(totalTextRaw, 9)

                    const tableLineCount = Math.max(
                      nameLines.length,
                      materialLines.length,
                      priceLines.length,
                      totalLines.length,
                    )
                    const rowCellStyle = {
                      paddingTop: DETAIL_ROW_VERTICAL_PADDING,
                      paddingBottom: DETAIL_ROW_VERTICAL_PADDING,
                    }
                    const slNumber = String(lineSlMap.get(line.id) ?? lineIndex + 1).padStart(2, '0')

                    return Array.from({ length: tableLineCount }, (_, rowIndex) => {
                      const isFirstMaterialRow = rowIndex === 0
                      const isLastSubRow = rowIndex === tableLineCount - 1
                      const nameText = nameLines[rowIndex] ?? ''
                      const matText = materialLines[rowIndex] ?? ''
                      const priceText = priceLines[rowIndex] ?? ''
                      const totalText = totalLines[rowIndex] ?? ''

                      return (
                        <View
                          key={`${line.id}-${rowIndex}`}
                          wrap={false}
                          style={[
                            styles.detailTRow,
                            lineIndex % 2 === 1 ? styles.detailTRowAlt : {},
                            !isLastSubRow ? { borderBottomWidth: 0 } : {},
                          ]}
                        >
                          <Text style={[styles.detailTdCol, styles.wSl, styles.bold, rowCellStyle]}>
                            {isFirstMaterialRow ? slNumber : ''}
                          </Text>
                          <Text wrap={false} style={[styles.detailTdCol, styles.wName, rowCellStyle]}>
                            {nameText ? softWrapPdfText(nameText) : ''}
                          </Text>
                          <View style={[styles.detailTdCol, styles.wMats, styles.matCell, rowCellStyle]}>
                            <SingleMaterialLine
                              text={matText}
                              isFirstRowAndEmpty={isFirstMaterialRow && !line.materials?.trim()}
                            />
                          </View>
                          {isFEPackageMode ? (
                            <Text
                              style={[
                                styles.detailTdCol,
                                { width: '22%', textAlign: 'center' },
                                rowCellStyle,
                                { fontSize: 8.5 },
                              ]}
                            >
                              {isFirstMaterialRow ? 'Package' : ''}
                            </Text>
                          ) : (
                            <>
                              <Text
                                style={[
                                  styles.detailTdCol,
                                  styles.wQty,
                                  rowCellStyle,
                                  { fontSize: 8.5 },
                                ]}
                              >
                                {isFirstMaterialRow ? (isPkg ? 'Package' : formatDetailQtyCell(line)) : ''}
                              </Text>
                              <Text
                                style={[
                                  styles.detailTdCol,
                                  styles.wPrice,
                                  rowCellStyle,
                                  { fontSize: 8.5 },
                                ]}
                              >
                                {isFirstMaterialRow ? (priceText ? softWrapPdfText(priceText) : '') : ''}
                              </Text>
                            </>
                          )}
                          <Text
                            style={[
                              styles.detailTdCol,
                              styles.wTotal,
                              styles.thColLast,
                              styles.bold,
                              { color: PRIMARY },
                              rowCellStyle,
                            ]}
                          >
                            {totalText ? softWrapPdfText(totalText) : ''}
                          </Text>
                        </View>
                      )
                    })
                  })}

                  {area.name &&
                  area.name !== 'Finishing & Electrical Works' &&
                  area.name !== 'Finishing & Electrical' ? (
                    <View style={[styles.detailTRow, styles.areaTotalRow]} wrap={false}>
                      <Text style={[styles.detailTdCol, styles.wSl]} />
                      <Text style={[styles.detailTdCol, styles.wName]} />
                      <Text style={[styles.detailTdCol, styles.wMats, styles.bold, styles.areaTotalLabel]}>
                        TOTAL FOR {softWrapPdfText(area.name).toUpperCase()}
                      </Text>
                      <Text style={[styles.detailTdCol, styles.wQty]} />
                      <Text style={[styles.detailTdCol, styles.wPrice]} />
                      <Text
                        style={[
                          styles.detailTdCol,
                          styles.wTotal,
                          styles.thColLast,
                          styles.bold,
                          { color: PRIMARY },
                        ]}
                      >
                        ৳ {formatDetailAmount(area.lines.reduce((s, l) => s + l.amount, 0))}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>

            {entry.total > 0 ? (
              <>
                <View style={[styles.grandTotalRow, { marginTop: 12 }]} wrap={false}>
                  <Text style={styles.grandTotalLabel}>
                    TOTAL FOR {softWrapPdfText(entry.floor.name).toUpperCase()}
                  </Text>
                  <Text style={styles.grandTotalValue}>
                    ৳ {formatDetailAmount(entry.total)}
                    {entry.floor.name === 'Finishing & Electrical Works' ||
                    /finishing|electrical/i.test(entry.floor.name)
                      ? ' (approx.)'
                      : ''}
                  </Text>
                </View>
                <Text style={styles.inWords}>In Words: {amountInWordsTaka(entry.total)}</Text>
              </>
            ) : null}

            <GlobalFooter
              companyName={companyName}
              companyAddress={companyAddress}
              companyPhones={companyPhones}
              companyWebsite={companyWebsite}
              workOrderId={workOrderId}
              reference={reference}
              sidePadding={14}
            />
          </Page>
        ))
      ) : fallbackAreaGroups.size > 0 ? (
        <Page size="A4" style={styles.detailPage}>
          <DeedPaperFrame />
          <WatermarkBackground />
          <GlobalHeader
            code={workOrderId}
            date={agreementDate}
            title="Schedule of Rates"
            sidePadding={16}
          />

          <Text style={styles.detailSectionTitle}>INTERIOR FIT-OUT WORKS</Text>

          <View style={styles.detailTableWrapper}>
            <View style={styles.detailTHead}>
              <Text style={[styles.detailThCol, styles.wSl]}>SL</Text>
              <Text style={[styles.detailThCol, styles.wName]}>Name</Text>
              <Text style={[styles.detailThCol, styles.wMats]}>Material Description</Text>
              <Text style={[styles.detailThCol, styles.wQty]}>Qty/Sft</Text>
              <Text style={[styles.detailThCol, styles.wPrice]}>U/P ({BDT_SYMBOL})</Text>
              <Text style={[styles.detailThCol, styles.wTotal, styles.thColLast]}>Total ({BDT_SYMBOL})</Text>
            </View>

            {Array.from(fallbackAreaGroups.entries()).map(([areaTitle, lines], gIdx) => (
              <View key={areaTitle || gIdx}>
                <View style={styles.areaTitleRow} wrap={false}>
                  <Text style={styles.areaTitleText}>{areaTitle}</Text>
                </View>
                {lines.map((line, lIdx) => (
                  <View key={line.sl || lIdx} wrap={false} style={[styles.detailTRow, lIdx % 2 ? styles.detailTRowAlt : {}]}>
                    <Text style={[styles.detailTdCol, styles.wSl, styles.bold]}>{line.sl}</Text>
                    <Text style={[styles.detailTdCol, styles.wName, styles.bold]}>{line.name}</Text>
                    <Text style={[styles.detailTdCol, styles.wMats, { fontSize: 8 }]}>{line.materials}</Text>
                    <Text style={[styles.detailTdCol, styles.wQty]}>{line.qtySft}</Text>
                    <Text style={[styles.detailTdCol, styles.wPrice]}>{line.unitPrice}</Text>
                    <Text style={[styles.detailTdCol, styles.wTotal, styles.thColLast, styles.bold, { color: PRIMARY }]}>
                      ৳ {formatDetailAmount(line.total)}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          <View style={[styles.grandTotalRow, { marginTop: 12 }]} wrap={false}>
            <Text style={styles.grandTotalLabel}>TOTAL AMOUNT</Text>
            <Text style={styles.grandTotalValue}>৳ {formatDetailAmount(finalValue)}</Text>
          </View>
          <Text style={styles.inWords}>In Words: {amountInWordsTaka(finalValue)}</Text>

          <GlobalFooter
            companyName={companyName}
            companyAddress={companyAddress}
            companyPhones={companyPhones}
            companyWebsite={companyWebsite}
            workOrderId={workOrderId}
            reference={reference}
            sidePadding={14}
          />
        </Page>
      ) : null}

      {/* ─── PAGES AFTER DETAIL QUOTATION: AGREEMENT CLAUSES ───────── */}
      {clauseGroups.map((group, groupIndex) => (
        <Page key={group.title || groupIndex} size="A4" style={styles.page}>
          <DeedPaperFrame />
          <WatermarkBackground />
          <GlobalHeader code={workOrderId} date={agreementDate} title="Agreement Clauses" />

          <View style={styles.titleBanner}>
            <Text style={styles.docTitle}>AGREEMENT CLAUSES</Text>
            <Text style={styles.docSubTitle}>
              Section {groupIndex + 1}: {group.title}
            </Text>
          </View>

          {group.clauses.map((clause, index) => {
            const colonIndex = clause.indexOf(':')
            const hasHeader = colonIndex > 0 && colonIndex < 45
            const header = hasHeader ? clause.slice(0, colonIndex + 1) : null
            const body = hasHeader ? clause.slice(colonIndex + 1).trim() : clause

            return (
              <View key={index} style={styles.clauseRow} wrap={false}>
                <Text style={styles.clauseNum}>
                  {groupIndex + 1}.{index + 1}
                </Text>
                <Text style={styles.clauseBody}>
                  {header ? <Text style={styles.bold}>{header} </Text> : null}
                  {body}
                </Text>
              </View>
            )
          })}

          <GlobalFooter
            companyName={companyName}
            companyAddress={companyAddress}
            companyPhones={companyPhones}
            companyWebsite={companyWebsite}
            workOrderId={workOrderId}
            reference={reference}
          />
        </Page>
      ))}

      {/* ─── FINAL PAGE: SIGNATURES, WITNESSES & ACKNOWLEDGEMENT ──── */}
      <Page size="A4" style={styles.page}>
        <DeedPaperFrame />
        <WatermarkBackground />
        <GlobalHeader code={workOrderId} date={agreementDate} title="Signatures" />

        <View style={styles.titleBanner}>
          <Text style={styles.docTitle}>SIGNATURES & ACKNOWLEDGEMENT</Text>
        </View>

        <Text style={[styles.paragraph, { marginTop: 4, lineHeight: 1.5 }]}>
          <Text style={styles.bold}>IN WITNESS WHEREOF</Text>, the Parties hereto, having read, understood, and agreed to all
          the terms and conditions contained in this Agreement, have caused this Agreement to be duly executed by their
          respective duly authorized representatives on the date first written above.
        </Text>
        <Text style={[styles.paragraph, { lineHeight: 1.5 }]}>
          The Parties confirm that they have entered into this Agreement voluntarily, with free consent, and with full authority
          to undertake and perform the obligations stated herein. This Agreement shall become effective upon execution by the
          authorized representatives of both Parties and shall be binding upon the Parties and their respective successors and
          permitted assigns, subject to the applicable laws of Bangladesh.
        </Text>

        <Text style={styles.sectionTitle}>Witnesses</Text>
        <View style={styles.witnessGrid}>
          {(props.witnessNames || ['', '', '']).map((name, index) => (
            <View key={index} style={styles.witnessCol}>
              <Text style={{ fontSize: 6.5, color: TEXT_MUTED, marginBottom: 10 }}>Witness {index + 1}</Text>
              <Text style={styles.sigName}>{name || `${index + 1}. __________________`}</Text>
              <Text style={styles.sigRole}>Signature &amp; Date</Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 12 }}>
          <View style={styles.sigRow}>
            <View style={styles.sigBlock}>
              <Text style={styles.sigName}>{clientName}</Text>
              <Text style={styles.sigRole}>Owner (Project)</Text>
              <Text style={styles.sigRole}>Date: {agreementDate}</Text>
            </View>
            <View style={styles.sigBlock}>
              <Text style={styles.sigName}>{ceoName}</Text>
              <Text style={styles.sigRole}>Chief Executive Officer (CEO)</Text>
              <Text style={styles.sigRole}>{companyName}</Text>
            </View>
          </View>
        </View>

        <GlobalFooter
          companyName={companyName}
          companyAddress={companyAddress}
          companyPhones={companyPhones}
          companyWebsite={companyWebsite}
          workOrderId={workOrderId}
          reference={reference}
        />
      </Page>
    </Document>
  )
}
