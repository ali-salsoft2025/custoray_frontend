"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { SettingsSection } from "@/components/settings/settings-section"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DEFAULT_APP_PREFERENCES,
  loadAppPreferences,
  saveAppPreferences,
  type AppPreferences,
  type BillItemViewMode,
} from "@/lib/app-preferences"

export function AppPreferencesForm() {
  const { t } = useTranslation("settings")
  const { t: tCommon } = useTranslation()
  const [preferences, setPreferences] = useState<AppPreferences>(DEFAULT_APP_PREFERENCES)

  useEffect(() => {
    setPreferences(loadAppPreferences())
  }, [])

  const handleSave = () => {
    saveAppPreferences(preferences)
    toast.success(t("preferences.toastSaved"))
  }

  return (
    <SettingsSection
      title={t("preferences.title")}
      description={t("preferences.description")}
      footer={
        <Button type="button" onClick={handleSave}>
          {t("preferences.save")}
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="default-purchase-view">{t("preferences.defaultPurchaseView")}</Label>
          <Select
            value={preferences.defaultPurchaseView}
            onValueChange={(value) =>
              setPreferences((prev) => ({
                ...prev,
                defaultPurchaseView: value as BillItemViewMode,
              }))
            }
          >
            <SelectTrigger id="default-purchase-view" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bill">{tCommon("viewMode.billWise")}</SelectItem>
              <SelectItem value="item">{tCommon("viewMode.itemWise")}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">
            {t("preferences.defaultPurchaseViewHint")}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="default-sales-view">{t("preferences.defaultSalesView")}</Label>
          <Select
            value={preferences.defaultSalesView}
            onValueChange={(value) =>
              setPreferences((prev) => ({
                ...prev,
                defaultSalesView: value as BillItemViewMode,
              }))
            }
          >
            <SelectTrigger id="default-sales-view" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bill">{tCommon("viewMode.billWise")}</SelectItem>
              <SelectItem value="item">{tCommon("viewMode.itemWise")}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">
            {t("preferences.defaultSalesViewHint")}
          </p>
        </div>
      </div>
    </SettingsSection>
  )
}
