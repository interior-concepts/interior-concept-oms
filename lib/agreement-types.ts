import type { QuotationDraftContent } from '@/lib/quotation-types'
import { amountInWordsTaka } from '@/lib/number-to-words'
import { buildDetailFloorSummaries } from '@/lib/detail-quotation-format'

export type PaymentScheduleItem = {
  sl: string
  milestone: string
  details?: string
  percentage: string // e.g. "60%"
  amount?: number
}

export type AgreementDetailItem = {
  sl: string
  areaName?: string
  name: string
  materials: string
  qtySft: string
  unitPrice: string
  total: number
}

export type AgreementData = {
  id?: string
  leadId: string
  clientId: number
  
  // Meta
  workOrderId: string
  referenceNo: string
  agreementDate: string
  agreementType: string
  
  // Client & Project Info
  clientName: string
  clientPhone: string
  siteAddress: string
  projectSqft?: number | null
  
  // Company Info
  companyName: string
  companyAddress: string
  companyPhones: string
  tradeLicenseNo: string
  tinNo: string
  ceoName: string
  ceoDesignation: string
  ceoNid: string
  officeAdminName: string
  officeAdminDesignation: string
  
  // 1. Intro Letter
  introSubject: string
  introSalutation: string
  introAwardText: string
  introTermsText: string
  introCommenceText: string
  introAcceptanceText: string
  
  // 2. Agreement Summary & Preamble
  agreementPlace: string
  whereasText1: string
  whereasText2: string
  agreementScopeText: string
  
  // 3. Quotation Summary and Payment Schedule
  projectCostSummaryNote: string
  paymentSchedule: PaymentScheduleItem[]
  durationWorkingDays: number
  durationWorkingDaysWords: string
  durationText: string
  durationDiscussionsText: string
  
  // 4. Detail Quotation Items & Totals
  items: AgreementDetailItem[]
  interiorWorkTotal: number
  grandTotal: number
  inWordsText: string
  
  // 5. Agreement Conditions
  workingProcedureText: string
  siteInspectionText: string
  defectiveWorkText: string
  inspectionOfWorkText: string
  clericalErrorsText: string
  disputeResolutionText: string
  jurisdictionText: string
  warrantyText: string
  warrantyExclusionsText: string
  taxesAndVatText: string
  otherTerms: string[]
  
  // 6. Signatures
  witness1Title: string
  witness2Title: string
  witness3Title: string
  
  updatedAt?: string
}

