"use client"

import * as React from "react"
import { IconRefresh, IconSettings } from "@tabler/icons-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useZakat } from "@/context/zakat-context"
import type { ZakatSettings } from "@/lib/zakat"

const MONEY_FIELD_KEYS = [
  "cashBalance",
  "bankBalance",
  "assetAdjustment",
  "expensesPayable",
  "shortTermLoans",
  "liabilityAdjustment",
] as const

export function ZakatSettingsPanel() {
  const { t } = useTranslation("zakat")
  const { t: tc } = useTranslation("common")
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
    toast.success(t("settingsPage.toastSaved"))
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={save}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{t("settingsPage.title")}</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("settingsPage.hint")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => {
              resetSettings()
              toast.message(t("settingsPage.toastReset"))
            }}
          >
            <IconRefresh className="size-4" />
            {tc("actions.reset")}
          </Button>
          <Button type="submit" className="rounded-full px-6">
            {t("settingsPage.saveSettings")}
          </Button>
        </div>
      </div>

      <section className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <IconSettings className="text-primary size-4" />
          <h3 className="text-sm font-semibold">{t("settingsPage.scheduleTitle")}</h3>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="zakat-last-paid">{t("settingsPage.lastPaidDate")}</Label>
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
            <Label htmlFor="zakat-notification-days">{t("settingsPage.notificationDays")}</Label>
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
              <Label htmlFor="zakat-reminders">{t("settingsPage.enableReminders")}</Label>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {t("settingsPage.remindersHint")}
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
        <h3 className="text-sm font-semibold">{t("settingsPage.calculation")}</h3>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">{t("settingsPage.inventoryValuation")}</legend>
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
              {t("settingsPage.costPrice")}
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
              {t("settingsPage.sellingPrice")}
            </label>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="zakat-rate">{t("settingsPage.ratePercent")}</Label>
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
              <Label htmlFor="zakat-nisab">{t("settingsPage.nisabReference")}</Label>
              <Input
                id="zakat-nisab"
                type="number"
                min="0"
                step="0.01"
                value={draft.nisab || ""}
                onChange={(event) => setNumber("nisab", event.target.value)}
                placeholder={t("optional")}
              />
              <p className="text-muted-foreground text-xs">
                {t("settingsPage.nisabHint")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold">{t("settingsPage.tempBalances")}</h3>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          {t("settingsPage.tempBalancesHint")}
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {MONEY_FIELD_KEYS.map((key) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={`zakat-${key}`}>{t(`settingsPage.fields.${key}`)}</Label>
              <Input
                id={`zakat-${key}`}
                type="number"
                min="0"
                step="0.01"
                value={draft[key] || ""}
                onChange={(event) => setNumber(key, event.target.value)}
                placeholder="0"
              />
              <p className="text-muted-foreground text-xs">
                {t(`settingsPage.fields.${key}Hint`)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </form>
  )
}
