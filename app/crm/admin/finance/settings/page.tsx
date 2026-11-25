"use client"

import React, { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import {
  PlusCircle,
  Trash2,
  Tag,
  Building,
  FileText,
  Calendar,
  Briefcase,
  Wrench,
  Wallet,
  HandCoins,
  Landmark,
  TrendingUp,
  Receipt,
  DollarSign,
  PieChart,
  ChevronLeft,
  Users,
  Pencil,
  Ban,
  CheckCircle,
  Loader2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Plus,
  X,
} from "lucide-react"
import { DEFAULT_VENDOR_TYPES, formatVendorType } from "@/lib/vendor-utils"

// ─── Category types ───────────────────────────────────────────────────────────
type TransactionCategoryType = "OUTFLOW" | "INFLOW"
type TransactionCategory = {
  key: string
  label: string
  icon: any
  isCustom?: boolean
}

const EXPENSE_CATEGORIES: TransactionCategory[] = [
  { key: "OFFICE_RENT", label: "Office Rent", icon: Building },
  { key: "UTILITIES", label: "Utilities", icon: Receipt },
  { key: "SALARY", label: "Employee Salary", icon: DollarSign },
  { key: "MARKETING", label: "Marketing / Ads", icon: PieChart },
  { key: "SITE_VISIT", label: "Site Visit Expenses", icon: Calendar },
  { key: "CONVEYANCE", label: "Conveyance", icon: Briefcase },
  { key: "CIVIL_WORK", label: "Civil Work", icon: Wrench },
  { key: "OTHERS", label: "Other Expenses", icon: Tag },
]

const INCOME_CATEGORIES: TransactionCategory[] = [
  { key: "CLIENT_PAYMENT", label: "Client Payment", icon: Wallet },
  { key: "PROJECT_ADVANCE", label: "Project Advance", icon: HandCoins },
  { key: "DESIGN_FEE", label: "Design Fee", icon: FileText },
  { key: "CONSULTANCY_FEE", label: "Consultancy Fee", icon: Briefcase },
  { key: "BANK_INTEREST", label: "Bank Interest", icon: Landmark },
  { key: "OTHER_INCOME", label: "Other Income", icon: TrendingUp },
]

const CUSTOM_CATEGORY_STORAGE_KEY = "finance-custom-transaction-categories"

const formatCustomCategoryKey = (name: string, type: TransactionCategoryType) =>
  `CUSTOM_${type}_${name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "")}`

// ─── Vendor types ─────────────────────────────────────────────────────────────
type VendorTypeOption = {
  id?: string
  value: string
  label: string
  isDefault?: boolean
}

const VENDOR_TYPE_COLORS: Record<string, string> = {
  SUPPLIER: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  CONTRACTOR: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  PAINTER: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  CARPENTER: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  SERVICE_PROVIDER: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  FREELANCER: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  OTHER: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
}

type VendorBankAccount = {
  id?: string
  bankName: string | null
  bankBranch: string | null
  accountName: string | null
  routingNumber: string | null
  accountNumber: string | null
  isPrimary?: boolean
}

type BankAccountForm = {
  bankName: string
  bankBranch: string
  accountName: string
  routingNumber: string
  accountNumber: string
}

const EMPTY_BANK_ACCOUNT: BankAccountForm = {
  bankName: "",
  bankBranch: "",
  accountName: "",
  routingNumber: "",
  accountNumber: "",
}

type Vendor = {
  id: string
  vendorId: string
  vendorName: string
  vendorCompanyName: string | null
  vendorType: string
  status: "ACTIVE" | "DISABLED"
  bankName: string | null
  bankBranch: string | null
  accountName: string | null
  routingNumber: string | null
  accountNumber: string | null
  bankAccounts?: VendorBankAccount[]
  primaryEmail: string | null
  primaryPhone: string | null
  primaryPhones?: string[]
  billingAddress: string | null
  billingAddresses?: string[]
  createdAt: string
}

type VendorFormState = {
  vendorName: string
  vendorCompanyName: string
  vendorType: string
  status: "ACTIVE" | "DISABLED"
  bankAccounts: BankAccountForm[]
  primaryEmail: string
  primaryPhones: string[]
  billingAddresses: string[]
}

const VENDOR_EMPTY: VendorFormState = {
  vendorName: "",
  vendorCompanyName: "",
  vendorType: "",
  status: "ACTIVE",
  bankAccounts: [{ ...EMPTY_BANK_ACCOUNT }],
  primaryEmail: "",
  primaryPhones: [""],
  billingAddresses: [""],
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FinanceSettingsPage() {
  const [activeTab, setActiveTab] = useState<TransactionCategoryType>("OUTFLOW")
  const [newCategoryName, setNewCategoryName] = useState("")
  const [customCategories, setCustomCategories] = useState<Record<TransactionCategoryType, TransactionCategory[]>>({
    OUTFLOW: [],
    INFLOW: [],
  })

  // Vendor state
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [vendorTypes, setVendorTypes] = useState<VendorTypeOption[]>([...DEFAULT_VENDOR_TYPES])
  const [showAddVendorType, setShowAddVendorType] = useState(false)
  const [newVendorTypeLabel, setNewVendorTypeLabel] = useState("")
  const [savingVendorType, setSavingVendorType] = useState(false)
  const [vendorLoading, setVendorLoading] = useState(true)
  const [vendorSaving, setVendorSaving] = useState(false)
  const [showVendorDialog, setShowVendorDialog] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [deleteVendorId, setDeleteVendorId] = useState<string | null>(null)
  const [vendorForm, setVendorForm] = useState<VendorFormState>(VENDOR_EMPTY)

  // ── Custom categories ──────────────────────────────────────────────────────
  useEffect(() => {
    const stored = window.localStorage.getItem(CUSTOM_CATEGORY_STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Record<string, Omit<TransactionCategory, "icon">[]>
        setCustomCategories({
          OUTFLOW: (parsed.OUTFLOW || []).map((item) => ({ ...item, icon: Tag, isCustom: true })),
          INFLOW: (parsed.INFLOW || []).map((item) => ({ ...item, icon: Tag, isCustom: true })),
        })
      } catch {}
    }
  }, [])

  const saveCustomCategories = (next: Record<TransactionCategoryType, TransactionCategory[]>) => {
    const serializable = {
      OUTFLOW: next.OUTFLOW.map(({ key, label, isCustom }) => ({ key, label, isCustom })),
      INFLOW: next.INFLOW.map(({ key, label, isCustom }) => ({ key, label, isCustom })),
    }
    window.localStorage.setItem(CUSTOM_CATEGORY_STORAGE_KEY, JSON.stringify(serializable))
    setCustomCategories(next)
  }

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newCategoryName.trim()
    if (!trimmed) { toast.error("Please enter a category name"); return }
    const key = formatCustomCategoryKey(trimmed, activeTab)
    const defaults = activeTab === "OUTFLOW" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
    const currentCustoms = customCategories[activeTab]
    if (
      defaults.some((item) => item.key === key || item.label.toLowerCase() === trimmed.toLowerCase()) ||
      currentCustoms.some((item) => item.key === key || item.label.toLowerCase() === trimmed.toLowerCase())
    ) { toast.error("This category name already exists."); return }
    const newCat: TransactionCategory = { key, label: trimmed, icon: Tag, isCustom: true }
    saveCustomCategories({ ...customCategories, [activeTab]: [newCat, ...currentCustoms] })
    setNewCategoryName("")
    toast.success("Category added successfully!")
  }

  const handleDeleteCategory = (keyToDelete: string) => {
    saveCustomCategories({
      ...customCategories,
      [activeTab]: customCategories[activeTab].filter((item) => item.key !== keyToDelete),
    })
    toast.success("Category deleted successfully.")
  }

  // ── Vendors ────────────────────────────────────────────────────────────────
  const fetchVendors = useCallback(async () => {
    setVendorLoading(true)
    try {
      const res = await fetch("/api/vendors")
      const json = await res.json()
      if (json.success) setVendors(json.data)
    } catch { toast.error("Failed to load vendors") }
    finally { setVendorLoading(false) }
  }, [])

  const fetchVendorTypes = useCallback(async () => {
    try {
      const res = await fetch("/api/vendors/types")
      const json = await res.json()
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setVendorTypes(json.data)
      }
    } catch {
      // Keep default vendor types fallback on network error
    }
  }, [])

  useEffect(() => {
    fetchVendors()
    fetchVendorTypes()
  }, [fetchVendors, fetchVendorTypes])

  const handleCreateVendorType = async () => {
    const trimmed = newVendorTypeLabel.trim()
    if (!trimmed) { toast.error("Please enter a vendor type name"); return }

    setSavingVendorType(true)
    try {
      const res = await fetch("/api/vendors/types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: trimmed }),
      })
      const json = await res.json()
      if (!json.success) {
        toast.error(json.error ?? "Failed to add vendor type")
        return
      }
      const created: VendorTypeOption = json.data
      setVendorTypes((prev) => (prev.some((t) => t.value === created.value) ? prev : [...prev, created]))
      setVendorForm((f) => ({ ...f, vendorType: created.value }))
      setNewVendorTypeLabel("")
      setShowAddVendorType(false)
      toast.success(`Vendor type "${created.label}" saved!`)
    } catch {
      toast.error("Failed to save vendor type")
    } finally {
      setSavingVendorType(false)
    }
  }

  const openCreateVendor = () => {
    setEditingVendor(null)
    setVendorForm({
      ...VENDOR_EMPTY,
      bankAccounts: [{ ...EMPTY_BANK_ACCOUNT }],
      primaryPhones: [""],
      billingAddresses: [""],
    })
    setShowAddVendorType(false)
    setNewVendorTypeLabel("")
    setShowVendorDialog(true)
  }

  const openEditVendor = (v: Vendor) => {
    setEditingVendor(v)
    const bankList: BankAccountForm[] =
      v.bankAccounts && v.bankAccounts.length > 0
        ? v.bankAccounts.map((b) => ({
            bankName: b.bankName ?? "",
            bankBranch: b.bankBranch ?? "",
            accountName: b.accountName ?? "",
            routingNumber: b.routingNumber ?? "",
            accountNumber: b.accountNumber ?? "",
          }))
        : v.bankName || v.bankBranch || v.accountName || v.routingNumber || v.accountNumber
          ? [
              {
                bankName: v.bankName ?? "",
                bankBranch: v.bankBranch ?? "",
                accountName: v.accountName ?? "",
                routingNumber: v.routingNumber ?? "",
                accountNumber: v.accountNumber ?? "",
              },
            ]
          : [{ ...EMPTY_BANK_ACCOUNT }]

    const phonesList =
      v.primaryPhones && v.primaryPhones.length > 0
        ? v.primaryPhones
        : v.primaryPhone
          ? [v.primaryPhone]
          : [""]

    const addressesList =
      v.billingAddresses && v.billingAddresses.length > 0
        ? v.billingAddresses
        : v.billingAddress
          ? [v.billingAddress]
          : [""]

    setVendorForm({
      vendorName: v.vendorName,
      vendorCompanyName: v.vendorCompanyName ?? "",
      vendorType: v.vendorType,
      status: v.status,
      bankAccounts: bankList,
      primaryEmail: v.primaryEmail ?? "",
      primaryPhones: phonesList,
      billingAddresses: addressesList,
    })
    setShowAddVendorType(false)
    setNewVendorTypeLabel("")
    setShowVendorDialog(true)
  }

  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vendorForm.vendorName.trim()) { toast.error("Vendor name is required"); return }
    if (!vendorForm.vendorType) { toast.error("Vendor type is required"); return }

    setVendorSaving(true)
    try {
      const cleanedBanks = vendorForm.bankAccounts
        .map((b) => ({
          bankName: b.bankName.trim() || null,
          bankBranch: b.bankBranch.trim() || null,
          accountName: b.accountName.trim() || null,
          routingNumber: b.routingNumber.trim() || null,
          accountNumber: b.accountNumber.trim() || null,
        }))
        .filter((b) => b.bankName || b.bankBranch || b.accountName || b.routingNumber || b.accountNumber)

      const cleanedPhones = vendorForm.primaryPhones.map((p) => p.trim()).filter(Boolean)
      const cleanedAddresses = vendorForm.billingAddresses.map((a) => a.trim()).filter(Boolean)
      const primaryBank = cleanedBanks[0]

      const payload = {
        vendorName: vendorForm.vendorName.trim(),
        vendorCompanyName: vendorForm.vendorCompanyName.trim() || null,
        vendorType: vendorForm.vendorType,
        status: vendorForm.status,
        bankName: primaryBank?.bankName ?? null,
        bankBranch: primaryBank?.bankBranch ?? null,
        accountName: primaryBank?.accountName ?? null,
        routingNumber: primaryBank?.routingNumber ?? null,
        accountNumber: primaryBank?.accountNumber ?? null,
        bankAccounts: cleanedBanks,
        primaryEmail: vendorForm.primaryEmail.trim() || null,
        primaryPhone: cleanedPhones[0] ?? null,
        primaryPhones: cleanedPhones,
        billingAddress: cleanedAddresses[0] ?? null,
        billingAddresses: cleanedAddresses,
      }

      const url = editingVendor ? `/api/vendors/${editingVendor.id}` : "/api/vendors"
      const method = editingVendor ? "PATCH" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const json = await res.json()

      if (!json.success) { toast.error(json.error ?? "Failed to save vendor"); return }
      toast.success(editingVendor ? "Vendor updated!" : "Vendor created!")
      setShowVendorDialog(false)
      fetchVendors()
    } catch { toast.error("Something went wrong") }
    finally { setVendorSaving(false) }
  }

  const handleToggleStatus = async (vendor: Vendor) => {
    const newStatus = vendor.status === "ACTIVE" ? "DISABLED" : "ACTIVE"
    try {
      const res = await fetch(`/api/vendors/${vendor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      const json = await res.json()
      if (!json.success) { toast.error(json.error ?? "Failed to update status"); return }
      toast.success(`Vendor ${newStatus === "ACTIVE" ? "enabled" : "disabled"}`)
      fetchVendors()
    } catch { toast.error("Something went wrong") }
  }

  const handleDeleteVendor = async () => {
    if (!deleteVendorId) return
    try {
      const res = await fetch(`/api/vendors/${deleteVendorId}`, { method: "DELETE" })
      const json = await res.json()
      if (!json.success) { toast.error(json.error ?? "Failed to delete vendor"); return }
      toast.success("Vendor deleted")
      setDeleteVendorId(null)
      fetchVendors()
    } catch { toast.error("Something went wrong") }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Link href="/crm/admin/finance" prefetch={false} className="hover:text-foreground flex items-center gap-1 transition">
              <ChevronLeft className="w-4 h-4" /> Finance Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Finance Settings</h1>
          <p className="text-muted-foreground">Manage transaction categories and vendors.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/crm/admin/finance/vendors" prefetch={false}>
            <Button variant="outline" className="gap-2">
              <Users className="w-4 h-4" /> Vendor AP Dashboard
            </Button>
          </Link>
          <Link href="/crm/admin/finance/settings/accounts" prefetch={false}>
            <Button variant="outline" className="gap-2">
              <Wallet className="w-4 h-4" /> Manage Accounts
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="OUTFLOW" onValueChange={(val) => {
        if (val === "OUTFLOW" || val === "INFLOW") {
          setActiveTab(val as TransactionCategoryType)
          setNewCategoryName("")
        }
      }} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-lg shrink-0">
          <TabsTrigger value="OUTFLOW">Expense Categories</TabsTrigger>
          <TabsTrigger value="INFLOW">Income Categories</TabsTrigger>
          <TabsTrigger value="VENDORS">
            <Users className="w-4 h-4 mr-1.5" />Vendors
          </TabsTrigger>
        </TabsList>

        <TabsContent value="OUTFLOW" className="space-y-6">
          {renderCategoryManagement(EXPENSE_CATEGORIES, customCategories.OUTFLOW, "Expense")}
        </TabsContent>

        <TabsContent value="INFLOW" className="space-y-6">
          {renderCategoryManagement(INCOME_CATEGORIES, customCategories.INFLOW, "Income")}
        </TabsContent>

        <TabsContent value="VENDORS" className="space-y-6">
          {renderVendors()}
        </TabsContent>
      </Tabs>

      {/* Vendor Create/Edit Dialog */}
      <Dialog open={showVendorDialog} onOpenChange={setShowVendorDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVendor ? "Edit Vendor" : "Add New Vendor"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleVendorSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Basic Info</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Vendor Name <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="e.g. Rahman Carpenter"
                    value={vendorForm.vendorName}
                    onChange={(e) => setVendorForm((f) => ({ ...f, vendorName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company Name <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                  <Input
                    placeholder="e.g. Rahman Furniture Ltd."
                    value={vendorForm.vendorCompanyName}
                    onChange={(e) => setVendorForm((f) => ({ ...f, vendorCompanyName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vendor Type <span className="text-destructive">*</span></Label>
                  <Select
                    value={vendorForm.vendorType}
                    onValueChange={(v) => {
                      if (v === "__ADD_NEW__") {
                        setShowAddVendorType(true)
                        return
                      }
                      setShowAddVendorType(false)
                      setVendorForm((f) => ({ ...f, vendorType: v }))
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {vendorTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                      <SelectItem value="__ADD_NEW__" className="text-primary font-medium border-t mt-1 pt-1.5">
                        + Add New Vendor Type
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {showAddVendorType && (
                    <div className="flex items-center gap-2 pt-1">
                      <Input
                        placeholder="New vendor type (e.g. Electrician)"
                        value={newVendorTypeLabel}
                        onChange={(e) => setNewVendorTypeLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleCreateVendorType()
                          }
                        }}
                        className="h-8 text-xs"
                        autoFocus
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 px-2.5 text-xs shrink-0"
                        disabled={savingVendorType}
                        onClick={handleCreateVendorType}
                      >
                        {savingVendorType ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-xs shrink-0"
                        onClick={() => {
                          setShowAddVendorType(false)
                          setNewVendorTypeLabel("")
                        }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={vendorForm.status} onValueChange={(v) => setVendorForm((f) => ({ ...f, status: v as "ACTIVE" | "DISABLED" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="DISABLED">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <hr className="border-border/60" />

            {/* Financial Info */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Financial & Payment Info</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() =>
                    setVendorForm((f) => ({
                      ...f,
                      bankAccounts: [...f.bankAccounts, { ...EMPTY_BANK_ACCOUNT }],
                    }))
                  }
                >
                  <Plus className="w-3.5 h-3.5" /> Bank Details
                </Button>
              </div>
              <div className="space-y-3">
                {vendorForm.bankAccounts.map((bank, idx) => (
                  <div key={idx} className="rounded-lg border border-border/70 p-3 space-y-3 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Bank Details #{idx + 1}{idx === 0 ? " (Primary)" : ""}
                      </span>
                      {vendorForm.bankAccounts.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-destructive hover:bg-destructive/10"
                          onClick={() =>
                            setVendorForm((f) => ({
                              ...f,
                              bankAccounts: f.bankAccounts.filter((_, i) => i !== idx),
                            }))
                          }
                        >
                          <Trash2 className="w-3 h-3 mr-1" /> Remove
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Bank Name</Label>
                        <Input
                          placeholder="e.g. Dutch-Bangla Bank"
                          value={bank.bankName}
                          onChange={(e) =>
                            setVendorForm((f) => ({
                              ...f,
                              bankAccounts: f.bankAccounts.map((item, i) =>
                                i === idx ? { ...item, bankName: e.target.value } : item
                              ),
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Bank Branch</Label>
                        <Input
                          placeholder="e.g. Banani Branch"
                          value={bank.bankBranch}
                          onChange={(e) =>
                            setVendorForm((f) => ({
                              ...f,
                              bankAccounts: f.bankAccounts.map((item, i) =>
                                i === idx ? { ...item, bankBranch: e.target.value } : item
                              ),
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Account Name</Label>
                        <Input
                          placeholder="e.g. Rahman Furniture Ltd."
                          value={bank.accountName}
                          onChange={(e) =>
                            setVendorForm((f) => ({
                              ...f,
                              bankAccounts: f.bankAccounts.map((item, i) =>
                                i === idx ? { ...item, accountName: e.target.value } : item
                              ),
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Account Number</Label>
                        <Input
                          placeholder="e.g. 1234567890"
                          value={bank.accountNumber}
                          onChange={(e) =>
                            setVendorForm((f) => ({
                              ...f,
                              bankAccounts: f.bankAccounts.map((item, i) =>
                                i === idx ? { ...item, accountNumber: e.target.value } : item
                              ),
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs">Routing Number</Label>
                        <Input
                          placeholder="e.g. 090261595"
                          value={bank.routingNumber}
                          onChange={(e) =>
                            setVendorForm((f) => ({
                              ...f,
                              bankAccounts: f.bankAccounts.map((item, i) =>
                                i === idx ? { ...item, routingNumber: e.target.value } : item
                              ),
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-border/60" />

            {/* Contact & Address */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contact & Address</h3>
              <div className="space-y-2">
                <Label>Primary Email</Label>
                <Input
                  type="email"
                  placeholder="vendor@example.com"
                  value={vendorForm.primaryEmail}
                  onChange={(e) => setVendorForm((f) => ({ ...f, primaryEmail: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Primary Phone Numbers</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={() =>
                      setVendorForm((f) => ({ ...f, primaryPhones: [...f.primaryPhones, ""] }))
                    }
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Phone
                  </Button>
                </div>
                <div className="space-y-2">
                  {vendorForm.primaryPhones.map((phone, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        placeholder={idx === 0 ? "+880 1xxx-xxxxxx (Primary)" : "+880 1xxx-xxxxxx"}
                        value={phone}
                        onChange={(e) =>
                          setVendorForm((f) => ({
                            ...f,
                            primaryPhones: f.primaryPhones.map((p, i) => (i === idx ? e.target.value : p)),
                          }))
                        }
                      />
                      {vendorForm.primaryPhones.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0 text-destructive hover:bg-destructive/10"
                          onClick={() =>
                            setVendorForm((f) => ({
                              ...f,
                              primaryPhones: f.primaryPhones.filter((_, i) => i !== idx),
                            }))
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Primary Addresses</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={() =>
                      setVendorForm((f) => ({ ...f, billingAddresses: [...f.billingAddresses, ""] }))
                    }
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Address
                  </Button>
                </div>
                <div className="space-y-2">
                  {vendorForm.billingAddresses.map((addr, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Textarea
                        placeholder={idx === 0 ? "Primary billing/office address..." : "Additional address..."}
                        value={addr}
                        onChange={(e) =>
                          setVendorForm((f) => ({
                            ...f,
                            billingAddresses: f.billingAddresses.map((a, i) => (i === idx ? e.target.value : a)),
                          }))
                        }
                        rows={2}
                      />
                      {vendorForm.billingAddresses.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0 text-destructive hover:bg-destructive/10"
                          onClick={() =>
                            setVendorForm((f) => ({
                              ...f,
                              billingAddresses: f.billingAddresses.filter((_, i) => i !== idx),
                            }))
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowVendorDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={vendorSaving} className="gap-2">
                {vendorSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                {editingVendor ? "Save Changes" : "Create Vendor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!deleteVendorId} onOpenChange={(open: boolean) => { if (!open) setDeleteVendorId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the vendor. This action cannot be undone.
              Vendors with active project agreements cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteVendor} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )

  // ── Category Management renderer ───────────────────────────────────────────
  function renderCategoryManagement(defaults: TransactionCategory[], customs: TransactionCategory[], label: string) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 h-fit border border-border">
          <CardHeader>
            <CardTitle>Add Custom {label} Category</CardTitle>
            <CardDescription>Created categories will instantly appear in the transaction log options.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder={`Category name, e.g. Office Snacks`}
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  maxLength={30}
                />
              </div>
              <Button type="submit" className="w-full gap-2">
                <PlusCircle className="w-4 h-4" /> Add Category
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border border-border">
          <CardHeader>
            <CardTitle>Current Categories</CardTitle>
            <CardDescription>View default system categories and manage your custom ones.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                Custom Categories
                <Badge variant="secondary">{customs.length}</Badge>
              </h3>
              {customs.length === 0 ? (
                <div className="text-center py-6 border border-dashed rounded-lg text-sm text-muted-foreground">
                  No custom categories added yet. Use the panel on the left to add one.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {customs.map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-muted/60 text-muted-foreground"><Tag className="w-4 h-4" /></div>
                        <span className="font-medium text-sm">{item.label}</span>
                      </div>
                      <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteCategory(item.key)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <hr className="border-border/60" />
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">System Default Categories (Read-Only)</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {defaults.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.key} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/20 opacity-80">
                      <div className="p-2 rounded bg-muted text-muted-foreground"><Icon className="w-4 h-4" /></div>
                      <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Vendors renderer ───────────────────────────────────────────────────────
  function renderVendors() {
    const activeVendors = vendors.filter((v) => v.status === "ACTIVE")
    const disabledVendors = vendors.filter((v) => v.status === "DISABLED")

    return (
      <div className="space-y-6">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Vendor Directory</h2>
            <p className="text-sm text-muted-foreground">
              {vendors.length} vendor{vendors.length !== 1 ? "s" : ""} total — {activeVendors.length} active
            </p>
          </div>
          <Button onClick={openCreateVendor} className="gap-2">
            <PlusCircle className="w-4 h-4" /> Add Vendor
          </Button>
        </div>

        {vendorLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading vendors...
          </div>
        ) : vendors.length === 0 ? (
          <Card className="border border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <Users className="w-10 h-10 text-muted-foreground/40" />
              <p className="text-muted-foreground font-medium">No vendors yet</p>
              <p className="text-sm text-muted-foreground/70">Add your first vendor to get started.</p>
              <Button onClick={openCreateVendor} variant="outline" className="gap-2 mt-2">
                <PlusCircle className="w-4 h-4" /> Add Vendor
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Active */}
            {activeVendors.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  Active Vendors <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">{activeVendors.length}</Badge>
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {activeVendors.map((v) => renderVendorCard(v))}
                </div>
              </div>
            )}

            {/* Disabled */}
            {disabledVendors.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                  Disabled Vendors <Badge variant="secondary">{disabledVendors.length}</Badge>
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-60">
                  {disabledVendors.map((v) => renderVendorCard(v))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  function renderVendorCard(v: Vendor) {
    const typeLabel = vendorTypes.find((t) => t.value === v.vendorType)?.label ?? formatVendorType(v.vendorType)
    const typeColor = VENDOR_TYPE_COLORS[v.vendorType] ?? VENDOR_TYPE_COLORS.OTHER
    const phones = v.primaryPhones && v.primaryPhones.length > 0 ? v.primaryPhones : v.primaryPhone ? [v.primaryPhone] : []
    const addresses = v.billingAddresses && v.billingAddresses.length > 0 ? v.billingAddresses : v.billingAddress ? [v.billingAddress] : []
    const banks: VendorBankAccount[] =
      v.bankAccounts && v.bankAccounts.length > 0
        ? v.bankAccounts
        : v.bankName || v.bankBranch || v.accountName || v.accountNumber
          ? [
              {
                bankName: v.bankName,
                bankBranch: v.bankBranch,
                accountName: v.accountName,
                routingNumber: v.routingNumber,
                accountNumber: v.accountNumber,
              },
            ]
          : []

    return (
      <Card key={v.id} className="border border-border hover:border-border/80 transition group">
        <CardContent className="p-4 space-y-3">
          {/* Top row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm truncate">{v.vendorName}</span>
                <Badge variant="outline" className="text-[10px] font-mono shrink-0">{v.vendorId}</Badge>
              </div>
              {v.vendorCompanyName && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{v.vendorCompanyName}</p>
              )}
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${typeColor}`}>
              {typeLabel}
            </span>
          </div>

          {/* Contact info */}
          <div className="space-y-1">
            {phones.map((phone, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="w-3 h-3 shrink-0" />
                <span className="truncate">{phone}</span>
              </div>
            ))}
            {v.primaryEmail && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="w-3 h-3 shrink-0" />
                <span className="truncate">{v.primaryEmail}</span>
              </div>
            )}
            {banks.map((bank, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <CreditCard className="w-3 h-3 shrink-0 mt-0.5" />
                <span className="truncate">
                  {[
                    bank.bankName,
                    bank.bankBranch,
                    bank.accountName,
                    bank.accountNumber ? `****${bank.accountNumber.slice(-4)}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
            ))}
            {addresses.map((address, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{address}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1 border-t border-border/50">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 gap-1.5 text-xs"
              onClick={() => openEditVendor(v)}
            >
              <Pencil className="w-3 h-3" /> Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={`h-7 px-2 gap-1.5 text-xs ${v.status === "ACTIVE" ? "text-amber-600 hover:bg-amber-50" : "text-green-600 hover:bg-green-50"}`}
              onClick={() => handleToggleStatus(v)}
            >
              {v.status === "ACTIVE"
                ? <><Ban className="w-3 h-3" /> Disable</>
                : <><CheckCircle className="w-3 h-3" /> Enable</>
              }
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 gap-1.5 text-xs text-destructive hover:bg-destructive/10 ml-auto"
              onClick={() => setDeleteVendorId(v.id)}
            >
              <Trash2 className="w-3 h-3" /> Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
}
