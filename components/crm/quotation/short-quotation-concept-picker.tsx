'use client'

import { useMemo, useState } from 'react'
import { Check, FolderPlus, Layers, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getQuotationTemplate, QUOTATION_TEMPLATES } from '@/lib/quotation-templates'

type CatalogOption = {
  key: string
  name: string
  itemCount?: number
  sourceDocument?: string
}

type ShortQuotationConceptPickerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  catalogs: CatalogOption[]
  fullTemplates?: any[]
  onSelectCatalog: (catalogKey: string) => void
}

export function ShortQuotationConceptPicker({
  open,
  onOpenChange,
  catalogs,
  fullTemplates = [],
  onSelectCatalog,
}: ShortQuotationConceptPickerProps) {
  const [query, setQuery] = useState('')
  const [selectedKey, setSelectedKey] = useState<string>('')

  const availableCatalogs = useMemo(() => {
    if (catalogs && catalogs.length > 0) return catalogs
    return QUOTATION_TEMPLATES.map((t) => ({
      key: t.key,
      name: t.name,
      itemCount: t.items.length,
      sourceDocument: t.sourceDocument,
    }))
  }, [catalogs])

  const filteredCatalogs = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return availableCatalogs
    return availableCatalogs.filter((c) => c.name.toLowerCase().includes(q))
  }, [availableCatalogs, query])

  const previewTemplate = useMemo(() => {
    const key = selectedKey || (filteredCatalogs[0]?.key ?? '')
    if (!key) return null
    if (fullTemplates?.length) {
      return fullTemplates.find((t) => t.key === key) || getQuotationTemplate(key)
    }
    return getQuotationTemplate(key)
  }, [selectedKey, filteredCatalogs, fullTemplates])

  const handleSelect = (key: string) => {
    onSelectCatalog(key)
    onOpenChange(false)
    setQuery('')
    setSelectedKey('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden sm:max-w-2xl">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Add Concept from Catalog / Bundle
          </DialogTitle>
          <DialogDescription>
            Choose a catalog template to add a complete concept with all default items pre-filled into your short quotation.
          </DialogDescription>
        </DialogHeader>

        <div className="shrink-0 space-y-3 border-b py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search catalog bundles (e.g., Kitchen, TV Unit, Closet)..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 divide-y overflow-y-auto sm:grid-cols-5 sm:divide-x sm:divide-y-0 py-2">
          {/* Catalog bundle list */}
          <div className="space-y-1 overflow-y-auto p-2 sm:col-span-2">
            {filteredCatalogs.map((cat) => {
              const active = (selectedKey || filteredCatalogs[0]?.key) === cat.key
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedKey(cat.key)}
                  className={`flex w-full flex-col gap-1 rounded-lg border p-2.5 text-left text-xs transition-colors ${
                    active
                      ? 'border-primary bg-primary/5 font-semibold text-primary'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{cat.name}</span>
                    {active ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
                  </div>
                  {cat.itemCount ? (
                    <span className="text-[11px] text-muted-foreground">
                      {cat.itemCount} items included
                    </span>
                  ) : null}
                </button>
              )
            })}

            {filteredCatalogs.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">No catalogs found.</p>
            ) : null}
          </div>

          {/* Catalog bundle preview */}
          <div className="flex flex-col justify-between overflow-y-auto p-3 sm:col-span-3">
            {previewTemplate ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-semibold text-sm">{previewTemplate.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {previewTemplate.items?.length ?? 0} items will be added as a concept
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    Catalog Bundle
                  </Badge>
                </div>

                <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
                  {(previewTemplate.items ?? []).map((item: any) => (
                    <div
                      key={item.id}
                      className="rounded-md border bg-card p-2 text-xs space-y-1"
                    >
                      <div className="flex justify-between font-medium">
                        <span>{item.description}</span>
                        <span className="text-muted-foreground font-mono">
                          {item.unit === 'ls' ? 'Lump Sum' : `${item.unit}`}
                        </span>
                      </div>
                      {item.materials ? (
                        <p className="line-clamp-2 text-[11px] text-muted-foreground">
                          {item.materials}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="py-12 text-center text-xs text-muted-foreground">Select a catalog bundle to preview items.</p>
            )}

            {previewTemplate ? (
              <div className="mt-4 border-t pt-3">
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => handleSelect(previewTemplate.key)}
                >
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Add "{previewTemplate.name}" Concept Bundle
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
