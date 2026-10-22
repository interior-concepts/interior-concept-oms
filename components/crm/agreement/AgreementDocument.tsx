'use client'

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1f2937',
    lineHeight: 1.5,
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 15,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  companyTagline: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
  },
  agreementTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
    textAlign: 'right',
    textTransform: 'uppercase',
  },
  referenceText: {
    fontSize: 9,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 4,
  },
  metaSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metaColumn: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 8,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginTop: 10,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  paragraph: {
    fontSize: 9.5,
    color: '#334155',
    marginBottom: 8,
    textAlign: 'justify',
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 8,
  },
  bulletDot: {
    width: 12,
    fontSize: 10,
    color: '#2563eb',
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    color: '#334155',
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    paddingTop: 20,
  },
  signatureBox: {
    width: '45%',
    borderTopWidth: 1,
    borderTopColor: '#94a3b8',
    paddingTop: 8,
    alignItems: 'center',
  },
  signatureLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#334155',
  },
  signatureSubLabel: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
})

export type AgreementPdfProps = {
  clientName: string
  clientPhone?: string | null
  clientLocation?: string | null
  agreementType: string
  agreementValue?: number | null
  projectSqft?: number | null
  dateStr: string
  srCrmName?: string | null
  visualizerName?: string | null
  agreementCode?: string
}

export function AgreementDocument({
  clientName,
  clientPhone,
  clientLocation,
  agreementType,
  agreementValue,
  projectSqft,
  dateStr,
  srCrmName,
  visualizerName,
  agreementCode,
}: AgreementPdfProps) {
  const isDesign = agreementType.toUpperCase().includes('DESIGN')
  const typeDisplay = isDesign ? 'Design Agreement' : 'Fitout Agreement'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>AESTHETIC INTERIOR</Text>
            <Text style={styles.companyTagline}>Architectural & Interior Design Consultancy</Text>
          </View>
          <View>
            <Text style={styles.agreementTitle}>{typeDisplay}</Text>
            <Text style={styles.referenceText}>
              Ref: {agreementCode || `AGR-${Math.floor(100000 + Math.random() * 900000)}`}
            </Text>
            <Text style={styles.referenceText}>Date: {dateStr}</Text>
          </View>
        </View>

        {/* Client & Project Details */}
        <View style={styles.metaSection}>
          <View style={styles.metaColumn}>
            <Text style={styles.metaLabel}>Client Information</Text>
            <Text style={styles.metaValue}>{clientName}</Text>
            <Text style={styles.metaLabel}>Contact Number</Text>
            <Text style={styles.metaValue}>{clientPhone || 'N/A'}</Text>
            <Text style={styles.metaLabel}>Site / Project Location</Text>
            <Text style={styles.metaValue}>{clientLocation || 'N/A'}</Text>
          </View>

          <View style={styles.metaColumn}>
            <Text style={styles.metaLabel}>Agreement Type</Text>
            <Text style={styles.metaValue}>{typeDisplay}</Text>
            <Text style={styles.metaLabel}>Agreement Value</Text>
            <Text style={styles.metaValue}>
              {agreementValue ? `${agreementValue.toLocaleString()} BDT` : 'To be finalized'}
            </Text>
            <Text style={styles.metaLabel}>Project Size (Sqft)</Text>
            <Text style={styles.metaValue}>{projectSqft ? `${projectSqft} Sqft` : 'N/A'}</Text>
          </View>

          <View style={styles.metaColumn}>
            <Text style={styles.metaLabel}>Managing SR CRM</Text>
            <Text style={styles.metaValue}>{srCrmName || 'Assigned Consultant'}</Text>
            <Text style={styles.metaLabel}>Assigned 3D Visualizer</Text>
            <Text style={styles.metaValue}>{visualizerName || 'Design Team Member'}</Text>
            <Text style={styles.metaLabel}>Status</Text>
            <Text style={styles.metaValue}>Confirmed & Pending Execution</Text>
          </View>
        </View>

        {/* Scope of Agreement */}
        <Text style={styles.sectionTitle}>1. Scope of Engagement</Text>
        <Text style={styles.paragraph}>
          This Agreement is entered into between Aesthetic Interior (hereafter referred to as the &quot;Company&quot;) and the
          Client named above. The Company agrees to provide comprehensive architectural, interior design, and/or turnkey
          fitout consultation services based on mutual requirements discussed during consultation.
        </Text>

        <Text style={styles.sectionTitle}>2. Key Deliverables & Responsibilities</Text>
        <View style={styles.bulletPoint}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>
            Full 3D visualization and perspective views delivered by the assigned 3D Visualizer team.
          </Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>
            Detailed architectural layout and technical planning approval iterations as agreed.
          </Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>
            Transparent material specification sheet and revised BOQ/Quotation breakdown.
          </Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>
            Regular progress coordination with Senior CRM team throughout project execution.
          </Text>
        </View>

        {/* Terms & Financials */}
        <Text style={styles.sectionTitle}>3. Terms of Payment & Execution</Text>
        <Text style={styles.paragraph}>
          The total agreed consideration for the specified scope is{' '}
          {agreementValue ? `${agreementValue.toLocaleString()} BDT` : 'as stipulated in official invoice'}. Payment
          milestones are to be disbursed in according tranches as per scheduled deliverables. Any deviation or additional
          work requested by the client shall be billed as an extra scope addendum.
        </Text>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Client Signature</Text>
            <Text style={styles.signatureSubLabel}>{clientName}</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Authorized Signature</Text>
            <Text style={styles.signatureSubLabel}>For Aesthetic Interior</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          This document is an official agreement record generated by Aesthetic Interior OMS CRM. Valid upon mutual endorsement.
        </Text>
      </Page>
    </Document>
  )
}
