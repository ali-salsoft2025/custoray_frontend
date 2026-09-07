"use client"

import {
  IconCoin,
  IconNotes,
  IconReceipt,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import { SettingsSection } from "@/components/settings/settings-section"
import { TaxDisclaimer } from "@/components/tax/tax-disclaimer"
import { TaxManualEntries } from "@/components/tax/tax-manual-entries"
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
  TAX_DISPLAY_CURRENCIES,
  TAX_MANUAL_ENTRY_CATEGORIES,
} from "@/lib/tax-settings"
import { cn } from "@/lib/utils"

const fieldClass = "space-y-1"
const labelClass = "text-xs font-medium"
const inputClass = "h-9 text-sm"
const selectTriggerClass = "h-9 w-full text-sm"
const hintClass = "text-muted-foreground text-[11px] leading-snug"

export function TaxSettingsPanel() {
  const { t } = useTranslation("tax")
  const { settings, updateSettings, resetSettings } = useTaxSettings()

  const handleReset = () => {
    resetSettings()
    toast.success(t("settingsPage.reset"))
  }

  const categoryList = TAX_MANUAL_ENTRY_CATEGORIES.map((c) =>
    t(`categories.${c.value}`)
  ).join(", ")

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-5 py-5 ring-1 ring-primary/15">
        <h2 className="text-xl font-semibold tracking-tight">{t("settings")}</h2>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
          {t("settingsPage.intro")}
        </p>
      </div>

      <TaxDisclaimer />

      <SettingsSection
        compact
        title={t("settingsPage.displayCurrency")}
        description={t("settingsPage.displayCurrencyHint")}
        icon={<IconCoin stroke={1.75} />}
        iconClassName="bg-sky-500/10 text-sky-600 dark:text-sky-400"
      >
        <div className={fieldClass}>
          <Label htmlFor="tax-currency" className={labelClass}>
            {t("settingsPage.currency")}
          </Label>
          <Select
            value={settings.displayCurrency}
            onValueChange={(value) =>
              updateSettings({
                displayCurrency: value as (typeof TAX_DISPLAY_CURRENCIES)[number],
              })
            }
          >
            <SelectTrigger id="tax-currency" className={selectTriggerClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAX_DISPLAY_CURRENCIES.map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className={hintClass}>{t("settingsPage.currencyHint")}</p>
        </div>
      </SettingsSection>

      <SettingsSection
        compact
        title={t("settingsPage.businessDetails")}
        description={t("settingsPage.businessDetailsHint")}
        icon={<IconReceipt stroke={1.75} />}
        iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      >
        <div className={fieldClass}>
          <Label htmlFor="tax-business-id" className={labelClass}>
            {t("settingsPage.taxId")}
          </Label>
          <Input
            id="tax-business-id"
            className={inputClass}
            value={settings.businessTaxId}
            placeholder={t("settingsPage.taxIdPlaceholder")}
            onChange={(event) =>
              updateSettings({ businessTaxId: event.target.value.slice(0, 40) })
            }
          />
        </div>
        <div className={fieldClass}>
          <Label htmlFor="tax-rate" className={labelClass}>
            {t("settingsPage.taxRate")}
          </Label>
          <Input
            id="tax-rate"
            className={cn(inputClass, "max-w-[120px]")}
            type="number"
            min={0}
            max={100}
            value={settings.estimatedTaxRatePercent}
            onChange={(event) => {
              const parsed = Number(event.target.value)
              if (Number.isFinite(parsed)) {
                updateSettings({
                  estimatedTaxRatePercent: Math.min(100, Math.max(0, parsed)),
                })
              }
            }}
          />
          <p className={hintClass}>{t("settingsPage.taxRateHint")}</p>
        </div>
        <div className={fieldClass}>
          <Label htmlFor="tax-notes" className={labelClass}>
            {t("settingsPage.notes")}
          </Label>
          <textarea
            id="tax-notes"
            value={settings.accountantNotes}
            onChange={(event) =>
              updateSettings({ accountantNotes: event.target.value.slice(0, 500) })
            }
            rows={3}
            placeholder={t("settingsPage.notesPlaceholder")}
            className={cn(
              "border-input bg-background placeholder:text-muted-foreground flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none",
              "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            )}
          />
        </div>
      </SettingsSection>

      <div className="space-y-2">
        <p className="text-sm font-semibold">{t("settingsPage.manualEntries")}</p>
        <p className="text-muted-foreground text-xs">
          {t("settingsPage.manualEntriesHint", { categories: categoryList })}
        </p>
        <TaxManualEntries />
      </div>

      <SettingsSection
        compact
        title={t("settingsPage.resetTitle")}
        description={t("settingsPage.clearHint")}
        icon={<IconNotes stroke={1.75} />}
        iconClassName="bg-muted text-muted-foreground"
        contentClassName="space-y-0"
        footer={
          <Button type="button" variant="outline" size="sm" onClick={handleReset}>
            {t("settingsPage.resetSettings")}
          </Button>
        }
      >
        <p className={hintClass}>{t("settingsPage.resetBody")}</p>
      </SettingsSection>
    </div>
  )
}
