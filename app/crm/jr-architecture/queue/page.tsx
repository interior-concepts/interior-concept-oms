import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { VisitQueueCalendar } from '@/components/crm/shared/visit-queue-calendar'
import { hasJrArchitectureLeaderRole } from '@/lib/jr-architecture-roles'
import prisma from '@/lib/prisma'

export default async function JrArchitectureQueuePage() {
  return (
    <VisitQueueCalendar
      title="Visit Queue Calendar"
      subtitle="Calendar view of scheduled visits (observe only) and completed visits awaiting JR Architect assignment."
      leadHrefPrefix={null}
      visitScope="all"
    />
  )
}
