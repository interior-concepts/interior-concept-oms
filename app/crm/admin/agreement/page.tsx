'use client'

import { AgreementCenterView } from '@/components/crm/agreement/AgreementCenterView'

export default function AdminAgreementPage() {
  return (
    <AgreementCenterView
      title="Agreement Center"
      subtitle="Overview of all client agreements across the firm with agreement paper downloads."
      leadBasePath="/crm/admin/leads"
    />
  )
}
