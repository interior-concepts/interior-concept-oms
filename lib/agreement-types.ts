import type { QuotationDraftContent, QuotationTotals } from '@/lib/quotation-types'
import { amountInWordsTaka } from '@/lib/number-to-words'
import { buildDetailFloorSummaries } from '@/lib/detail-quotation-format'
import { calculateQuotationTotals } from '@/lib/quotation-calculations'

export type PaymentScheduleItem = {
  sl: string
  milestone: string
  details?: string
  percentage: string // e.g. "20 %"
  amount?: number | string
}

export type AgreementPaymentStage = {
  stage: string
  percentage: string
  amount: string
  fraction?: number
}

export type AgreementClauseGroup = {
  title: string
  clauses: string[]
}

export type AgreementSummaryRow = {
  sl: string
  itemName: string
  total: number | string
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

  // Meta & Identifiers
  workOrderId: string
  subContractId: string
  reference: string
  referenceNo?: string
  agreementDate: string
  agreementType: string
  agreementValue: number | string

  // Client & Project Info
  projectName: string
  clientName: string
  ownerName: string
  clientPhone: string
  siteAddress: string
  ownerAddress: string
  projectAddress: string
  projectSqft?: number | null

  // Company Info
  companyName: string
  companyAddress: string
  companyPhones: string
  companyWebsite: string
  tradeLicenseNo: string
  tinNo: string
  ceoName: string
  ceoDesignation: string
  ceoNid?: string
  companyRepresentative: string
  companyRepresentativeTitle: string
  srCrmName: string
  officeAdminName?: string
  officeAdminDesignation?: string

  // 1. Intro / Work Order Letter
  introSubject?: string
  introSalutation?: string
  introAwardText?: string
  introTermsText?: string
  introCommenceText?: string
  introAcceptanceText?: string
  letterBody: string

  // 2. Agreement Preamble & Recitals
  agreementPlace: string
  whereasText1: string
  whereasText2: string
  agreementScopeText: string

  // 3. Quotation Summary, Payment Schedule & Annexures
  projectCostSummaryNote?: string
  paymentSchedule: AgreementPaymentStage[]
  annexures: string[]
  durationWorkingDays?: number
  durationWorkingDaysWords?: string
  durationText?: string
  durationDiscussionsText?: string

  // 4. Detail Quotation Items & Totals
  items: AgreementDetailItem[]
  interiorWorkTotal: number
  grandTotal: number
  inWordsText: string
  quotationDraft?: QuotationDraftContent | null
  quotationTotals?: QuotationTotals | null
  summaryRows?: AgreementSummaryRow[]

  // 5. Agreement Clauses (Segmented by Sections)
  clauseGroups: AgreementClauseGroup[]

  // Legacy condition text fields (kept for backward-compatibility)
  workingProcedureText?: string
  siteInspectionText?: string
  defectiveWorkText?: string
  inspectionOfWorkText?: string
  clericalErrorsText?: string
  disputeResolutionText?: string
  jurisdictionText?: string
  warrantyText?: string
  warrantyExclusionsText?: string
  taxesAndVatText?: string
  otherTerms?: string[]

  // 6. Signatures, Witnesses & Declaration
  witnessNames: string[]
  consultantDeclaration: string
  witness1Title?: string
  witness2Title?: string
  witness3Title?: string

  updatedAt?: string
}

