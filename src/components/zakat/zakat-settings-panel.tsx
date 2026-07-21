"use client"

import * as React from "react"
import { IconRefresh, IconSettings } from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useZakat } from "@/context/zakat-context"
import type { ZakatSettings } from "@/lib/zakat"

const moneyFields: Array<{
  key: keyof Pick<
    ZakatSettings,
    | "cashBalance"
    | "bankBalance"
    | "assetAdjustment"
    | "expensesPayable"
    | "shortTermLoans"
    | "liabilityAdjustment"
  >
  label: string
  hint: string
}> = [
  {
    key: "cashBalance",
    label: "Cash accounts",
    hint: "Cash on hand at the calculation date",
  },
  {
    key: "bankBalance",
    label: "Bank accounts",
    hint: "Combined bank balances at the calculation date",
  },
  {
    key: "assetAdjustment",
    label: "Manual asset adjustment",
    hint: "Other zakatable business assets",
  },
  {
    key: "expensesPayable",
    label: "Expenses payable",
    hint: "Eligible short-term business expenses due",
  },
  {
    key: "shortTermLoans",
    label: "Short-term loans",
    hint: "Eligible short-term loan amount",
  },
  {
    key: "liabilityAdjustment",
    label: "Manual liability adjustment",
    hint: "Other eligible short-term liabilities",
  },
]

export function ZakatSettingsPanel() {
  const { settings, updateSettings, resetSettings } = useZakat()
  const [draft, setDraft] = React.useState(settings)

  React.useEffect(() => setDraft(settings), [settings])

  const setNumber = (key: keyof ZakatSettings, value: string) => {
    setDraft((previous) => ({
      ...previous,
      [key]: Math.max(0, Number(value) || 0),
    }))
  }

  const save = (event: React.FormEvent) => {
    event.preventDefault()
    const normalized = {
      ...draft,
      rate: Math.min(100, Math.max(0, draft.rate)),
      notificationDays: Math.min(
        365,
        Math.max(1, Math.round(draft.notificationDays))
      ),
    }
    setDraft(normalized)
    updateSettings(normalized)
    toast.success("Zakat settings saved.")
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={save}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Zakat settings</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Configure calculation rules, reminders, and temporary balances.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => {
              resetSettings()
              toast.message("Zakat settings reset.")
            }}
          >
            <IconRefresh className="size-4" />
            Reset
          </Button>
          <Button type="submit" className="rounded-full px-6">
            Save settings
          </Button>
        </div>
      </div>

      <section className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <IconSettings className="text-primary size-4" />
          <h3 className="text-sm font-semibold">Schedule and reminders</h3>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="zakat-last-paid">Last Zakat paid date</Label>
            <Input
              id="zakat-last-paid"
              type="date"
              value={draft.lastPaidDate}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  lastPaidDate: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zakat-notification-days">Notification days</Label>
            <Input
              id="zakat-notification-days"
              type="number"
              min="1"
              max="365"
              value={draft.notificationDays}
              onChange={(event) =>
                setNumber("notificationDays", event.target.value)
              }
            />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3 sm:col-span-2">
            <div>
              <Label htmlFor="zakat-reminders">Enable reminders</Label>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Show an in-app notice before the next estimated due date.
              </p>
            </div>
            <Switch
              id="zakat-reminders"
              checked={draft.remindersEnabled}
              onCheckedChange={(checked) =>
                setDraft((previous) => ({
                  ...previous,
                  remindersEnabled: checked,
                }))
              }
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold">Calculation</h3>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Inventory valuation</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="inventoryValuation"
                value="cost"
                checked={draft.inventoryValuation === "cost"}
                onChange={() =>
                  setDraft((previous) => ({
                    ...previous,
                    inventoryValuation: "cost",
                  }))
                }
              />
              Cost price
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="inventoryValuation"
                value="selling"
                checked={draft.inventoryValuation === "selling"}
                onChange={() =>
                  setDraft((previous) => ({
                    ...previous,
                    inventoryValuation: "selling",
                  }))
                }
              />
              Selling price
            </label>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="zakat-rate">Calculation rate (%)</Label>
              <Input
                id="zakat-rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={draft.rate}
                onChange={(event) => setNumber("rate", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zakat-nisab">Nisab reference</Label>
              <Input
                id="zakat-nisab"
                type="number"
                min="0"
                step="0.01"
                value={draft.nisab || ""}
                onChange={(event) => setNumber("nisab", event.target.value)}
                placeholder="Optional"
              />
              <p className="text-muted-foreground text-xs">
                Informational only; it does not suppress the estimate.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold">Temporary accounting balances</h3>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          These values are manual until dedicated cash, bank, loan, and expense
          account modules are available.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {moneyFields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={`zakat-${field.key}`}>{field.label}</Label>
              <Input
                id={`zakat-${field.key}`}
                type="number"
                min="0"
                step="0.01"
                value={draft[field.key] || ""}
                onChange={(event) => setNumber(field.key, event.target.value)}
                placeholder="0"
              />
              <p className="text-muted-foreground text-xs">{field.hint}</p>
            </div>
          ))}
        </div>
      </section>
    </form>
  )
}
