'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  AlertTriangle,
  Award,
  BarChart3,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Compass,
  DraftingCompass,
  FileCheck2,
  FileText,
  Flame,
  Handshake,
  IndianRupee,
  Layers3,
  LayoutDashboard,
  MapPin,
  MapPinned,
  Medal,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TimerReset,
  TrendingUp,
  UserCheck,
  UsersRound,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VisitStatusChart } from '@/components/crm/shared/visit-status-chart'
import { LeaderboardCard } from '@/components/crm/jr-architecture/performance-cards'

export const queueLinks = {
  cad: '/crm/admin/cad-phase-queue?queueType=cad-phase',
  review: '/crm/admin/review-center',
  visit: '/crm/admin/queue',
  meeting: '/crm/admin/meeting-queue',
  budget: '/crm/admin/budget-queue',
  design: '/crm/admin/design-queue',
}

export type PriorityAction = {
  id: string
  title: string
  label: string
  detail: string
  href: string
  tone: 'critical' | 'warning' | 'info' | 'success'
  time?: Date | null
}

type CommandCenterDashboardProps = {
  queueCounts: {
    cad: number
    review: number
    visit: number
    meeting: number
    budget: number
  }
  priorityActions: PriorityAction[]
  upcomingMeetings: UpcomingMeetingItem[]
  budgetLeads: BudgetLeadItem[]
  reviewSubmissions: ReviewSubmissionItem[]
  designWatch: DesignWatch
  visitInsights: VisitInsights
  overduePendingVisits: OverduePendingVisitItem[]
  visitTeamPerformance: VisitTeamPerformanceItem[]
  srCrmPerformance: SrCrmPerformanceItem[]
  jrArchitectPerformances: any[]
  quotationPerformances: any[]
}

type UpcomingMeetingItem = {
  id: string
  type: string
  startsAt: Date
  lead: {
    id: string
    name: string
    subStatus: string | null
  }
}

type BudgetLeadItem = {
  id: string
  name: string
  budget: number | null
  subStatus: string | null
  assignments: Array<{
    user: {
      fullName: string
    }
  }>
}

type ReviewSubmissionItem = {
  id: string
  submittedAt: Date
  lead: {
    name: string
    location: string | null
  }
  submittedBy: {
    fullName: string
  }
  files: Array<{ id: string }>
}

type DesignWatch = {
  queueCount: number
  overdueQueueCount: number
  reviewPendingCount: number
  overdueReviewCount: number
}

type VisitInsights = {
  statusData: Array<{ name: string; value: number; fill: string }>
  pendingOverdueCount: number
}

type SrCrmPerformanceItem = {
  userId: string
  name: string
  activeProjectSqft: number
  review: { score: number; count: number; best: number; better: number; good: number }
  meeting: { score: number; count: number; best: number; better: number; good: number }
  conversion: { score: number; count: number }
  totalPerformance: number
}

type VisitTeamPerformanceItem = {
  id: string
  name: string
  totalVisits: number
  completed: number
  reportCompleteness: number
  deepData: number
  performance: number
  leadVisits: number
  supportVisits: number
}

type OverduePendingVisitItem = {
  id: string
  leadId: string
  leadName: string
  leadLocation: string | null
  scheduledAt: Date
  visitLeadName: string | null
}

