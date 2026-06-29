"use client"

import * as React from "react"
import { IconPlus, IconTrash } from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTaxSettings } from "@/context/tax-settings-context"
import {
  TAX_MANUAL_ENTRY_CATEGORIES,
  createManualEntry,
  type TaxManualEntryCategory,
} from "@/lib/tax-settings"
import { useTaxFormatMoney } from "@/components/tax/use-tax-display-profile"
import { cn } from "@/lib/utils"

const panelClass =
  "rounded-2xl bg-card shadow-sm shadow-black/[0.04] ring-1 ring-border/40"

export function TaxManualEntries({
  compact = false,
  className,
}: {
  compact?: boolean
  className?: string
}) {
  const { settings, updateSettings } = useTaxSettings()
  const fmt = useTaxFormatMoney()
  const [label, setLabel] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [category, setCategory] = React.useState<TaxManualEntryCategory>("extra_income")
  const [note, setNote] = React.useState("")

  const selectedHint =
    TAX_MANUAL_ENTRY_CATEGORIES.find((item) => item.value === category)?.hint ?? ""

  const handleAdd = () => {
    if (!label.trim()) {
      toast.error("Give this entry a short name.")
      return
    }
    const entry = createManualEntry({
      label: label.trim(),
      amount,
      category,
      note: note.trim() || undefined,
    })
    updateSettings({ manualEntries: [...settings.manualEntries, entry] })
    setLabel("")
    setAmount("")
    setNote("")
    toast.success("Entry added.")
  }

  const handleRemove = (id: string) => {
    updateSettings({
      manualEntries: settings.manualEntries.filter((entry) => entry.id !== id),
    })
  }

  return (
    <div className={cn(panelClass, "overflow-hidden", className)}>
      <div className="border-border/40 border-b px-4 py-3.5 sm:px-5">
        <p className="text-sm font-semibold">Add anything missing</p>
        <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
          Not everything shows up in sales or purchases — add cash, loans, or one-off
          items here. Your reports update instantly.
        </p>
      </div>

      {!compact ? (
        <div className="space-y-3 border-border/40 border-b px-4 py-4 sm:px-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">What is it?</Label>
              <Input
                className="h-9"
                placeholder="e.g. Bank interest, Equipment"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Amount</Label>
              <Input
                className="h-9"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as TaxManualEntryCategory)}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TAX_MANUAL_ENTRY_CATEGORIES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-[11px]">{selectedHint}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Note (optional)</Label>
            <Input
              className="h-9"
              placeholder="Short note for your accountant"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <Button type="button" size="sm" onClick={handleAdd}>
            <IconPlus className="size-4" />
            Add entry
          </Button>
        </div>
      ) : null}

      <div className="px-4 py-3 sm:px-5">
        {settings.manualEntries.length === 0 ? (
          <p className="text-muted-foreground py-2 text-sm">
            No extra entries yet — that is OK if Custoray has everything.
          </p>
        ) : (
          <div className="divide-border/30 divide-y">
            {settings.manualEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{entry.label}</p>
                  <p className="text-muted-foreground text-xs">
                    {
                      TAX_MANUAL_ENTRY_CATEGORIES.find((c) => c.value === entry.category)
                        ?.label
                    }
                    {entry.note ? ` · ${entry.note}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums">
                    {fmt(entry.amount)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground size-8"
                    onClick={() => handleRemove(entry.id)}
                    aria-label={`Remove ${entry.label}`}
                  >
                    <IconTrash className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
