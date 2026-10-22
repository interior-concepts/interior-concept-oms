'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/sonner'
import { fetchMeCached } from '@/lib/client-me'
import {
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Sparkles,
  User,
  UserPlus,
} from 'lucide-react'

type AddQuotationClientModalProps = {
  onClientCreated?: (lead: { id: string; name: string }) => void
  triggerLabel?: string
  triggerVariant?: 'default' | 'outline' | 'secondary'
  triggerClassName?: string
}

type QuotationUser = {
  id: string
  fullName: string
  email: string
}

export function AddQuotationClientModal({
  onClientCreated,
  triggerLabel = 'Add Client',
  triggerVariant = 'default',
  triggerClassName,
}: AddQuotationClientModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [startQuotationAfterCreate, setStartQuotationAfterCreate] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAdminOrSr, setIsAdminOrSr] = useState(false)
  const [quotationUsers, setQuotationUsers] = useState<QuotationUser[]>([])

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    projectSqft: '',
    budget: '',
    source: 'Quotation Team',
    remarks: '',
    assignedQuotationUserId: '',
  })

  useEffect(() => {
    if (!open) return

    let active = true
    Promise.all([
      fetchMeCached(),
      fetch('/api/department/available/QUOTATION_TEAM')
        .then((res) => (res.ok ? res.json() : { success: false, users: [] }))
        .catch(() => ({ success: false, users: [] })),
    ]).then(([meData, usersData]) => {
      if (!active) return
      const myId = meData?.id ?? null
      const depts = new Set(
        Array.isArray(meData?.userDepartments)
          ? meData.userDepartments.map((d: any) => d?.department?.name)
          : [],
      )
      const adminOrSr = depts.has('ADMIN') || depts.has('SR_CRM')

      setCurrentUserId(myId)
      setIsAdminOrSr(adminOrSr)

      if (usersData?.success && Array.isArray(usersData.users)) {
        setQuotationUsers(usersData.users)
      }

      setForm((prev) => ({
        ...prev,
        assignedQuotationUserId: prev.assignedQuotationUserId || myId || '',
      }))
    })

    return () => {
      active = false
    }
  }, [open])

  const resetForm = () => {
    setForm({
      name: '',
      phone: '',
      email: '',
      location: '',
      projectSqft: '',
      budget: '',
      source: 'Quotation Team',
      remarks: '',
      assignedQuotationUserId: currentUserId || '',
    })
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (submitting) return
    setOpen(nextOpen)
    if (!nextOpen) {
      resetForm()
    }
  }

  const handleSubmit = async (openWorkspaceDirectly: boolean) => {
    const trimmedName = form.name.trim()
    if (!trimmedName) {
      toast.error('Client name is required')
      return
    }

    setSubmitting(true)
    setStartQuotationAfterCreate(openWorkspaceDirectly)

    try {
      const response = await fetch('/api/quotation/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          phone: form.phone.trim() || undefined,
          email: form.email.trim() || undefined,
          location: form.location.trim() || undefined,
          budget: form.budget ? Number(form.budget.replace(/,/g, '')) : undefined,
          projectSqft: form.projectSqft ? Number(form.projectSqft.replace(/,/g, '')) : undefined,
          source: form.source.trim() || 'Quotation Team',
          remarks: form.remarks.trim() || undefined,
          assignedQuotationUserId: form.assignedQuotationUserId || undefined,
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload?.success || !payload?.data) {
        throw new Error(payload?.error ?? 'Failed to add quotation client')
      }

      toast.success(`Client "${trimmedName}" added in Quotation Phase`)
      const leadData = payload.data

      setOpen(false)
      resetForm()

      if (onClientCreated) {
        onClientCreated({ id: leadData.id, name: leadData.name })
      }

      if (openWorkspaceDirectly && leadData.id) {
        router.push(`/quotation-team/leads/${leadData.id}`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add quotation client')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} className={triggerClassName ?? 'gap-1.5'}>
          <UserPlus className="h-4 w-4" />
          <span>{triggerLabel}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Add Quotation Client</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Instantly create a new client in Quotation Phase and start generating quotations.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void handleSubmit(true)
          }}
          className="space-y-4 py-2"
        >
          {/* Client Name (Required) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-primary" />
              Client Full Name <span className="text-destructive">*</span>
            </label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Mr. Rafiqul Islam"
              className="text-sm font-medium"
              autoFocus
            />
          </div>

          {/* Phone & Email */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-primary" />
                Phone Number
              </label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="017XXXXXXXX"
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-primary" />
                Email Address
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="client@example.com"
                className="text-sm"
              />
            </div>
          </div>

          {/* Location & Project SQFT */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Project Location
              </label>
              <Input
                value={form.location}
                onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="e.g. Bashundhara R/A, Block C"
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-cyan-600" />
                Project Area (SQFT)
              </label>
              <Input
                type="number"
                min="0"
                step="any"
                value={form.projectSqft}
                onChange={(e) => setForm((prev) => ({ ...prev, projectSqft: e.target.value }))}
                placeholder="e.g. 1850"
                className="text-sm"
              />
            </div>
          </div>

          {/* Estimated Budget & Lead Source */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Estimated Budget (BDT)
              </label>
              <Input
                type="number"
                min="0"
                step="any"
                value={form.budget}
                onChange={(e) => setForm((prev) => ({ ...prev, budget: e.target.value }))}
                placeholder="e.g. 1500000"
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Lead Source
              </label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.source}
                onChange={(e) => setForm((prev) => ({ ...prev, source: e.target.value }))}
              >
                <option value="Quotation Team">Direct - Quotation Team</option>
                <option value="Referral">Client Referral</option>
                <option value="Walk-in">Office Walk-in</option>
                <option value="Website">Website</option>
                <option value="Facebook">Facebook / Social</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Assignee Selection (For Admins / Sr CRM) */}
          {isAdminOrSr && quotationUsers.length > 0 ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Assign Quotation Member
              </label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.assignedQuotationUserId}
                onChange={(e) => setForm((prev) => ({ ...prev, assignedQuotationUserId: e.target.value }))}
              >
                {quotationUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {/* Remarks / Scope notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Initial Remarks / Project Scope
            </label>
            <Textarea
              rows={3}
              value={form.remarks}
              onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))}
              placeholder="e.g. Full interior decoration for 3-bed apartment. Short and detail quotation required."
              className="text-sm"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={submitting}
                onClick={() => void handleSubmit(false)}
              >
                {submitting && !startQuotationAfterCreate ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Save Client
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
              >
                {submitting && startQuotationAfterCreate ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Save & Start Quotation
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
