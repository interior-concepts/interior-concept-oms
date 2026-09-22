import { VisitQueueCalendar } from '@/components/crm/shared/visit-queue-calendar'

export default function SeniorCrmQueuePage() {
  return (
    <VisitQueueCalendar
      title="Visit Queue Calendar"
      subtitle="Calendar view of scheduled visits and completed visits. Assign JR Architects to visit-completed leads."
      leadHrefPrefix="/crm/sr/leads"
      visitScope="all"
      hideSrCrmAssign={true}
    />
  )
}