export function formatLabel(value: string | null | undefined): string {
  if (!value) return 'N/A'
  if (value === 'DISCOVERY') return 'Consulting Phase'
  if (value === 'PROPOSAL_SENT') return 'Quotation Sent'
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function formatRelativeTime(value: Date | null | undefined): string {
  if (!value) return 'Needs attention'
  const diffMs = new Date(value).getTime() - Date.now()
  const absMs = Math.abs(diffMs)
  const minutes = Math.round(absMs / (1000 * 60))
  const hours = Math.round(absMs / (1000 * 60 * 60))
  const days = Math.round(absMs / (1000 * 60 * 60 * 24))

  if (minutes < 60) return diffMs >= 0 ? `in ${minutes}m` : `${minutes}m overdue`
  if (hours < 24) return diffMs >= 0 ? `in ${hours}h` : `${hours}h overdue`
  return diffMs >= 0 ? `in ${days}d` : `${days}d overdue`
}

function formatMoney(value: number | null | undefined): string {
  if (!value || value <= 0) return 'Budget not set'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(value).replace('BDT', '৳')
}

// ----------------------------------------------------------------------
// 1. Executive Banner Header
// ----------------------------------------------------------------------
function HeroHeader({ totalAlerts }: { totalAlerts: number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
      {/* Background glow accents */}
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 backdrop-blur-md border border-indigo-500/30">
              <Sparkles className="size-3.5 text-indigo-400" /> Executive Command Center
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-md border border-emerald-500/30">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" /> Live Ops
            </span>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl text-white">
            Operations & Control Dashboard
          </h1>
          <p className="max-w-2xl text-sm text-slate-300 leading-relaxed">
            Real-time pipeline monitoring, queue bottlenecks, approval handoffs, and monthly team performance metrics.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {totalAlerts > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-500/20 border border-rose-500/30 px-4 py-2.5 backdrop-blur-md">
              <Flame className="size-5 text-rose-400 animate-bounce" />
              <div>
                <p className="text-xs text-rose-200 font-medium">Urgent Actions</p>
                <p className="text-sm font-bold text-white">{totalAlerts} items require attention</p>
              </div>
            </div>
          )}

          <Button
            asChild
            className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 border-none transition"
          >
            <Link href="/crm/admin/leads">
              View All Leads <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------
// 2. Modern Queue KPI Cards
// ----------------------------------------------------------------------
function QueueStatusCards({ counts }: { counts: CommandCenterDashboardProps['queueCounts'] }) {
  const cards = [
    {
      title: 'Visit Queue',
      value: counts.visit,
      label: 'Visits Ready',
      href: queueLinks.visit,
      icon: MapPinned,
      gradient: 'from-emerald-500/20 to-teal-500/5',
      iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      barColor: 'bg-emerald-500',
    },
    {
      title: 'CAD Queue',
      value: counts.cad,
      label: 'Design Tasks',
      href: queueLinks.cad,
      icon: DraftingCompass,
      gradient: 'from-sky-500/20 to-blue-500/5',
      iconBg: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
      barColor: 'bg-sky-500',
    },
    {
      title: 'Review Center',
      value: counts.review,
      label: 'Approvals Pending',
      href: queueLinks.review,
      icon: ClipboardCheck,
      gradient: 'from-amber-500/20 to-orange-500/5',
      iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      barColor: 'bg-amber-500',
    },
    {
      title: 'Meeting Queue',
      value: counts.meeting,
      label: 'Scheduled Meetings',
      href: queueLinks.meeting,
      icon: Handshake,
      gradient: 'from-purple-500/20 to-violet-500/5',
      iconBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
      barColor: 'bg-purple-500',
    },
    {
      title: 'Budget Queue',
      value: counts.budget,
      label: 'Quotation Reviews',
      href: queueLinks.budget,
      icon: IndianRupee,
      gradient: 'from-rose-500/20 to-pink-500/5',
      iconBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
      barColor: 'bg-rose-500',
    },
  ]

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Link key={card.title} href={card.href} className="group block focus:outline-none">
            <Card className={`relative overflow-hidden border border-border/80 bg-gradient-to-br ${card.gradient} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/40`}>
              <div className={`absolute top-0 left-0 h-1 w-full ${card.barColor}`} />
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className={`flex size-11 items-center justify-center rounded-xl border ${card.iconBg}`}>
                    <Icon className="size-5" />
                  </span>
                  <span className="flex size-7 items-center justify-center rounded-full bg-background/80 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:bg-primary group-hover:text-primary-foreground">
                    <ChevronRight className="size-4" />
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-3xl font-extrabold tracking-tight text-foreground">{card.value}</p>
                  <p className="text-sm font-semibold text-foreground/90 mt-0.5">{card.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </section>
  )
}

// ----------------------------------------------------------------------
// 3. Red Alert Pending Visits Banner
// ----------------------------------------------------------------------
function RedAlertBanner({ items, totalCount }: { items: OverduePendingVisitItem[]; totalCount: number }) {
  if (totalCount === 0) return null

  return (
    <Card className="overflow-hidden border-rose-400/50 bg-rose-500/5 shadow-md dark:border-rose-900/60 dark:bg-rose-950/20">
      <div className="h-1.5 w-full bg-rose-500 animate-pulse" />
      <CardHeader className="p-5 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-rose-700 dark:text-rose-300">
                Red Alert: Overdue Pending Visit Submissions ({totalCount})
              </CardTitle>
              <CardDescription className="text-xs text-rose-600/80 dark:text-rose-400/80">
                Visit reports pending completion past their scheduled completion window.
              </CardDescription>
            </div>
          </div>
          <Button asChild variant="destructive" size="sm" className="rounded-lg shadow-sm">
            <Link href={queueLinks.visit}>Manage Visit Queue <ArrowRight className="ml-1 size-3.5" /></Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 3).map((item) => (
            <Link
              key={item.id}
              href={`/crm/admin/leads/${item.leadId}`}
              className="group rounded-xl border border-rose-200/80 bg-background/90 p-3.5 transition hover:border-rose-400 hover:shadow-sm dark:border-rose-900/60 dark:bg-background/60"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  {item.leadName}
                </p>
                <Badge variant="destructive" className="text-[10px] uppercase font-bold">
                  Overdue
                </Badge>
              </div>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-rose-500 shrink-0" />
                  <span className="truncate">{item.leadLocation || 'Location not specified'}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <UserCheck className="size-3.5 text-slate-400 shrink-0" />
                  <span>Team Lead: <strong className="text-foreground">{item.visitLeadName || 'Unassigned'}</strong></span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ----------------------------------------------------------------------
// 4. Performance Leaderboard Tabbed Section
// ----------------------------------------------------------------------
function PerformanceLeaderboardTabbed({
  srCrmMembers,
  visitMembers,
  jrArchitectPerformances,
  quotationPerformances,
}: {
  srCrmMembers: SrCrmPerformanceItem[]
  visitMembers: VisitTeamPerformanceItem[]
  jrArchitectPerformances: any[]
  quotationPerformances: any[]
}) {
  return (
    <Card className="border border-border/80 shadow-sm">
      <CardHeader className="p-5 pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <TrophyIcon className="size-5 text-amber-500" />
              Team Performance Leaderboards
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Monthly cross-department rankings and milestone scores
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        <Tabs defaultValue="srcrm" className="w-full">
          <TabsList className="grid w-full grid-cols-2 gap-1 rounded-xl bg-muted p-1 sm:grid-cols-4">
            <TabsTrigger value="srcrm" className="rounded-lg text-xs font-semibold">
              Senior CRM ({srCrmMembers.length})
            </TabsTrigger>
            <TabsTrigger value="visit" className="rounded-lg text-xs font-semibold">
              Visit Team ({visitMembers.length})
            </TabsTrigger>
            <TabsTrigger value="jrarch" className="rounded-lg text-xs font-semibold">
              Jr Architect ({jrArchitectPerformances.length})
            </TabsTrigger>
            <TabsTrigger value="quotation" className="rounded-lg text-xs font-semibold">
              Quotation Team ({quotationPerformances.length})
            </TabsTrigger>
          </TabsList>

          {/* SR CRM TAB */}
          <TabsContent value="srcrm" className="mt-4">
            {srCrmMembers.length === 0 ? (
              <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                No SR CRM performance activity recorded this month.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {srCrmMembers.map((member, idx) => (
                  <div key={member.userId} className="relative overflow-hidden rounded-xl border border-border/70 bg-card p-4 shadow-sm hover:border-primary/40 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`flex size-7 items-center justify-center rounded-lg text-xs font-extrabold ${idx === 0 ? 'bg-amber-500 text-white' : idx === 1 ? 'bg-slate-300 text-slate-900' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-muted text-muted-foreground'}`}>
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-sm text-foreground">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.activeProjectSqft.toLocaleString()} SFT active</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`font-bold ${member.totalPerformance >= 80 ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600' : 'border-blue-500/30 bg-blue-500/10 text-blue-600'}`}>
                        {member.totalPerformance} / 100
                      </Badge>
                    </div>

                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Overall Score</span>
                        <span className="font-semibold text-foreground">{member.totalPerformance}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${member.totalPerformance}%` }} />
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-muted/40 p-2 text-center text-[11px]">
                      <div>
                        <p className="text-muted-foreground">Review</p>
                        <p className="font-bold text-foreground">{member.review.score}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Meetings</p>
                        <p className="font-bold text-foreground">{member.meeting.score}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Conversions</p>
                        <p className="font-bold text-foreground">{member.conversion.score}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* VISIT TEAM TAB */}
          <TabsContent value="visit" className="mt-4">
            {visitMembers.length === 0 ? (
              <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                No Visit Team activity recorded this month.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visitMembers.map((member, idx) => (
                  <div key={member.id} className="rounded-xl border border-border/70 bg-card p-4 shadow-sm hover:border-primary/40 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 text-xs font-bold">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-sm text-foreground">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.totalVisits} total visits</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="font-bold border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                        {member.performance} / 100
                      </Badge>
                    </div>

                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Completion Rate</span>
                        <span className="font-semibold text-foreground">{member.completed} visits</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${member.performance}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* JR ARCHITECT TAB */}
          <TabsContent value="jrarch" className="mt-4">
            <LeaderboardCard performances={jrArchitectPerformances} title="JR Architect Leaderboard" />
          </TabsContent>

          {/* QUOTATION TEAM TAB */}
          <TabsContent value="quotation" className="mt-4">
            {quotationPerformances.length === 0 ? (
              <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                No Quotation Team performance recorded this month.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border/70">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 text-left text-xs font-bold uppercase text-muted-foreground">
                    <tr>
                      <th className="p-3 text-center">Rank</th>
                      <th className="p-3">Member</th>
                      <th className="p-3 text-right">Detail SFT</th>
                      <th className="p-3 text-right">Short SFT</th>
                      <th className="p-3 text-right">Total Volume</th>
                      <th className="p-3 text-center">Completed</th>
                      <th className="p-3 text-right font-bold text-foreground">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {quotationPerformances.map((item, idx) => (
                      <tr key={item.userId} className="hover:bg-muted/30 transition">
                        <td className="p-3 text-center font-extrabold text-muted-foreground">#{idx + 1}</td>
                        <td className="p-3">
                          <p className="font-bold text-foreground">{item.fullName}</p>
                          <p className="text-xs text-muted-foreground">{item.email}</p>
                        </td>
                        <td className="p-3 text-right font-medium">{item.detailSqft.toLocaleString()} SFT</td>
                        <td className="p-3 text-right font-medium">{item.shortSqft.toLocaleString()} SFT</td>
                        <td className="p-3 text-right font-bold text-foreground">{item.totalSqft.toLocaleString()} SFT</td>
                        <td className="p-3 text-center">
                          <Badge variant="secondary" className="font-semibold">{item.completedCount}</Badge>
                        </td>
                        <td className="p-3 text-right">
                          <span className="inline-flex items-center rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-extrabold text-amber-600 dark:text-amber-400">
                            {item.performanceScore} / 100
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function TrophyIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}

// ----------------------------------------------------------------------
// 5. Operations Hub (Priority Actions & Queue Feeds)
// ----------------------------------------------------------------------
function PriorityActionCard({ priorityActions }: { priorityActions: PriorityAction[] }) {
  return (
    <Card className="border border-border/80 shadow-sm flex flex-col">
      <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <Zap className="size-4 text-amber-500" /> Urgent Action Feed
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Cross-department handoffs requiring immediate intervention
          </CardDescription>
        </div>
        <Badge variant="outline" className="font-bold">{priorityActions.length} Actions</Badge>
      </CardHeader>

      <CardContent className="p-5 pt-0 flex-1 space-y-2.5">
        {priorityActions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
            <CheckCircle2 className="size-8 text-emerald-500" />
            <p className="mt-2 text-sm font-bold text-foreground">All Priority Queues Clear</p>
            <p className="text-xs text-muted-foreground">No urgent actions pending right now.</p>
          </div>
        ) : (
          priorityActions.map((action) => (
            <Link
              key={action.id}
              href={action.href}
              className="group flex items-start justify-between gap-3 rounded-xl border border-border/70 bg-card p-3.5 transition hover:border-primary/40 hover:bg-accent/20 hover:shadow-sm"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={action.tone === 'critical' ? 'destructive' : 'secondary'}
                    className="text-[10px] uppercase font-bold"
                  >
                    {action.label}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">{formatRelativeTime(action.time)}</span>
                </div>
                <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                  {action.title}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-1">{action.detail}</p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition" />
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function UpcomingMeetingsCard({ upcomingMeetings }: { upcomingMeetings: UpcomingMeetingItem[] }) {
  return (
    <Card className="border border-border/80 shadow-sm">
      <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <CalendarClock className="size-4 text-indigo-500" /> Upcoming Meetings
        </CardTitle>
        <Button asChild variant="ghost" size="sm" className="h-8 text-xs font-semibold">
          <Link href="/crm/admin/calendar">Open Calendar</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-2.5">
        {upcomingMeetings.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
            No meetings scheduled in the next 7 days.
          </p>
        ) : (
          upcomingMeetings.map((meeting) => (
            <Link
              key={meeting.id}
              href={`/crm/admin/leads/${meeting.lead.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/70 p-3 transition hover:border-primary/40 hover:bg-accent/20"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{meeting.lead.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatLabel(meeting.type)} • {formatRelativeTime(meeting.startsAt)}
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-medium">
                {formatLabel(meeting.lead.subStatus)}
              </Badge>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function BudgetQuotationWatchCard({ budgetLeads }: { budgetLeads: BudgetLeadItem[] }) {
  return (
    <Card className="border border-border/80 shadow-sm">
      <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <TrendingUp className="size-4 text-emerald-500" /> Budget & Quotation Watch
        </CardTitle>
        <Button asChild variant="ghost" size="sm" className="h-8 text-xs font-semibold">
          <Link href={queueLinks.budget}>Open Hub</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-2.5">
        {budgetLeads.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
            No active quotation/budget items in queue.
          </p>
        ) : (
          budgetLeads.map((lead) => (
            <Link
              key={lead.id}
              href={`/crm/admin/leads/${lead.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/70 p-3 transition hover:border-primary/40 hover:bg-accent/20"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{lead.name}</p>
                <p className="text-xs text-muted-foreground">
                  {lead.assignments[0]?.user.fullName ?? 'Quotation Team'} • <strong className="text-foreground">{formatMoney(lead.budget)}</strong>
                </p>
              </div>
              <Badge variant="secondary" className="text-xs font-medium">
                {formatLabel(lead.subStatus)}
              </Badge>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function ReviewSnapshotCard({ reviewSubmissions }: { reviewSubmissions: ReviewSubmissionItem[] }) {
  return (
    <Card className="border border-border/80 shadow-sm lg:col-span-2">
      <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <ClipboardCheck className="size-4 text-amber-500" /> Review Center Approvals
        </CardTitle>
        <Button asChild variant="ghost" size="sm" className="h-8 text-xs font-semibold">
          <Link href={queueLinks.review}>Review All Submissions</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-2.5">
        {reviewSubmissions.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
            No CAD/Quotation submissions waiting for final approval.
          </p>
        ) : (
          reviewSubmissions.map((submission) => (
            <Link
              key={submission.id}
              href={queueLinks.review}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/70 p-3.5 transition hover:border-primary/40 hover:bg-accent/20"
            >
              <div>
                <p className="text-sm font-bold text-foreground">{submission.lead.name}</p>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>Submitted by <strong>{submission.submittedBy.fullName}</strong></span>
                  <span>•</span>
                  <span>{submission.files.length} file{submission.files.length === 1 ? '' : 's'}</span>
                  {submission.lead.location ? <><span>•</span><span>{submission.lead.location}</span></> : null}
                </div>
              </div>
              <Badge variant="outline" className="w-fit text-xs font-semibold">
                {formatRelativeTime(submission.submittedAt)}
              </Badge>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function CommandShortcutsCard() {
  const shortcuts = [
    { label: 'All Leads', href: '/crm/admin/leads', icon: UsersRound },
    { label: 'Visit Queue', href: queueLinks.visit, icon: MapPinned },
    { label: 'CAD Queue', href: queueLinks.cad, icon: DraftingCompass },
    { label: 'Review Center', href: queueLinks.review, icon: ClipboardCheck },
  ]

  return (
    <Card className="border border-border/80 shadow-sm">
      <CardHeader className="p-5 pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <Compass className="size-4 text-indigo-500" /> Quick Shortcuts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-2">
        {shortcuts.map((sc) => {
          const Icon = sc.icon
          return (
            <Button key={sc.label} asChild variant="outline" className="w-full justify-between rounded-xl h-10 font-semibold text-xs hover:border-primary/50">
              <Link href={sc.href}>
                <span className="flex items-center gap-2"><Icon className="size-4 text-primary" /> {sc.label}</span>
                <ArrowRight className="size-3.5 text-muted-foreground" />
              </Link>
            </Button>
          )
        })}
      </CardContent>
    </Card>
  )
}

function DesignFlowCard({ designWatch }: { designWatch: DesignWatch }) {
  return (
    <Card className="border border-border/80 shadow-sm">
      <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <Layers3 className="size-4 text-purple-500" /> Design Flow Watch
        </CardTitle>
        <Button asChild variant="ghost" size="sm" className="h-8 text-xs font-semibold">
          <Link href={queueLinks.design}>Open Queue</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-5 pt-0 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link href={queueLinks.design} className="rounded-xl border border-border/70 p-3.5 transition hover:border-primary/40 hover:bg-accent/20">
          <p className="text-xs text-muted-foreground">Active Design Queue</p>
          <p className="mt-1 text-2xl font-extrabold text-foreground">{designWatch.queueCount}</p>
        </Link>
        <Link href={queueLinks.design} className="rounded-xl border border-border/70 p-3.5 transition hover:border-primary/40 hover:bg-accent/20">
          <p className="text-xs text-muted-foreground">Overdue Design Tasks</p>
          <p className="mt-1 text-2xl font-extrabold text-rose-600 dark:text-rose-400">{designWatch.overdueQueueCount}</p>
        </Link>
        <Link href={queueLinks.review} className="rounded-xl border border-border/70 p-3.5 transition hover:border-primary/40 hover:bg-accent/20">
          <p className="text-xs text-muted-foreground">Waiting Review</p>
          <p className="mt-1 text-2xl font-extrabold text-foreground">{designWatch.reviewPendingCount}</p>
        </Link>
        <Link href={queueLinks.review} className="rounded-xl border border-border/70 p-3.5 transition hover:border-primary/40 hover:bg-accent/20">
          <p className="text-xs text-muted-foreground">Overdue Review</p>
          <p className="mt-1 text-2xl font-extrabold text-rose-600 dark:text-rose-400">{designWatch.overdueReviewCount}</p>
        </Link>
      </CardContent>
    </Card>
  )
}

function VisitInsightsSection({ visitInsights }: { visitInsights: VisitInsights }) {
  return (
    <Card className="border border-border/80 shadow-sm">
      <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <BarChart3 className="size-4 text-emerald-500" /> Visit Status Distribution
        </CardTitle>
        <Button asChild variant="ghost" size="sm" className="h-8 text-xs font-semibold">
          <Link href={queueLinks.visit}>View Details</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <VisitStatusChart data={visitInsights.statusData} />
      </CardContent>
    </Card>
  )
}

// ----------------------------------------------------------------------
// Main Exported Component
// ----------------------------------------------------------------------
export function AdminCommandCenterDashboard({
  queueCounts,
  priorityActions,
  upcomingMeetings,
  budgetLeads,
  reviewSubmissions,
  designWatch,
  visitInsights,
  overduePendingVisits,
  visitTeamPerformance,
  srCrmPerformance,
  jrArchitectPerformances,
  quotationPerformances,
}: CommandCenterDashboardProps) {
  const totalAlerts = overduePendingVisits.length + priorityActions.filter((a) => a.tone === 'critical').length

  return (
    <div className="min-h-full bg-slate-50/50 dark:bg-background/80 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. Hero Header */}
      <HeroHeader totalAlerts={totalAlerts} />

      {/* 2. Top KPI Cards */}
      <QueueStatusCards counts={queueCounts} />

      {/* 3. Urgent Red Alert Banner (if any) */}
      <RedAlertBanner items={overduePendingVisits} totalCount={visitInsights.pendingOverdueCount} />

      {/* 4. Tabbed Performance Leaderboard Hub */}
      <PerformanceLeaderboardTabbed
        srCrmMembers={srCrmPerformance}
        visitMembers={visitTeamPerformance}
        jrArchitectPerformances={jrArchitectPerformances}
        quotationPerformances={quotationPerformances}
      />

      {/* 5. Priority Feeds & Upcoming Activity */}
      <div className="grid gap-6 xl:grid-cols-2">
        <PriorityActionCard priorityActions={priorityActions} />
        <div className="space-y-6">
          <UpcomingMeetingsCard upcomingMeetings={upcomingMeetings} />
          <BudgetQuotationWatchCard budgetLeads={budgetLeads} />
        </div>
      </div>

      {/* 6. Review Center & Quick Shortcuts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ReviewSnapshotCard reviewSubmissions={reviewSubmissions} />
        <CommandShortcutsCard />
      </div>

      {/* 7. Design Watch & Visit Analytics */}
      <div className="grid gap-6 xl:grid-cols-2">
        <DesignFlowCard designWatch={designWatch} />
        <VisitInsightsSection visitInsights={visitInsights} />
      </div>
    </div>
  )
}
