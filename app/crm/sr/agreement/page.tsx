'use client'

import { AgreementCenterView } from '@/components/crm/agreement/AgreementCenterView'

export default function SeniorCrmAgreementPage() {
  return (
    <AgreementCenterView
      title="Agreement Center"
      subtitle="Track leads with completed agreements, assigned 3D visualizers, and download agreement papers."
      leadBasePath="/crm/sr/leads"
    />
  )
}
