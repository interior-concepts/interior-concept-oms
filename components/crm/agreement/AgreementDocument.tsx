'use client'

import { Document, Page, StyleSheet, Text, View, Image, Font } from '@react-pdf/renderer'
import type { AgreementData } from '@/lib/agreement-types'

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return window.location.origin
  return 'https://interiorconcepts.com'
}

Font.register({
  family: 'Noto Sans Bengali',
  fonts: [
    { src: `${getBaseUrl()}/fonts/NotoSansBengali-Regular.ttf` },
    { src: `${getBaseUrl()}/fonts/NotoSansBengali-Bold.ttf`, fontWeight: 'bold' },
  ],
})

Font.register({
  family: 'Playfair Display',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/playfairdisplay/v10/9MkijrV-dEJ0-_NWV7E6N218GKU_F_kIyfK-gGC-Yzs.ttf',
      fontStyle: 'italic',
    },
  ],
})

Font.registerHyphenationCallback((word: string) => [word])

const PRIMARY = '#1f363d'
const GOLD = '#a57c00'
const PAGE_SIDE_PADDING = 28
const HEADER_SPACE = 82
const FOOTER_SPACE = 92

const styles = StyleSheet.create({
  page: {
    paddingTop: HEADER_SPACE,
    paddingBottom: FOOTER_SPACE,
    paddingLeft: PAGE_SIDE_PADDING,
    paddingRight: PAGE_SIDE_PADDING,
    fontSize: 9,
    fontFamily: 'Noto Sans Bengali',
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
    lineHeight: 1.4,
  },
  watermark: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
    opacity: 0.045,
  },
  header: {
    position: 'absolute',
    top: 18,
    left: PAGE_SIDE_PADDING,
    right: PAGE_SIDE_PADDING,
    height: 58,
    paddingHorizontal: 0,
    overflow: 'hidden',
  },
  headerPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 58,
    opacity: 0.08,
  },
  headerRuleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerRule: {
    height: 2.2,
    backgroundColor: PRIMARY,
  },
  headerTitle: {
    color: PRIMARY,
    fontSize: 10,
    fontFamily: 'Playfair Display',
    fontStyle: 'italic',
    letterSpacing: 2,
    marginHorizontal: 12,
    textTransform: 'uppercase',
  },
  datePanel: {
    minWidth: 140,
    alignItems: 'flex-end',
  },
  metaLabel: {
    fontSize: 6,
    color: GOLD,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 9,
    color: PRIMARY,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  footerFixed: {
    position: 'absolute',
    bottom: 14,
    left: PAGE_SIDE_PADDING,
    right: PAGE_SIDE_PADDING,
    paddingTop: 6,
    backgroundColor: '#ffffff',
  },
  footerDivider: {
    height: 1.2,
    backgroundColor: GOLD,
    marginBottom: 6,
  },
  footerText: {
    fontSize: 6.8,
    color: '#555555',
    lineHeight: 1.3,
  },
  footerMeta: {
    fontSize: 6,
    color: '#777777',
    marginTop: 4,
  },
  bold: {
    fontWeight: 'bold',
    color: '#000000',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: PRIMARY,
    letterSpacing: 1.5,
    backgroundColor: '#f3f8f7',
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginTop: 10,
    marginBottom: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: PRIMARY,
  },
  subSectionTitle: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: PRIMARY,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 4,
    letterSpacing: 0.8,
  },
  paragraph: {
    fontSize: 8.5,
    color: '#262626',
    marginBottom: 6,
    textAlign: 'justify',
    lineHeight: 1.45,
  },
  clauseTitle: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: PRIMARY,
    marginTop: 5,
    marginBottom: 2,
  },
  clauseBody: {
    fontSize: 8,
    color: '#333333',
    lineHeight: 1.4,
    textAlign: 'justify',
    marginBottom: 5,
  },
  metaCard: {
    backgroundColor: '#f9fbfb',
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY,
    borderTopWidth: 0.5,
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#d7d7d7',
    padding: 8,
    marginBottom: 10,
  },
  metaCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  metaCardKey: {
    fontSize: 7.5,
    color: '#555555',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  metaCardVal: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: PRIMARY,
  },
  // Tables
  tHead: {
    flexDirection: 'row',
    backgroundColor: '#f3f8f7',
    borderTopWidth: 0.75,
    borderLeftWidth: 0.75,
    borderRightWidth: 0.75,
    borderBottomWidth: 0.75,
    borderColor: '#d7d7d7',
  },
  thCol: {
    fontSize: 8,
    fontWeight: 'bold',
    color: PRIMARY,
    textTransform: 'uppercase',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRightWidth: 0.5,
    borderRightColor: '#d7d7d7',
  },
  thColLast: {
    borderRightWidth: 0,
  },
  tRow: {
    flexDirection: 'row',
    borderLeftWidth: 0.75,
    borderRightWidth: 0.75,
    borderBottomWidth: 0.5,
    borderColor: '#d7d7d7',
  },
  tRowAlt: {
    backgroundColor: '#fffdfa',
  },
  tdCol: {
    fontSize: 8,
    lineHeight: 1.3,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRightWidth: 0.5,
    borderRightColor: '#d7d7d7',
  },
  tdColLast: {
    borderRightWidth: 0,
  },
  areaHeaderRow: {
    backgroundColor: '#eaf2f1',
    borderLeftWidth: 0.75,
    borderRightWidth: 0.75,
    borderBottomWidth: 0.5,
    borderColor: '#d7d7d7',
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  areaHeaderText: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: PRIMARY,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Signatures
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
    paddingTop: 10,
  },
  signatureCol: {
    width: '30%',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingTop: 5,
  },
  signatureColTwo: {
    width: '45%',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingTop: 5,
  },
  sigName: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: PRIMARY,
    textAlign: 'center',
  },
  sigRole: {
    fontSize: 7.5,
    color: '#666666',
    textAlign: 'center',
    marginTop: 1,
  },
  acceptanceBox: {
    marginTop: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#d7d7d7',
    borderRadius: 4,
    backgroundColor: '#fcfdfd',
  },
  grandTotalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: '#f3f8f7',
    borderTopWidth: 1,
    borderTopColor: PRIMARY,
    marginTop: 4,
  },
  inWordsText: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 4,
    textDecoration: 'underline',
  },
})

