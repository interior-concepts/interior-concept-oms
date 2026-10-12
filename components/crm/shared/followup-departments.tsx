import React from 'react'
import { Badge } from '@/components/ui/badge'
import {
  UserCheck,
  ShieldCheck,
  Layers,
  Sparkles,
  FileSpreadsheet,
  MapPin,
  CreditCard,
  ClipboardList,
  Palette,
  Calculator,
  ShoppingCart,
  ShieldAlert,
  Users,
  type LucideIcon,
} from 'lucide-react'

export type FollowUpDepartmentKey =
  | 'JR_CRM'
  | 'SR_CRM'
  | 'JR_ARCHITECT'
  | 'VISUALIZER_3D'
  | 'QUOTATION'
  | 'VISIT_TEAM'
  | 'ACCOUNTS'
  | 'PROJECT_COORDINATOR'
  | 'SPECIALIST_DESIGN_CONSULTANTS'
  | 'BOQ'
  | 'PROCUREMENT'
  | 'ADMIN'

export interface DepartmentConfig {
  key: FollowUpDepartmentKey
  label: string
  shortLabel: string
  actionLabel: string
  badgeClass: string
  icon: LucideIcon
}

export const FOLLOWUP_DEPARTMENTS: DepartmentConfig[] = [
  {
    key: 'JR_CRM',
    label: 'Junior CRM',
    shortLabel: 'Jr CRM',
    actionLabel: 'Jr CRM Action',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
    icon: UserCheck,
  },
  {
    key: 'SR_CRM',
    label: 'Senior CRM',
    shortLabel: 'Sr CRM',
    actionLabel: 'Sr CRM Action',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
    icon: ShieldCheck,
  },
  {
    key: 'JR_ARCHITECT',
    label: 'Junior Architect / CAD',
    shortLabel: 'Architect / CAD',
    actionLabel: 'CAD / Architect Action',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    icon: Layers,
  },
  {
    key: 'VISUALIZER_3D',
    label: '3D Visualizer',
    shortLabel: '3D Visualizer',
    actionLabel: '3D Visualizer Action',
    badgeClass: 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-950/60 dark:text-pink-300 dark:border-pink-800',
    icon: Sparkles,
  },
  {
    key: 'QUOTATION',
    label: 'Quotation Team',
    shortLabel: 'Quotation',
    actionLabel: 'Quotation Action',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    icon: FileSpreadsheet,
  },
  {
    key: 'VISIT_TEAM',
    label: 'Site Visit Team',
    shortLabel: 'Site Visit',
    actionLabel: 'Site Visit Action',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    icon: MapPin,
  },
  {
    key: 'ACCOUNTS',
    label: 'Accounts / Billing',
    shortLabel: 'Accounts',
    actionLabel: 'Accounts Action',
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
    icon: CreditCard,
  },
  {
    key: 'PROJECT_COORDINATOR',
    label: 'Project Coordinator',
    shortLabel: 'Coordinator',
    actionLabel: 'Coordinator Action',
    badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800',
    icon: ClipboardList,
  },
  {
    key: 'SPECIALIST_DESIGN_CONSULTANTS',
    label: 'Design Specialist',
    shortLabel: 'Design Specialist',
    actionLabel: 'Specialist Action',
    badgeClass: 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800',
    icon: Palette,
  },
  {
    key: 'BOQ',
    label: 'BOQ Team',
    shortLabel: 'BOQ',
    actionLabel: 'BOQ Action',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
    icon: Calculator,
  },
  {
    key: 'PROCUREMENT',
    label: 'Procurement',
    shortLabel: 'Procurement',
    actionLabel: 'Procurement Action',
    badgeClass: 'bg-lime-100 text-lime-800 border-lime-300 dark:bg-lime-950/60 dark:text-lime-300 dark:border-lime-800',
    icon: ShoppingCart,
  },
  {
    key: 'ADMIN',
    label: 'Management / Admin',
    shortLabel: 'Admin',
    actionLabel: 'Management Action',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
    icon: ShieldAlert,
  },
]

export function getDepartmentMeta(departmentKey?: string | null): DepartmentConfig {
  if (!departmentKey) {
    return {
      key: 'JR_CRM',
      label: 'CRM Team',
      shortLabel: 'CRM',
      actionLabel: 'CRM Action',
      badgeClass: 'bg-muted text-muted-foreground border-border',
      icon: Users,
    }
  }

  const normalized = departmentKey.trim().toUpperCase()
  const found = FOLLOWUP_DEPARTMENTS.find((dept) => dept.key === normalized)
  if (found) return found

  return {
    key: 'ADMIN',
    label: departmentKey.replace(/_/g, ' '),
    shortLabel: departmentKey.replace(/_/g, ' '),
    actionLabel: `${departmentKey.replace(/_/g, ' ')} Action`,
    badgeClass: 'bg-muted text-muted-foreground border-border',
    icon: Users,
  }
}

export function DepartmentRoleBadge({
  departmentKey,
  className = '',
  showActionLabel = true,
}: {
  departmentKey?: string | null
  className?: string
  showActionLabel?: boolean
}) {
  const meta = getDepartmentMeta(departmentKey)
  const Icon = meta.icon

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1 font-medium text-[11px] ${meta.badgeClass} ${className}`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span>{showActionLabel ? meta.actionLabel : meta.shortLabel}</span>
    </Badge>
  )
}
