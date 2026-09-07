"use client"

import { useEffect, useState } from "react"
import { FileText, History } from "lucide-react"
import { useTranslation } from "react-i18next"

import { SettingsSection } from "@/components/settings/settings-section"
import { SettingsToggleRow } from "@/components/settings/settings-toggle-row"
import {
  DEFAULT_DOCUMENT_DISPLAY_SETTINGS,
  loadDocumentDisplaySettings,
  saveDocumentDisplaySettings,
  type DocumentDisplayFlags,
  type DocumentDisplaySettings,
} from "@/lib/document-display-settings"

export function DocumentDisplaySettingsForm() {
  const { t } = useTranslation("settings")
  const [settings, setSettings] = useState<DocumentDisplaySettings>(
    DEFAULT_DOCUMENT_DISPLAY_SETTINGS
  )

  const invoiceToggles: {
    key: keyof DocumentDisplayFlags
    title: string
    description: string
  }[] = [
    {
      key: "showDiscounts",
      title: t("documents.showDiscountsInvoice"),
      description: t("documents.showDiscountsInvoiceDesc"),
    },
    {
      key: "showAdditions",
      title: t("documents.showAdditionsInvoice"),
      description: t("documents.showAdditionsInvoiceDesc"),
    },
    {
      key: "showCustomerBalance",
      title: t("documents.showBalanceInvoice"),
      description: t("documents.showBalanceInvoiceDesc"),
    },
  ]

  const historyToggles: {
    key: keyof DocumentDisplayFlags
    title: string
    description: string
  }[] = [
    {
      key: "showDiscounts",
      title: t("documents.showDiscountsHistory"),
      description: t("documents.showDiscountsHistoryDesc"),
    },
    {
      key: "showAdditions",
      title: t("documents.showAdditionsHistory"),
      description: t("documents.showAdditionsHistoryDesc"),
    },
    {
      key: "showCustomerBalance",
      title: t("documents.showBalanceHistory"),
      description: t("documents.showBalanceHistoryDesc"),
    },
  ]

  useEffect(() => {
    setSettings(loadDocumentDisplaySettings())
  }, [])

  function updateSection(
    section: keyof DocumentDisplaySettings,
    key: keyof DocumentDisplayFlags,
    value: boolean
  ) {
    setSettings((prev) => {
      const next = {
        ...prev,
        [section]: { ...prev[section], [key]: value },
      }
      saveDocumentDisplaySettings(next)
      return next
    })
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
      <SettingsSection
        title={t("documents.invoiceTitle")}
        description={t("documents.invoiceDescription")}
        icon={<FileText />}
      >
        <div className="space-y-2">
          {invoiceToggles.map((item) => (
            <SettingsToggleRow
              key={item.key}
              title={item.title}
              description={item.description}
              checked={settings.invoice[item.key]}
              onCheckedChange={(checked) =>
                updateSection("invoice", item.key, checked)
              }
            />
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title={t("documents.historyTitle")}
        description={t("documents.historyDescription")}
        icon={<History />}
      >
        <div className="space-y-2">
          {historyToggles.map((item) => (
            <SettingsToggleRow
              key={item.key}
              title={item.title}
              description={item.description}
              checked={settings.customerHistory[item.key]}
              onCheckedChange={(checked) =>
                updateSection("customerHistory", item.key, checked)
              }
            />
          ))}
        </div>
      </SettingsSection>
    </div>
  )
}
