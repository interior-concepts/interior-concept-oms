'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Edit2,
  HandCoins,
  History,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from 'lucide-react'
import { CrmPageHeader } from '@/components/crm/shared/page-header'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

type AdvanceUser = {
  id: string
  fullName: string
  email: string
  phone: string
  userDepartments?: { department: { name: string } }[]
}

type AdvanceAccountRow = {
  id: string
  userId: string
  totalGiven: number
  totalReturned: number
  balance: number
  updatedAt: string
  user: AdvanceUser
}

type AdvanceTxType = 'GIVEN' | 'RETURNED'

type AdvanceTransactionRow = {
  id: string
  advanceAccountId: string
  userId: string
  type: AdvanceTxType
  amount: number
  date: string
  paymentMethod: string | null
  purpose: string
  voucherNo: string | null
  note: string | null
  createdAt: string
  user: {
    id: string
    fullName: string
    email: string
    phone: string
  }
  recordedBy: {
    id: string
    fullName: string
  }
}

type SummaryData = {
  totalOutstanding: number
  totalGiven: number
  totalReturned: number
  activeHoldersCount: number
}

function formatCurrency(amount: number) {
  return `৳ ${Number(amount || 0).toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function toInputDate(dateStr?: string) {
  const d = dateStr ? new Date(dateStr) : new Date()
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10)
  return d.toISOString().slice(0, 10)
}

export default function AdvancesPage() {
  const [loading, setLoading] = useState(true)
  const [accounts, setAccounts] = useState<AdvanceAccountRow[]>([])
  const [transactions, setTransactions] = useState<AdvanceTransactionRow[]>([])
  const [users, setUsers] = useState<AdvanceUser[]>([])
  const [summary, setSummary] = useState<SummaryData>({
    totalOutstanding: 0,
    totalGiven: 0,
    totalReturned: 0,
    activeHoldersCount: 0,
  })

  const [activeTab, setActiveTab] = useState<'balances' | 'history'>('balances')
  const [search, setSearch] = useState('')
  const [onlyDue, setOnlyDue] = useState(false)
  const [filterUserId, setFilterUserId] = useState<string>('ALL')
  const [filterType, setFilterType] = useState<string>('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<AdvanceTransactionRow | null>(null)
  const [formType, setFormType] = useState<AdvanceTxType>('GIVEN')
  const [formUserId, setFormUserId] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formDate, setFormDate] = useState(toInputDate())
  const [formMethod, setFormMethod] = useState('Cash')
  const [formPurpose, setFormPurpose] = useState('')
  const [formNote, setFormNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchAdvances = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterUserId && filterUserId !== 'ALL') params.set('userId', filterUserId)
      if (filterType && filterType !== 'ALL') params.set('type', filterType)
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
      if (search.trim()) params.set('search', search.trim())

      const res = await fetch(`/api/finance/advances?${params.toString()}`, {
        cache: 'no-store',
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load advance data')
      }

      setAccounts(json.data.accounts || [])
      setTransactions(json.data.transactions || [])
      setUsers(json.data.users || [])
      setSummary(
        json.data.summary || {
          totalOutstanding: 0,
          totalGiven: 0,
          totalReturned: 0,
          activeHoldersCount: 0,
        },
      )
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load advances')
    } finally {
      setLoading(false)
    }
  }, [filterUserId, filterType, startDate, endDate, search])

  useEffect(() => {
    fetchAdvances()
  }, [fetchAdvances])

  const accountBalanceByUser = useMemo(() => {
    const map = new Map<string, number>()
    for (const acc of accounts) {
      map.set(acc.userId, acc.balance)
    }
    return map
  }, [accounts])

  const filteredAccounts = useMemo(() => {
    const q = search.trim().toLowerCase()
    return accounts.filter((acc) => {
      if (onlyDue && acc.balance <= 0) return false
      if (!q) return true
      return (
        acc.user.fullName.toLowerCase().includes(q) ||
        acc.user.email.toLowerCase().includes(q) ||
        acc.user.phone.toLowerCase().includes(q)
      )
    })
  }, [accounts, onlyDue, search])

  const selectedUserCurrentBalance = formUserId
    ? accountBalanceByUser.get(formUserId) ?? 0
    : 0

  const openCreateModal = (type: AdvanceTxType, userId?: string) => {
    setEditingTx(null)
    setFormType(type)
    setFormUserId(userId || '')
    setFormAmount('')
    setFormDate(toInputDate())
    setFormMethod('Cash')
    setFormPurpose('')
    setFormNote('')
    setModalOpen(true)
  }

  const openEditModal = (tx: AdvanceTransactionRow) => {
    setEditingTx(tx)
    setFormType(tx.type)
    setFormUserId(tx.userId)
    setFormAmount(String(tx.amount))
    setFormDate(toInputDate(tx.date))
    setFormMethod(tx.paymentMethod || 'Cash')
    setFormPurpose(tx.purpose)
    setFormNote(tx.note || '')
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formUserId) {
      toast.error('Please select a staff member')
      return
    }
    const amt = Number(formAmount)
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error('Please enter a valid positive amount')
      return
    }
    if (!formPurpose.trim()) {
      toast.error('Please enter a purpose / particulars')
      return
    }

    setSubmitting(true)
    try {
      const url = editingTx
        ? `/api/finance/advances/${editingTx.id}`
        : '/api/finance/advances'
      const method = editingTx ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: formUserId,
          type: formType,
          amount: amt,
          date: formDate,
          paymentMethod: formMethod,
          purpose: formPurpose.trim(),
          note: formNote.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save advance transaction')
      }

      toast.success(
        editingTx
          ? 'Advance entry updated'
          : formType === 'GIVEN'
            ? 'Advance recorded successfully'
            : 'Advance return recorded successfully',
      )
      setModalOpen(false)
      await fetchAdvances()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error saving advance')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (tx: AdvanceTransactionRow) => {
    const confirmed = window.confirm(
      `Delete ${tx.voucherNo || 'this entry'} (${tx.type} ${formatCurrency(tx.amount)} for ${tx.user.fullName})? This will recalculate their advance balance.`,
    )
    if (!confirmed) return

    setDeletingId(tx.id)
    try {
      const res = await fetch(`/api/finance/advances/${tx.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete entry')
      }
      toast.success('Advance entry deleted')
      await fetchAdvances()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete entry')
    } finally {
      setDeletingId(null)
    }
  }

  const clearHistoryFilters = () => {
    setFilterUserId('ALL')
    setFilterType('ALL')
    setStartDate('')
    setEndDate('')
    setSearch('')
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <CrmPageHeader
        title="Advance Management"
        subtitle="Track staff advances given and returned without affecting main account or cash/bank balances."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAdvances}
              disabled={loading}
            >
              <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openCreateModal('RETURNED')}
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
            >
              <ArrowDownLeft className="mr-1.5 h-4 w-4" />
              Record Return
            </Button>
            <Button size="sm" onClick={() => openCreateModal('GIVEN')}>
              <Plus className="mr-1.5 h-4 w-4" />
              Give Advance
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Outstanding Due
            </CardTitle>
            <HandCoins className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(summary.totalOutstanding)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Currently held across staff
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Given (All-Time)
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalGiven)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Cumulative advances disbursed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Returned (All-Time)
            </CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(summary.totalReturned)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Cumulative advances repaid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Staff with Due Balance
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.activeHoldersCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Out of {accounts.length} advance account{accounts.length === 1 ? '' : 's'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs + Filters */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex rounded-lg border bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('balances')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  activeTab === 'balances'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="h-4 w-4" />
                User Balances ({filteredAccounts.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  activeTab === 'history'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <History className="h-4 w-4" />
                Transaction History ({transactions.length})
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search user, voucher, purpose..."
                  className="pl-8"
                />
              </div>

              {activeTab === 'balances' && (
                <Button
                  variant={onlyDue ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOnlyDue((v) => !v)}
                >
                  {onlyDue ? 'Showing Due Only' : 'Only Due Balance'}
                </Button>
              )}
            </div>
          </div>

          {activeTab === 'history' && (
            <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2 lg:grid-cols-5">
              <Select value={filterUserId} onValueChange={setFilterUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="All Staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Staff</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="GIVEN">Given</SelectItem>
                  <SelectItem value="RETURNED">Returned</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                aria-label="Start date"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                aria-label="End date"
              />

              <Button variant="ghost" size="sm" onClick={clearHistoryFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading advance records...
            </div>
          ) : activeTab === 'balances' ? (
            filteredAccounts.length === 0 ? (
              <div className="py-12 text-center">
                <HandCoins className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm font-medium">No advance accounts found</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Click &ldquo;Give Advance&rdquo; to record the first advance transaction.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                      <th className="px-3 py-2.5 font-medium">Staff Member</th>
                      <th className="px-3 py-2.5 text-right font-medium">Total Given</th>
                      <th className="px-3 py-2.5 text-right font-medium">Total Returned</th>
                      <th className="px-3 py-2.5 text-right font-medium">Current Due</th>
                      <th className="px-3 py-2.5 font-medium">Last Activity</th>
                      <th className="px-3 py-2.5 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredAccounts.map((acc) => (
                      <tr key={acc.id} className="hover:bg-muted/30">
                        <td className="px-3 py-3">
                          <div className="font-medium">{acc.user.fullName}</div>
                          <div className="text-xs text-muted-foreground">
                            {acc.user.phone || acc.user.email}
                            {acc.user.userDepartments && acc.user.userDepartments.length > 0 && (
                              <span className="ml-1.5 text-[11px] uppercase text-primary">
                                • {acc.user.userDepartments.map((d) => d.department.name).join(', ')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right font-medium">
                          {formatCurrency(acc.totalGiven)}
                        </td>
                        <td className="px-3 py-3 text-right font-medium text-emerald-600">
                          {formatCurrency(acc.totalReturned)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {acc.balance > 0 ? (
                            <Badge
                              variant="outline"
                              className="border-amber-300 bg-amber-50 font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                            >
                              {formatCurrency(acc.balance)}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                            >
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Settled
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          {formatDate(acc.updatedAt)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openCreateModal('GIVEN', acc.userId)}
                            >
                              <Plus className="mr-1 h-3.5 w-3.5" />
                              Give
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={acc.balance <= 0}
                              onClick={() => openCreateModal('RETURNED', acc.userId)}
                              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 disabled:opacity-40 dark:border-emerald-800 dark:text-emerald-300"
                            >
                              <ArrowDownLeft className="mr-1 h-3.5 w-3.5" />
                              Return
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setFilterUserId(acc.userId)
                                setActiveTab('history')
                              }}
                              title="View History"
                            >
                              <History className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center">
              <History className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-medium">No advance transactions found</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try adjusting your filters or record a new advance entry.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="px-3 py-2.5 font-medium">Date</th>
                    <th className="px-3 py-2.5 font-medium">Voucher</th>
                    <th className="px-3 py-2.5 font-medium">Staff Member</th>
                    <th className="px-3 py-2.5 font-medium">Type</th>
                    <th className="px-3 py-2.5 text-right font-medium">Amount</th>
                    <th className="px-3 py-2.5 font-medium">Method</th>
                    <th className="px-3 py-2.5 font-medium">Purpose & Note</th>
                    <th className="px-3 py-2.5 font-medium">Recorded By</th>
                    <th className="px-3 py-2.5 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/30">
                      <td className="whitespace-nowrap px-3 py-3 text-xs">
                        {formatDate(tx.date)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-muted-foreground">
                        {tx.voucherNo || '—'}
                      </td>
                      <td className="px-3 py-3 font-medium">{tx.user.fullName}</td>
                      <td className="px-3 py-3">
                        {tx.type === 'GIVEN' ? (
                          <Badge
                            variant="outline"
                            className="border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                          >
                            <ArrowUpRight className="mr-1 h-3 w-3" />
                            Given
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                          >
                            <ArrowDownLeft className="mr-1 h-3 w-3" />
                            Returned
                          </Badge>
                        )}
                      </td>
                      <td
                        className={`whitespace-nowrap px-3 py-3 text-right font-semibold ${
                          tx.type === 'GIVEN' ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {tx.type === 'GIVEN' ? '-' : '+'} {formatCurrency(tx.amount)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-muted-foreground">
                        {tx.paymentMethod || '—'}
                      </td>
                      <td className="max-w-xs px-3 py-3">
                        <div className="truncate font-medium" title={tx.purpose}>
                          {tx.purpose}
                        </div>
                        {tx.note && (
                          <div
                            className="truncate text-xs text-muted-foreground"
                            title={tx.note}
                          >
                            {tx.note}
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-muted-foreground">
                        {tx.recordedBy.fullName}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => openEditModal(tx)}
                            title="Edit entry"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-rose-600 hover:text-rose-700"
                            disabled={deletingId === tx.id}
                            onClick={() => handleDelete(tx)}
                            title="Delete entry"
                          >
                            {deletingId === tx.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Give / Return / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTx
                ? `Edit Advance Entry (${editingTx.voucherNo || ''})`
                : formType === 'GIVEN'
                  ? 'Give Advance to Staff'
                  : 'Record Advance Return'}
            </DialogTitle>
            <DialogDescription>
              Advance entries are tracked separately and do not change your main Cash/Bank or account balances.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingTx && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={formType === 'GIVEN' ? 'default' : 'outline'}
                  onClick={() => setFormType('GIVEN')}
                >
                  <ArrowUpRight className="mr-1.5 h-4 w-4" />
                  Give Advance
                </Button>
                <Button
                  type="button"
                  variant={formType === 'RETURNED' ? 'default' : 'outline'}
                  onClick={() => setFormType('RETURNED')}
                >
                  <ArrowDownLeft className="mr-1.5 h-4 w-4" />
                  Record Return
                </Button>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Staff Member</Label>
              <Select
                value={formUserId}
                onValueChange={setFormUserId}
                disabled={Boolean(editingTx)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a staff member" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => {
                    const due = accountBalanceByUser.get(u.id) ?? 0
                    return (
                      <SelectItem key={u.id} value={u.id}>
                        {u.fullName}
                        {due > 0 ? ` (Due: ${formatCurrency(due)})` : ''}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {formUserId && (
                <p className="text-xs text-muted-foreground">
                  Current due balance:{' '}
                  <span className="font-semibold text-foreground">
                    {formatCurrency(selectedUserCurrentBalance)}
                  </span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="adv-amount">Amount (BDT)</Label>
                  {!editingTx &&
                    formType === 'RETURNED' &&
                    selectedUserCurrentBalance > 0 && (
                      <button
                        type="button"
                        onClick={() => setFormAmount(String(selectedUserCurrentBalance))}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Full Due
                      </button>
                    )}
                </div>
                <Input
                  id="adv-amount"
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adv-date">Date</Label>
                <Input
                  id="adv-date"
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Payment Method (Informational Only)</Label>
              <Select value={formMethod} onValueChange={setFormMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="bKash">bKash</SelectItem>
                  <SelectItem value="Nagad">Nagad</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adv-purpose">Purpose / Particulars</Label>
              <Input
                id="adv-purpose"
                required
                value={formPurpose}
                onChange={(e) => setFormPurpose(e.target.value)}
                placeholder={
                  formType === 'GIVEN'
                    ? 'e.g., Personal advance, Emergency cash, Site petty advance'
                    : 'e.g., Cash returned to accounts'
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adv-note">Note (Optional)</Label>
              <Textarea
                id="adv-note"
                rows={2}
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                placeholder="Any extra details or reference..."
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                {editingTx
                  ? 'Save Changes'
                  : formType === 'GIVEN'
                    ? 'Give Advance'
                    : 'Record Return'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