function Watermark() {
  return (
    <View style={styles.watermark} fixed>
      <Image src={`${getBaseUrl()}/Logo/interior-concept-icon-light.png`} style={{ width: 380, height: 380 }} />
    </View>
  )
}

function PageHeader({ title, refNo, date }: { title: string; refNo: string; date: string }) {
  return (
    <View style={styles.header} fixed>
      <Image src={`${getBaseUrl()}/backgrounddata.svg`} style={styles.headerPattern} />
      <View style={{ paddingTop: 2 }}>
        <View style={styles.headerRuleRow}>
          <View style={[styles.headerRule, { flexGrow: 1.6 }]} />
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={[styles.headerRule, { flexGrow: 0.9 }]} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Image src={`${getBaseUrl()}/Logo/interior-concept-logobg-removed.png`} style={{ width: 145 }} />
          </View>
          <View style={styles.datePanel}>
            <Text style={styles.metaLabel}>Ref: {refNo}</Text>
            <Text style={styles.metaValue}>{date}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

function PageFooter({ agreementCode, updatedAt }: { agreementCode: string; updatedAt?: string }) {
  return (
    <View style={styles.footerFixed} fixed>
      <View style={styles.footerDivider} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ width: '55%' }}>
          <Text style={[styles.footerText, { color: PRIMARY, fontWeight: 'bold' }]}>Interior Concepts Studio</Text>
          <Text style={styles.footerText}>TA-174/1, Unit 4A, 3rd Floor(Lift-3) Khonikachroy, South Badda Lake View Road, Dhaka-1212</Text>
        </View>
        <View style={{ width: '45%', alignItems: 'flex-end' }}>
          <Text style={styles.footerText}>+880 1334-935530, +880 1334-935531</Text>
          <Text style={[styles.footerText, { color: PRIMARY, fontWeight: 'bold' }]}>interiorconceptsstudio.com</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}>
        <Text style={styles.footerMeta}>Agreement ID: {agreementCode}</Text>
        <Text
          style={styles.footerMeta}
          render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `Page ${pageNumber} of ${totalPages}`}
        />
      </View>
    </View>
  )
}

export type AgreementPdfProps = AgreementData