function formatDateDisplay(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatDateCode(date: Date = new Date()): string {
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  return `${y}${m}${d}`
}

export function defaultAgreementStages(value: number): AgreementPaymentStage[] {
  const stages = [
    { stage: 'Agreement signing money.', percentage: '1.99%', fraction: 0.0199 },
    { stage: 'Advance (Before the tiles work begins—when we start the ceiling work).', percentage: '20 %', fraction: 0.20 },
    { stage: 'When we start the wall panel work after finishing the tiles work.', percentage: '30 %', fraction: 0.30 },
    { stage: 'After complete wall panel work and before start the cabinet work at our factory.', percentage: '30 %', fraction: 0.30 },
    { stage: 'After the cabinets are manufactured at our factory and arrive at the project site, but before installation.', percentage: '15 %', fraction: 0.15 },
    { stage: 'During the project handover ceremony time.', percentage: '3.01%', fraction: 0.0301 },
  ]

  return stages.map(({ stage, percentage, fraction }) => ({
    stage,
    percentage,
    amount: String(Math.round(value * fraction)),
    fraction,
  }))
}

export function defaultAgreementAnnexures(): string[] {
  return [
    'Annexure A1: Government charges: The above-mentioned costing has been prepared exclusive of all applicable VAT, Tax, and other’s government charges.',
    'Annexure A2: Period for completion of work: The Consultant shall complete the total interior works as specified in this Agreement and its Annexures within 150 (One hundred fifty) working days. However, must be given the opportunity to work for 10 hours daily. The project completion period shall commence from the day immediately following the \'\'Project receiving ceremony\'\'.',
    'Annexure A3: Bill for additional work: Any work, item, material, service, modification, alteration, or installation performed or supplied beyond the scope specified in this Agreement and its Annexures shall be considered Additional Work. Such Additional Work shall be charged separately at the applicable rate and/or mutually agreed price and shall be added to the Client’s final bill.',
  ]
}

export function defaultAgreementClauseGroups(): AgreementClauseGroup[] {
  return [
    {
      title: 'Working Procedure',
      clauses: [
        'Project survey: Before we begin the interior work on the project, our team of architects and engineers will conduct a site survey, and the client\'s presence is mandatory during this visit.',
        'Concern person of the project: A Project Engineer and a Senior Project Coordinator from our team will be directly assigned to your project, and senior management will provide direct guidance to the engineers. Please note that the assigned Project Engineer and Senior Project Coordinator will not be present at the project site full-time; the decision regarding their on-site presence will always be made by them.',
        'Design approval: Before commencing the interior work on the project, the client must sign and approve the 3D design; if the client has any observations and there is a time constraint, a hand-drawn sketch may be used for the client\'s signature and approval.',
        'Material approval: The client will visit our office to sign off on and approve the materials based on the 3D design and the material specifications we have submitted. However, regarding colors, the client will provide approval after reviewing samples prepared during the project execution phase.',
        'Receive project for starting work: Following the project survey and the approval of designs and materials, our representative will formally receive the project from the client through a “project receiving ceremony” to commence work.',
        'Site facilities & neighbor clearance: Upon receiving the project, the client shall ensure all necessary safety and facilities for the work, including water, restroom access, electricity, security for the work and materials, defined working hours, and—if required—accommodation for our personnel at the project site. It must be ensured that there will be no complaints from neighbors living near the project.',
        'Others vendor work: For work items not included in our scope—such as AC units, bathroom geysers, branded grills, and bathroom fittings etc.—vendors must consult with our representative engineer before commencing work on the project. We will only provide advice to all third-party vendors but will not assume any responsibility for their work.',
        'Site Inspection: We will ensure that the project adheres to the client-approved 3D design/material specifications as per agreement. The client is welcome to inspect the project at any time to verify the materials and design.',
        'Design and material compliance: During progress of the work, the Site Engineer/Consultant/Architect or any other representative of the Owner shall be entitled at all times to have access to and inspect the work. Any observation, discrepancy, or concern identified by the Client during an inspection shall be communicated to the Company\'s authorized representative for review and rectification in accordance with the terms of this Agreement. All inspections, site visits, and verification activities by the Client shall be conducted only in the presence of an authorized representative of the Company. The Client shall not conduct any independent inspection.',
        'Submitting work progress updates: Following the completion of each financial transaction or receipt of any payment related to the Project, the Company shall prepare and submit a Work Progress Update Report documenting the relevant project activities and progress achieved against the corresponding payment or financial milestone. Such reports shall serve as an official record of project progress.',
        'Project handover: At the time of the project handover scheduled in accordance with the agreement, our company\'s senior management, along with the project engineer and project coordinator assigned to your project, will hand over the project to you in compliance with the 3D design and material specifications.',
      ],
    },
    {
      title: 'Financial Matters',
      clauses: [
        'Payment Schedule and Payment-related Obligations: The Client shall adhere strictly to the payment schedule and amounts specified in this Agreement. If the Client wishes to modify the timing or amount of any scheduled payment for any reason, the Client must provide formal written notification to the Company in advance, either by letter or email.',
        'Changes or delays in the payment schedule: The Client acknowledges and agrees that timely payment is an essential condition for the uninterrupted execution and timely completion of the Project. The Company shall not be held responsible or liable for any delay in project execution, procurement, production, installation, completion, or final handover arising directly or indirectly from the Client\'s delay, deferment, alteration, reduction, short payment, withholding, or failure to comply with the agreed payment schedule.',
        'Project delays due to payment-related issues: Any delay, postponement, reduction, rescheduling, or modification of the agreed payment schedule shall result in a corresponding extension of the project completion and handover timeline. The revised handover date shall be adjusted based on the actual period of payment delay and the additional time reasonably required for procurement, production, material delivery, manpower mobilization, and resumption of project activities.',
        'Extension of project deadline due to delayed payment: In the event that any scheduled payment is delayed beyond its agreed due date, each one (1) calendar day of payment delay shall result in an automatic extension of the project completion and handover date by three (3) calendar days. For the avoidance of doubt, the extension shall be calculated from the original project handover schedule and shall apply irrespective of the reason attributable to the Client.',
        'Change of project handover date due to additional work: If any additional work is requested by the client and approved, the timeline for project completion and handover will be reviewed and revised accordingly. The time required for design development, material selection, procurement, fabrication, transportation, site preparation, and installation will be added to the project timeframe.',
        'Agreement cancellation fee: If this Agreement is cancelled by the Client for any reason before commencement of the interior work, the Client shall pay the Company a cancellation fee equivalent to all layout, 3D design, project survey, working drawing, material purchase, project consultancy charge and others of the total project value. The fee shall be due and payable immediately upon cancellation.',
        'Financial refund policy: As interior design services are developed and executed on a fully customized, client-specific basis, all amounts paid by the client under this Agreement shall be considered non-refundable. However, if the amount paid exceeds the value of work actually completed, as determined by final measurement and billing, the Company shall refund the verified excess amount after adjustment of all applicable dues, additional works, costs, and consultancy charges.',
      ],
    },
    {
      title: 'Others Terms and Conditions',
      clauses: [
        'Validity of the agreement: The term of this Agreement shall commence in accordance with Annexure A2: Period for Completion of Work and shall remain effective through the applicable Warranty and Defect Liability Period. The rights, obligations, and liabilities of both parties shall remain valid and enforceable throughout.',
        'Project-Specific Product Pricing: The price of each product, material, item, or service and as well as for additional work mentioned in this agreement is applicable exclusively to the subject project and shall not apply to any other project or future work unless agreed in writing.',
        'Warranty and defect liability: The Company shall provide a one (1) year service warranty commencing from the date of Project completion and formal acceptance by the Client. During the Warranty Period, the Company shall promptly rectify or repair any defect arising directly from workmanship or materials supplied by the Company. Misuse, unauthorized modification, improper maintenance, normal wear and tear, accidents, or work done by third parties are strictly excluded.',
        'Correction of Document-Related Errors: Neither party shall take advantage of any clerical, typographical, arithmetical, or inadvertent error or omission observed in any project-related documents. If such an error comes to notice, the other party must be informed immediately in writing and verified corrections shall be made in good faith without changing scope or price unless agreed in writing.',
        'Dispute resolution and arbitration: Any dispute or claim arising out of or relating to this Agreement or project execution shall first be addressed through mutual discussion. The parties shall hold at least three (3) formal discussion meetings before initiating arbitration or legal proceedings. These meetings shall be held exclusively at the Company office or the Client\'s residence, with no unauthorized third parties present.',
        'Workmanship tolerance: Considering the nature of interior fit-out works, factory production, transportation, material handling, and on-site execution, the Client shall allow a reasonable workmanship tolerance of up to 2%-5% for minor variations that do not materially affect functionality, safety, durability, or appearance.',
        'Product refund: All interior products supplied under this Agreement are custom-designed, custom-manufactured, or specifically procured according to approved specifications and are non-returnable and non-refundable once production or procurement commences. If cancellation is requested, the Client shall bear the full applicable costs.',
        'Behavioral conduct: If any behavioral issues arise during the project—such as abusive language, threats of physical violence, threats of legal action, or wrongful confinement—the matter must be formally reported via letter, telephone, and email, and resolved in accordance with the dispute resolution procedure.',
        'Formal Notice of Work Suspension: If ongoing work is suspended or interrupted by either party for any reason, the party initiating suspension shall provide written notice without undue delay via written communication, WhatsApp, and email for official documentation.',
      ],
    },
    {
      title: 'Note with Acknowledgement',
      clauses: [
        'The Consultant shall provide all necessary tools, equipment, machinery, and other resources required for the proper execution of the contracted works.',
        'The Consultant shall execute the interior works in accordance with the approved Project work schedule and shall coordinate, where reasonably required, with other contractors involved in the Project. All third-party vendors must coordinate with the Consultant.',
        'The Consultant shall be responsible for maintaining appropriate safety measures for its employees, workers, and subcontractors. Any injury or accident arising from Company work shall be addressed in accordance with applicable laws.',
        'The Consultant shall ensure that its personnel maintain professional conduct and do not engage in any unlawful, disruptive, or prohibited activities on site.',
        'Any work item not included in the agreed Schedule of Works shall be treated as Additional Work, with rates and scope agreed in writing before commencement.',
        'Running bills shall be prepared and submitted based on actual progress of work and agreed payment milestones, jointly reviewed and verified upon satisfactory completion of each stage.',
      ],
    },
  ]
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
  const dateCode = formatDateCode(now)
  const clientCleanName = lead.name || 'Client'
  const safeNamePart = clientCleanName.replace(/[^a-zA-Z0-9]/g, ' ').trim().replace(/\s+/g, '-')
  const siteLocation = lead.location || 'Dhaka, Bangladesh'
  const leadCode = lead.id.slice(-6).toUpperCase()

  // Calculate totals and extract detail items
  const items: AgreementDetailItem[] = []
  let calculatedGrandTotal = 0
  let quotationTotals: QuotationTotals | null = null

  if (detailDraftContent && detailDraftContent.lineItems && detailDraftContent.lineItems.length > 0) {
    quotationTotals = calculateQuotationTotals(detailDraftContent)
    calculatedGrandTotal = quotationTotals.grandTotal

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
          })
        })
      }
    })
  }

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
  const paymentSchedule = defaultAgreementStages(finalTotal)
  const annexures = defaultAgreementAnnexures()
  const clauseGroups = defaultAgreementClauseGroups()

  const workOrderId = `WRK-${safeNamePart}-${dateCode}`
  const subContractId = `SUB-${lead.id.slice(-8).toUpperCase()}`
  const reference = `AI/${dateCode}/${leadCode}`

  const letterBody = `I, ${clientCleanName}, hereby issue this Work Order to Interior Concepts for the execution and completion of the interior works of the above-mentioned Project, based on your submitted quotation and subsequent evaluation and agreement.

The works shall be executed in accordance with the approved quotation, Schedule of Rates, Terms & Conditions, drawings, specifications, Consultant’s Declaration, and other agreed project documents, all of which shall form an integral part of this Work Order.

You are hereby instructed to commence the works and coordinate with the Project Engineer-in-Charge and/or Consultant appointed by the Client. All works shall be carried out in accordance with the approved drawings, specifications, project requirements, and authorized instructions.

Please sign and return the duplicate copy of this Work Order as formal acknowledgment and acceptance of the Work Order and its terms and conditions.`

  const consultantDeclaration = ``

  return {
    leadId: lead.id,
    clientId: lead.clientId,
    workOrderId,
    subContractId,
    reference,
    referenceNo: reference,
    agreementDate: dateFormatted,
    agreementType: lead.agreementType || 'FITOUT_AGREEMENT',
    agreementValue: finalTotal,

    projectName: siteLocation,
    clientName: clientCleanName,
    ownerName: clientCleanName,
    clientPhone: lead.phone || '',
    siteAddress: siteLocation,
    ownerAddress: siteLocation,
    projectAddress: siteLocation,
    projectSqft: lead.projectSqft || null,

    companyName: 'INTERIOR CONCEPTS',
    companyAddress: 'TA-174/1, Unit 4A, 3rd Floor(Lift-3) Khonikachroy, South Badda Lake View Road, Badda, Dhaka-1212',
    companyPhones: '+880 1334-935530 | +880 1334-935531',
    companyWebsite: 'interiorconceptsstudio.com',
    tradeLicenseNo: 'TRAD/DNCC/048385/2025',
    tinNo: '469560437683',
    ceoName: 'Shopi Ullah Rashed',
    ceoDesignation: 'Chief Executive Officer (CEO)',
    ceoNid: '7762979297',
    companyRepresentative: 'Shopi Ullah Rashed',
    companyRepresentativeTitle: 'Chief Executive Officer',
    srCrmName: lead.srCrm?.fullName || 'Senior Project Coordinator',
    officeAdminName: lead.srCrm?.fullName || 'Senior Project Coordinator',
    officeAdminDesignation: 'Office Admin',

    // 1. Intro Letter
    introSubject: `WORK ORDER FOR INTERIOR WORKS PROJECT LOCATED AT ${siteLocation.toUpperCase()}.`,
    introSalutation: 'Dear Interior Concepts,',
    introAwardText: `I, ${clientCleanName}, am pleased to inform you that your company has been awarded the “Work Order” for the subject project based on your submitted quotation and subsequent evaluation.`,
    introTermsText: 'This Work Order shall be governed by the agreed terms and conditions, approved rates, specifications, and all related documents. The Terms & Conditions, Schedule of Rates, and Consultant’s Declaration shall form an integral and inseparable part of this Work Order.',
    introCommenceText: 'You are hereby requested to commence the work immediately in close coordination with the Project Engineer-in-Charge and/or the Consultant assigned to the project. All works shall be executed in accordance with the approved drawings, specifications, project requirements, and instructions issued by the Engineer-in-Charge.',
    introAcceptanceText: 'Kindly sign and return the duplicate copy of this Work Order as a token of your acceptance of all terms and conditions stated herein.',
    letterBody,

    // 2. Agreement Preamble
    agreementPlace: 'Dhaka',
    whereasText1: `WHEREAS the Owner is desirous of getting the Interior Design, Work and Execution for their proposed flat at ${siteLocation}.`,
    whereasText2: 'AND WHEREAS the Consultant is a Design and Build Contractor having vast experience in interior turnkey works and has agreed to do the interior works in the above-mentioned site.',
    agreementScopeText: 'That the Interior Concepts shall undertake and complete the design, supply, manufacturing, installation, execution, furnishing, and completion of the interior works of the Project in accordance with the terms and conditions of this Agreement, the approved Schedule of Rates, approved drawings and designs, material specifications, and any written instructions issued by the Owner or the Owner\'s duly authorized representative.',

    // 3. Costing & Payment Schedule
    projectCostSummaryNote: 'Note: This costing has been prepared exclusive of all applicable VAT, Tax, and other government charges.',
    paymentSchedule,
    annexures,
    durationWorkingDays: 150,
    durationWorkingDaysWords: 'One hundred fifty',
    durationText: 'Interior Concepts shall complete the total interior works as specified in this Agreement and its Annexures within 150 (One hundred fifty) working days. However, must be given the opportunity to work for 10 hours daily. The project completion period shall commence from the day immediately following the \'\'Project receiving ceremony\'\'.',
    durationDiscussionsText: 'Any work, item, material, service, modification, alteration, or installation performed or supplied beyond the scope specified in this Agreement and its Annexures shall be considered Additional Work. Such Additional Work shall be charged separately at the applicable rate and/or mutually agreed price and shall be added to the Client’s final bill.',

    // 4. Detail Quotation Items
    items,
    interiorWorkTotal: finalTotal,
    grandTotal: finalTotal,
    inWordsText: inWords,
    quotationDraft: detailDraftContent || null,
    quotationTotals,

    // 5. Conditions & Clause Groups
    clauseGroups,
    workingProcedureText: 'The work will be completed based on time schedule. If additional work apart from this agreement, all kinds of additional cost will be applied. If any item of this work agreement is deducted, then those work item costs will be deducted from the final bill.',
    siteInspectionText: 'Interior Concepts confirms that they have inspected the Site before submitting the proposal and satisfied themselves as to the nature of the work to be executed on the site.',
    defectiveWorkText: 'If any part of the work done by Interior Concepts shall be found defective in workmanship or if bad or inferior materials have been used, the Contractor shall rectify or rebuild the same.',
    inspectionOfWorkText: 'During progress of the work, the Site Engineer/Consultant/Architect or any other representative of the Owner shall be entitled at all times to have access to and inspect the work.',
    clericalErrorsText: 'Neither party shall take advantage of any clerical, typographical, or arithmetical error observed in any project-related documents.',
    disputeResolutionText: 'All disputes or differences arising out of or relating to this Agreement shall first be addressed through mutual discussion, holding at least 3 formal discussion meetings.',
    jurisdictionText: 'This agreement shall be deemed to have been made in Dhaka and shall be construed according to the laws of Bangladesh.',
    warrantyText: 'We will provide one (1) year service warranty commencing from the date of Project completion and formal acceptance by the Client.',
    warrantyExclusionsText: 'Warranty applies only to defects arising from workmanship or materials supplied by the Company. Misuse, unauthorized modification, or normal wear and tear are excluded.',
    taxesAndVatText: 'Agreement prices are exclusive of VAT and TAX.',
    otherTerms: [
      'Interior Concepts shall supply all necessary tools, plants etc. requisite for carrying out any items of work.',
      'Interior Concepts will complete the interior work as per the approved work schedule and coordinate with other contractors involved in the Project.',
      'All workmanship must be of good standard and acceptable to Engineer-in-Charge/Consultant.',
      'Running bills will be prepared and submitted based on actual progress of work and agreed payment milestones.',
      'Materials must be best quality and approved by the owner.',
    ],

    // 6. Signatures & Witnesses
    witnessNames: ['', '', ''],
    consultantDeclaration,
    witness1Title: 'Owner (Project)',
    witness2Title: 'Senior CRM / AGM, Interior Concepts',
    witness3Title: 'Chief Executive Officer (CEO), Interior Concepts',
  }
}