function formatDateDisplay(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatDateCompact(date: Date = new Date()): string {
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  return `${d}${m}${y}`
}

export function buildDefaultAgreementData(
  lead: {
    id: string
    clientId: number
    name: string
    phone?: string | null
    location?: string | null
    agreementType?: string | null
    agreementValue?: number | null
    projectSqft?: number | null
    srCrm?: { fullName?: string | null } | null
  },
  detailDraftContent?: QuotationDraftContent | null
): AgreementData {
  const now = new Date()
  const dateFormatted = formatDateDisplay(now)
  const dateCode = formatDateCompact(now)
  const clientCleanName = lead.name || 'Client'
  const safeNamePart = clientCleanName.replace(/[^a-zA-Z0-9]/g, ' ').trim().replace(/\s+/g, ' ')
  const siteLocation = lead.location || 'Project Site, Dhaka'

  // Extract detail items if quotation draft exists
  const items: AgreementDetailItem[] = []
  let calculatedGrandTotal = 0

  if (detailDraftContent && detailDraftContent.lineItems && detailDraftContent.lineItems.length > 0) {
    const floorSummaries = buildDetailFloorSummaries(detailDraftContent)
    const sectionMap = new Map((detailDraftContent.sections || []).map((s) => [s.id, s.name]))
    let serialCounter = 1

    floorSummaries.forEach((floorSummary) => {
      const floorAreas = [...(detailDraftContent.areas ?? [])]
        .filter((area) => area.floorId === floorSummary.floor.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)

      if (floorAreas.length === 0) {
        floorSummary.lines.forEach((line) => {
          const qtyStr = line.unit === 'ls' ? '1 Package' : `${line.quantity} ${line.unit || 'sqft'}`
          const itemName = sectionMap.get(line.sectionId) || line.description || 'Custom Interior Item'
          const materialsText = line.materials || line.description || 'Architect Grade MR Highly Compressed Engineered Board with accessories.'
          items.push({
            sl: String(serialCounter++).padStart(2, '0'),
            areaName: floorSummary.floor.name,
            name: itemName,
            materials: materialsText,
            qtySft: qtyStr,
            unitPrice: line.rate > 0 ? line.rate.toLocaleString('en-IN') : 'Package',
            total: line.amount,
          })
          calculatedGrandTotal += line.amount
        })
      } else {
        floorAreas.forEach((area) => {
          const areaLines = floorSummary.lines.filter((l) => l.areaId === area.id)
          areaLines.forEach((line) => {
            const qtyStr = line.unit === 'ls' ? '1 Package' : `${line.quantity} ${line.unit || 'sqft'}`
            const itemName = sectionMap.get(line.sectionId) || line.description || 'Custom Interior Item'
            const materialsText = line.materials || line.description || 'Architect Grade MR Highly Compressed Engineered Board with accessories.'
            items.push({
              sl: String(serialCounter++).padStart(2, '0'),
              areaName: `${floorSummary.floor.name} - ${area.name}`,
              name: itemName,
              materials: materialsText,
              qtySft: qtyStr,
              unitPrice: line.rate > 0 ? line.rate.toLocaleString('en-IN') : 'Package',
              total: line.amount,
            })
            calculatedGrandTotal += line.amount
          })
        })
      }
    })
  }

  // Fallback to agreementValue or budget if no detail items
  const finalTotal = calculatedGrandTotal > 0 ? calculatedGrandTotal : (lead.agreementValue || 1435100)

  if (items.length === 0) {
    items.push({
      sl: '01',
      areaName: 'Comprehensive Interior Scope',
      name: 'Interior Work and Fixed Furniture',
      materials: 'Supplying & Making of 18mm High Pressure laminated Imported Architect Grade MR (Moisture Resistant) Highly Compressed Engineered Board with factory UV edging and smart soft-close hardware.',
      qtySft: '1 Package',
      unitPrice: finalTotal.toLocaleString('en-IN'),
      total: finalTotal,
    })
  }

  const inWords = `${amountInWordsTaka(finalTotal)} Taka Only.`

  return {
    leadId: lead.id,
    clientId: lead.clientId,
    workOrderId: `WRK - ${safeNamePart} - ${dateCode}`,
    referenceNo: `RD/Dhaka/${dateCode}`,
    agreementDate: dateFormatted,
    agreementType: lead.agreementType || 'FITOUT_AGREEMENT',

    clientName: clientCleanName,
    clientPhone: lead.phone || '',
    siteAddress: siteLocation,
    projectSqft: lead.projectSqft || null,

    companyName: 'INTERIOR CONCEPTS',
    companyAddress: '3rd Floor, 174/1 Lake View Road, Gulshan 1, Dhaka-1212, Bangladesh',
    companyPhones: '01334-935531, 01334-935532',
    tradeLicenseNo: 'TRAD/DNCC/048385/2025',
    tinNo: '469560437683',
    ceoName: 'Shopi Ullah Rashed',
    ceoDesignation: 'Chief Executive Officer',
    ceoNid: '7762979297',
    officeAdminName: lead.srCrm?.fullName || 'Tusher Imran',
    officeAdminDesignation: 'Office Admin',

    // 1. Intro Letter
    introSubject: `WORK ORDER FOR INTERIOR WORKS PROJECT LOCATED AT ${siteLocation.toUpperCase()}.`,
    introSalutation: 'Dear Interior Concepts,',
    introAwardText: `I am, ${clientCleanName}, am pleased to inform you that your company has been awarded the “Work Order” for the subject project based on your submitted quotation and subsequent evaluation.`,
    introTermsText: 'This Work Order shall be governed by the agreed terms and conditions, approved rates, specifications, and all related documents. The Terms & Conditions, Schedule of Rates, and Consultant’s Declaration shall form an integral and inseparable part of this Work Order.',
    introCommenceText: 'You are hereby requested to commence the work immediately in close coordination with the Project Engineer-in-Charge and/or the Consultant assigned to the project. All works shall be executed in accordance with the approved drawings, specifications, project requirements, and instructions issued by the Engineer-in-Charge.',
    introAcceptanceText: 'Kindly sign and return the duplicate copy of this Work Order as a token of your acceptance of all terms and conditions stated herein.',

    // 2. Agreement Summary
    agreementPlace: 'Dhaka',
    whereasText1: `WHEREAS the Owner is desirous of getting the Interior Design, Work and Execution for their proposed flat at ${siteLocation}`,
    whereasText2: 'AND WHEREAS the Consultant is a Design and Build Contractor and is having vast experience in interior turnkey works and has agreed to do the interior works in the above-mentioned site.',
    agreementScopeText: 'That the Interior Concepts shall carry out, Design, Built, Supply, Installation & Complete the Interior work furnishing on the terms and conditions herein contained and Schedule of rates and plan, and instructions to be given by and under the supervision of and to the entire satisfaction of the Owner\'s authorized representative. The description of the work and terms of contract are as under:',

    // 3. Costing & Payment Schedule
    projectCostSummaryNote: 'Note: This costing is made without VAT and Tax.',
    paymentSchedule: [
      {
        sl: '01',
        milestone: 'Advance',
        details: 'Upon signing of this Agreement and work commencement',
        percentage: '60%',
      },
      {
        sl: '02',
        milestone: 'After completion 50% work',
        details: '(After finishing the ceiling and wall paneling work)',
        percentage: '30%',
      },
      {
        sl: '03',
        milestone: 'After completion 80% work',
        details: '(After entering all the cabinet at projects and before installing)',
        percentage: '10%',
      },
    ],
    durationWorkingDays: 90,
    durationWorkingDaysWords: 'Ninety',
    durationText: 'The project work shall be completed within Ninety (90) working days from the date of formal project receiving. The project handover date shall be considered as three (3) days after the completion of the Project Receiving Formalities and official project handover by the Client.',
    durationDiscussionsText: 'However, if the project handover date changes depending on the agreed payment schedule, political situation, and overall site and environmental conditions, it will be decided through discussions between both parties.',

    // 4. Detail Quotation Items
    items,
    interiorWorkTotal: finalTotal,
    grandTotal: finalTotal,
    inWordsText: inWords,

    // 5. Conditions
    workingProcedureText: 'The work will be completed based on time schedule. If additional work apart from this agreement, all kinds of additional cost will be applied. If any item of this work agreement is deducted, then those work item costs will be deducted from the final bill.',
    siteInspectionText: 'Interior Concepts confirms that he/they has/have inspected the Site before submitting the proposal and has satisfied himself as to the nature of the work to be executed on the site. Any difficulties which the Contractor may come across in the course of the work shall neither in any way relieve him from fulfilling the terms of this agreement nor entitle him to claim or receive extra payment, unless the Firm/Company\'s authorized representative is of the opinion that such difficulties could not have been foreseen.',
    defectiveWorkText: 'If any part of the work done by the Interior Concepts shall be found defective in workmanship or if bad or inferior materials have been used. The Contractor shall at his own risk and costs demolish all such defective work and rebuild the same and/or replace the bad or interior materials used, to the satisfaction of the Owner\'s authorized representative. The decision of the Company\'s authorized representative in this regard shall be final and binding on the Contractor.',
    inspectionOfWorkText: 'During progress of the work, the Site Engineer/Consultant/ Architect or any other representative of the Owner shall be entitled at all times to have access to and inspect the work.',
    clericalErrorsText: 'Neither party shall take any advantage of any clerical error or mistake which may creep in or occur in the specifications, schedule of rates, plans instructions tenders or any other papers supplied to or by the Contractor in connection with the work, but such clerical error or mistake shall be brought to the notice by the one to the other without any loss of time and same shall be rectified.',
    disputeResolutionText: 'All disputes or differences relating to the specifications, designs, drawings and as to quality of workmanship or material used in the work or as to any other question arising out of or relating to the contract, design, drawings, specifications, orders or otherwise in connection with the agreement or the carrying out of the works, whether during the progress of the work or after the completion or abandonment thereof shall be referred to the sole arbitrator appointed by the owner. The parties would cooperate and lead evidence, etc. with the arbitrators and if the contractor or its authorized representative does not cooperate or remains absent at the reference, the arbitrator would be at liberty to proceed with the reference ex-parte.',
    jurisdictionText: 'This agreement shall be deemed to have been made in Dhaka and shall be construed according to the laws of Bangladesh and the performance by the Contractor of and act on his part herein contained shall be considered due in Dhaka for the purpose of Jurisdiction.',
    warrantyText: 'We will provide one year service warranty from the date of completion and acceptance of the Services, it shall, at its own cost and expense, promptly correct or repair any portion of the Services found to be defective, provided that the Client gives written notice of such defect during the Warranty Period.',
    warrantyExclusionsText: 'This warranty applies only to defects arising from the Service Provider\'s workmanship, materials supplied by the Service Provider (if applicable). The warranty does not cover defects, failures, or damages resulting from misuse, unauthorized modifications, improper maintenance, normal wear and tear, accidents, force majeure events, or actions or omissions of the Client or any third party.',
    taxesAndVatText: 'Agreement prices are exclusive of VAT and TAX. Clients shall pay 15% VAT and up to 5% Advance Income Tax (AIT) as per Bangladesh Government law and submit payment receipts to Interior Concepts.',
    otherTerms: [
      'Interior Concepts will supervise, monitor and direct all electric points properly to the Owner’s appointed Electrician before starting the Interior Work.',
      'Interior Concepts shall supply all necessary tools, plants etc. requisite for carrying out any items of work.',
      'Interior Concepts will complete the interior work as per the work schedule made by the Consultant of the Project and coordinate with other contractors involved in the Project such as- Tiles Contractor, Color Contractor, Electric and Plumbing Contractor etc.',
      'All Workmanship must be of good standard and acceptable to Engineer-in-Charge/Consultant.',
      'The rates allowed in the schedule are inclusive of carrying all materials from point of unloading and staking yard to working place at any height or distance within the project perimeters.',
      'The authority reserves every right to cancel the work order if Interior Concepts fails to achieve the expected progress or make delay in work progress or mobilize the required work force or is found violating the instruction passed by authority or its representative.',
      'No intermediate enhancement in rates will be allowed till the completion of the project.',
      'An incidental expense is to be borne by the contractor. Customers will not pay any compensation to the workers either injured or dead during work for negligence etc. The contractor will be fully responsible for ensuring the safety and security of the workers employed and will be liable for any compensation that may be claimed.',
      'Interior Concepts must ensure that he or his workers do not involve themselves in any kind of antisocial activities.',
      'Any fault or defective work done by the contractor shall be rectified by the contractor at his own cost. The contractor should ratify his bad qualities of work and after rectifying his work up to the work of quantities his bill should be generated.',
      'Rate of any non-schedule items of work (if any) shall be settled by both the parties as per market rates.',
      'Running Bills will be prepared by contractor and site Engineer jointly after completion of a targeted stage during the satisfactory progress of works.',
      'Payment will be submitted after material approval as per Engineer in Charge/Consultant.',
      'Materials must be best quality and approved by the owner.',
    ],

    // 6. Signatures
    witness1Title: 'Owner (Project)',
    witness2Title: 'Office Admin, Interior Concepts',
    witness3Title: 'Chief Executive Officer, Interior Concepts',
  }
}