export function AgreementDocument(props: AgreementPdfProps) {
  const agreementCode = props.workOrderId || `AGR-${props.clientId || '001'}`

  // Group items by Area for Detail Quotation section
  const areaGroups = new Map<string, typeof props.items>()
  ;(props.items || []).forEach((item) => {
    const area = item.areaName || 'General Interior Works'
    if (!areaGroups.has(area)) areaGroups.set(area, [])
    areaGroups.get(area)!.push(item)
  })

  return (
    <Document>
      {/* ============================================================== */}
      {/* 1. INTRO LETTER (WORK ORDER)                                   */}
      {/* ============================================================== */}
      <Page size="A4" style={styles.page}>
        <Watermark />
        <PageHeader title="WORK ORDER" refNo={props.referenceNo} date={props.agreementDate} />

        {/* Work Order Info Box */}
        <View style={styles.metaCard}>
          <View style={styles.metaCardRow}>
            <Text style={styles.metaCardKey}>Work Order ID:</Text>
            <Text style={styles.metaCardVal}>{props.workOrderId}</Text>
          </View>
          <View style={styles.metaCardRow}>
            <Text style={styles.metaCardKey}>Reference:</Text>
            <Text style={styles.metaCardVal}>{props.referenceNo}</Text>
          </View>
          <View style={styles.metaCardRow}>
            <Text style={styles.metaCardKey}>Date of Award:</Text>
            <Text style={styles.metaCardVal}>{props.agreementDate}</Text>
          </View>
        </View>

        {/* To Recipient */}
        <View style={{ marginBottom: 12 }}>
          <Text style={[styles.bold, { fontSize: 10, color: PRIMARY }]}>{props.companyName}</Text>
          <Text style={styles.paragraph}>{props.companyAddress}</Text>
          <Text style={styles.paragraph}>Phone: {props.companyPhones}</Text>
        </View>

        {/* Subject */}
        <View style={{ backgroundColor: '#f3f8f7', padding: 6, borderLeftWidth: 3, borderLeftColor: PRIMARY, marginBottom: 12 }}>
          <Text style={[styles.bold, { fontSize: 8.5, color: PRIMARY, letterSpacing: 0.5 }]}>
            {props.introSubject}
          </Text>
        </View>

        {/* Letter Body */}
        <Text style={[styles.bold, { fontSize: 9, marginBottom: 6, color: PRIMARY }]}>{props.introSalutation}</Text>
        <Text style={styles.paragraph}>{props.introAwardText}</Text>
        <Text style={styles.paragraph}>{props.introTermsText}</Text>
        <Text style={styles.paragraph}>{props.introCommenceText}</Text>
        <Text style={styles.paragraph}>{props.introAcceptanceText}</Text>

        <Text style={[styles.paragraph, { marginTop: 10, fontWeight: 'bold' }]}>Thanking you—</Text>

        {/* Signatures on Intro Letter */}
        <View style={styles.signatureRow}>
          <View style={styles.signatureColTwo}>
            <Text style={styles.sigName}>{props.clientName}</Text>
            <Text style={styles.sigRole}>Owner (Project)</Text>
          </View>
          <View style={styles.signatureColTwo}>
            <Text style={styles.sigName}>{props.officeAdminName || 'Office Admin'}</Text>
            <Text style={styles.sigRole}>{props.officeAdminDesignation}, {props.companyName}</Text>
          </View>
        </View>

        {/* Acceptance Note */}
        <View style={styles.acceptanceBox}>
          <Text style={[styles.bold, { fontSize: 8, color: PRIMARY, marginBottom: 2 }]}>
            Accepted by {props.companyName}:
          </Text>
          <Text style={{ fontSize: 8, color: '#333333' }}>
            Name: <Text style={styles.bold}>{props.ceoName}</Text>  |  Designation: <Text style={styles.bold}>{props.ceoDesignation}</Text>
          </Text>
        </View>

        <PageFooter agreementCode={agreementCode} updatedAt={props.updatedAt} />
      </Page>

      {/* ============================================================== */}
      {/* 2. AGREEMENT SUMMARY & PREAMBLE                                */}
      {/* ============================================================== */}
      <Page size="A4" style={styles.page}>
        <Watermark />
        <PageHeader title="AGREEMENT PAPER" refNo={props.referenceNo} date={props.agreementDate} />

        <Text style={styles.sectionTitle}>THIS AGREEMENT</Text>
        <Text style={[styles.paragraph, { textAlign: 'center', marginBottom: 10 }]}>
          THIS AGREEMENT is made at {props.agreementPlace} dated <Text style={styles.bold}>{props.agreementDate}</Text>.
        </Text>

        {/* Parties Card */}
        <View style={styles.metaCard}>
          <Text style={[styles.bold, { fontSize: 9, color: PRIMARY, marginBottom: 4 }]}>BETWEEN</Text>
          <Text style={[styles.paragraph, { marginBottom: 8 }]}>
            <Text style={styles.bold}>{props.clientName}</Text>, Owner of the Apartment at{' '}
            <Text style={styles.bold}>{props.siteAddress}</Text> (hereinafter referred to as the &quot;Owner&quot;) of the ONE PART.
          </Text>

          <Text style={[styles.bold, { fontSize: 9, color: PRIMARY, marginBottom: 4 }]}>AND</Text>
          <Text style={[styles.paragraph, { marginBottom: 2 }]}>
            <Text style={styles.bold}>{props.companyName}</Text>, having registered address at {props.companyAddress}, Trade License No: {props.tradeLicenseNo}, TIN: {props.tinNo}, represented by Mr. <Text style={styles.bold}>{props.ceoName}</Text>, Designation: {props.ceoDesignation}, NID No: {props.ceoNid} (hereinafter referred to as the &quot;Consultant&quot;) of the OTHER PART.
          </Text>
        </View>

        {/* Recitals */}
        <Text style={styles.subSectionTitle}>Recitals & Scope</Text>
        <Text style={styles.paragraph}>{props.whereasText1}</Text>
        <Text style={styles.paragraph}>{props.whereasText2}</Text>
        <Text style={[styles.bold, { fontSize: 8.5, color: PRIMARY, marginTop: 4, marginBottom: 4 }]}>
          NOW IT IS AGREED BY AND BETWEEN BOTH PARTIES AS FOLLOWS:
        </Text>
        <Text style={styles.paragraph}>{props.agreementScopeText}</Text>

        {/* ============================================================== */}
        {/* 3. QUOTATION SUMMARY & PAYMENT SCHEDULE                        */}
        {/* ============================================================== */}
        <Text style={[styles.sectionTitle, { marginTop: 14 }]}>Quotation Summary and Payment Schedule</Text>

        <Text style={styles.subSectionTitle}>Project Costing Summary</Text>
        <View style={styles.tHead}>
          <Text style={[styles.thCol, { width: '10%', textAlign: 'center' }]}>SL</Text>
          <Text style={[styles.thCol, { width: '65%' }]}>ITEM NAME</Text>
          <Text style={[styles.thCol, styles.thColLast, { width: '25%', textAlign: 'right' }]}>TOTAL</Text>
        </View>
        <View style={styles.tRow}>
          <Text style={[styles.tdCol, { width: '10%', textAlign: 'center' }]}>01</Text>
          <Text style={[styles.tdCol, { width: '65%' }]}>Interior Work and Fixed Furniture</Text>
          <Text style={[styles.tdCol, styles.tdColLast, styles.bold, { width: '25%', textAlign: 'right' }]}>
            {props.interiorWorkTotal.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={styles.grandTotalBar}>
          <Text style={[styles.bold, { fontSize: 9, color: PRIMARY }]}>GRAND TOTAL</Text>
          <Text style={[styles.bold, { fontSize: 9, color: PRIMARY }]}>
            {props.grandTotal.toLocaleString('en-IN')} BDT
          </Text>
        </View>
        <Text style={styles.inWordsText}>In Words: {props.inWordsText}</Text>
        <Text style={[styles.paragraph, { fontSize: 7.5, color: '#666666', marginTop: 2 }]}>
          {props.projectCostSummaryNote}
        </Text>

        {/* Payment Schedule Table */}
        <Text style={[styles.subSectionTitle, { marginTop: 10 }]}>Payment Schedule</Text>
        <View style={styles.tHead}>
          <Text style={[styles.thCol, { width: '10%', textAlign: 'center' }]}>SL</Text>
          <Text style={[styles.thCol, { width: '70%' }]}>Payment Mode</Text>
          <Text style={[styles.thCol, styles.thColLast, { width: '20%', textAlign: 'center' }]}>Percentage</Text>
        </View>
        {(props.paymentSchedule || []).map((step, idx) => (
          <View key={step.sl || idx} style={[styles.tRow, idx % 2 === 1 ? styles.tRowAlt : {}]}>
            <Text style={[styles.tdCol, { width: '10%', textAlign: 'center' }]}>{step.sl}</Text>
            <View style={[styles.tdCol, { width: '70%' }]}>
              <Text style={styles.bold}>{step.milestone}</Text>
              {step.details ? <Text style={{ fontSize: 7.5, color: '#555555' }}>{step.details}</Text> : null}
            </View>
            <Text style={[styles.tdCol, styles.tdColLast, styles.bold, { width: '20%', textAlign: 'center' }]}>
              {step.percentage}
            </Text>
          </View>
        ))}

        {/* Duration of Work */}
        <Text style={[styles.subSectionTitle, { marginTop: 10 }]}>Duration of Work</Text>
        <Text style={styles.paragraph}>{props.durationText}</Text>
        <Text style={[styles.paragraph, { fontSize: 7.8, color: '#555555' }]}>{props.durationDiscussionsText}</Text>

        <PageFooter agreementCode={agreementCode} updatedAt={props.updatedAt} />
      </Page>

      {/* ============================================================== */}
      {/* 4. DETAIL QUOTATION (THE TABLE DATA ONLY)                      */}
      {/* ============================================================== */}
      <Page size="A4" style={styles.page}>
        <Watermark />
        <PageHeader title="DETAIL QUOTATION TABLE" refNo={props.referenceNo} date={props.agreementDate} />

        <Text style={styles.sectionTitle}>
          Description of Work, Materials Specification, Quantity/Size, Rate
        </Text>

        <View style={styles.tHead}>
          <Text style={[styles.thCol, { width: '6%', textAlign: 'center' }]}>SL</Text>
          <Text style={[styles.thCol, { width: '18%' }]}>NAME</Text>
          <Text style={[styles.thCol, { width: '42%' }]}>MATERIALS & SPECIFICATIONS</Text>
          <Text style={[styles.thCol, { width: '10%', textAlign: 'center' }]}>QTY/SFT</Text>
          <Text style={[styles.thCol, { width: '12%', textAlign: 'right' }]}>UNIT PRICE</Text>
          <Text style={[styles.thCol, styles.thColLast, { width: '12%', textAlign: 'right' }]}>TOTAL</Text>
        </View>

        {Array.from(areaGroups.entries()).map(([areaTitle, lines], gIdx) => (
          <View key={areaTitle || gIdx}>
            <View style={styles.areaHeaderRow}>
              <Text style={styles.areaHeaderText}>{areaTitle}</Text>
            </View>
            {lines.map((line, lIdx) => (
              <View key={line.sl || lIdx} style={[styles.tRow, lIdx % 2 === 1 ? styles.tRowAlt : {}]}>
                <Text style={[styles.tdCol, { width: '6%', textAlign: 'center' }]}>{line.sl}</Text>
                <Text style={[styles.tdCol, styles.bold, { width: '18%' }]}>{line.name}</Text>
                <Text style={[styles.tdCol, { width: '42%', fontSize: 7.5, color: '#333333' }]}>
                  {line.materials}
                </Text>
                <Text style={[styles.tdCol, { width: '10%', textAlign: 'center' }]}>{line.qtySft}</Text>
                <Text style={[styles.tdCol, { width: '12%', textAlign: 'right' }]}>{line.unitPrice}</Text>
                <Text style={[styles.tdCol, styles.tdColLast, styles.bold, { width: '12%', textAlign: 'right' }]}>
                  {line.total.toLocaleString('en-IN')}
                </Text>
              </View>
            ))}
          </View>
        ))}

        {/* Detail Quotation Summary Rows */}
        <View style={styles.tRow}>
          <Text style={[styles.tdCol, { width: '6%', textAlign: 'center' }]}>01</Text>
          <Text style={[styles.tdCol, styles.bold, { width: '70%' }]}>INTERIOR WORK TOTAL</Text>
          <Text style={[styles.tdCol, styles.tdColLast, styles.bold, { width: '24%', textAlign: 'right' }]}>
            {props.interiorWorkTotal.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={styles.grandTotalBar}>
          <Text style={[styles.bold, { fontSize: 9, color: PRIMARY }]}>TOTAL AMOUNT:</Text>
          <Text style={[styles.bold, { fontSize: 9, color: PRIMARY }]}>
            {props.grandTotal.toLocaleString('en-IN')} BDT
          </Text>
        </View>
        <Text style={styles.inWordsText}>In Words: {props.inWordsText}</Text>

        <PageFooter agreementCode={agreementCode} updatedAt={props.updatedAt} />
      </Page>

      {/* ============================================================== */}
      {/* 5. AGREEMENT CONDITIONS & 6. SIGNATURE                         */}
      {/* ============================================================== */}
      <Page size="A4" style={styles.page}>
        <Watermark />
        <PageHeader title="TERMS & CONDITIONS" refNo={props.referenceNo} date={props.agreementDate} />

        <Text style={styles.sectionTitle}>Agreement Conditions</Text>

        <Text style={styles.clauseTitle}>Provisions Regarding Working Procedure</Text>
        <Text style={styles.clauseBody}>{props.workingProcedureText}</Text>

        <Text style={styles.clauseTitle}>Site Inspection</Text>
        <Text style={styles.clauseBody}>{props.siteInspectionText}</Text>

        <Text style={styles.clauseTitle}>Defective Work / Materials</Text>
        <Text style={styles.clauseBody}>{props.defectiveWorkText}</Text>

        <Text style={styles.clauseTitle}>Inspection of Work</Text>
        <Text style={styles.clauseBody}>{props.inspectionOfWorkText}</Text>

        <Text style={styles.clauseTitle}>Clerical Errors to be Rectified</Text>
        <Text style={styles.clauseBody}>{props.clericalErrorsText}</Text>

        <Text style={styles.clauseTitle}>Dispute Resolution</Text>
        <Text style={styles.clauseBody}>{props.disputeResolutionText}</Text>

        <Text style={styles.clauseTitle}>Jurisdiction</Text>
        <Text style={styles.clauseBody}>{props.jurisdictionText}</Text>

        <Text style={styles.clauseTitle}>Warranty</Text>
        <Text style={styles.clauseBody}>{props.warrantyText}</Text>
        <Text style={styles.clauseBody}>{props.warrantyExclusionsText}</Text>

        <Text style={styles.clauseTitle}>Taxes and VAT</Text>
        <Text style={styles.clauseBody}>{props.taxesAndVatText}</Text>

        <PageFooter agreementCode={agreementCode} updatedAt={props.updatedAt} />
      </Page>

      {/* Continuation of conditions and final signatures */}
      <Page size="A4" style={styles.page}>
        <Watermark />
        <PageHeader title="TERMS & SIGNATURE" refNo={props.referenceNo} date={props.agreementDate} />

        <Text style={styles.subSectionTitle}>Other Terms & Conditions</Text>
        {(props.otherTerms || []).map((term, index) => (
          <View key={index} style={{ flexDirection: 'row', marginBottom: 3, paddingLeft: 4 }}>
            <Text style={{ width: 18, fontSize: 7.5, fontWeight: 'bold', color: PRIMARY }}>
              {String(index + 1).padStart(2, '0')}.
            </Text>
            <Text style={{ flex: 1, fontSize: 7.8, color: '#333333', lineHeight: 1.35, textAlign: 'justify' }}>
              {term}
            </Text>
          </View>
        ))}

        {/* 6. SIGNATURE SECTION */}
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Execution & Witnesses</Text>
        <Text style={[styles.paragraph, { textAlign: 'center', fontStyle: 'italic', marginBottom: 25 }]}>
          IN WITNESS WHEREOF, each of the Parties hereto has caused this Agreement to be executed by its duly authorized officers or representatives as of the date first written above in the presence of WITNESSES.
        </Text>

        <View style={styles.signatureRow}>
          <View style={styles.signatureCol}>
            <Text style={styles.sigName}>{props.clientName}</Text>
            <Text style={styles.sigRole}>{props.witness1Title}</Text>
          </View>
          <View style={styles.signatureCol}>
            <Text style={styles.sigName}>{props.officeAdminName || 'Office Admin'}</Text>
            <Text style={styles.sigRole}>{props.witness2Title}</Text>
          </View>
          <View style={styles.signatureCol}>
            <Text style={styles.sigName}>{props.ceoName}</Text>
            <Text style={styles.sigRole}>{props.witness3Title}</Text>
          </View>
        </View>

        <PageFooter agreementCode={agreementCode} updatedAt={props.updatedAt} />
      </Page>
    </Document>
  )
}
