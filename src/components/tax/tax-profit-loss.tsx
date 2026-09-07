"use client"

import Link from "next/link"
import { IconDownload, IconArrowRight } from "@tabler/icons-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import { TaxManualEntries } from "@/components/tax/tax-manual-entries"
import { TaxPageLayout } from "@/components/tax/tax-page-layout"
import {
  TaxReportFootnote,
  TaxReportTable,
} from "@/components/tax/tax-report-table"
import { useTaxReportBundle } from "@/components/tax/use-tax-report-bundle"
import { useTaxDisplayProfile } from "@/components/tax/use-tax-display-profile"
import { Button } from "@/components/ui/button"
import { useTaxSettings } from "@/context/tax-settings-context"
import { buildTaxExportMeta, downloadTaxReportXls } from "@/lib/tax-export"
import { profitAndLossToRows } from "@/lib/tax-reports"

export function TaxProfitLossReport() {
  const { t } = useTranslation("tax")
  const { t: tc } = useTranslation("common")
  const { settings } = useTaxSettings()
  const bundle = useTaxReportBundle()
  const profile = useTaxDisplayProfile()

  const handleExport = () => {
    if (!bundle) {
      toast.error(t("toastPickPeriod"))
      return
    }
    downloadTaxReportXls(
      "tax-money-in-out.xls",
      buildTaxExportMeta(settings, bundle.range),
      profitAndLossToRows(
        bundle.profitAndLoss,
        profile,
        profile.salesTaxLabel,
        settings.manualEntries
      )
    )
    toast.success(t("toastDownloaded"))
  }

  return (
    <TaxPageLayout
      step={3}
      title={t("pl.title")}
      subtitle={t("pl.subtitle")}
      explainTitle={t("pl.explainTitle")}
      explainBody={t("pl.explainBody")}
      actions={
        <Button type="button" variant="outline" size="sm" onClick={handleExport}>
          <IconDownload className="size-4" />
          {tc("actions.download")}
        </Button>
      }
    >
      {bundle ? (
        <>
          <TaxManualEntries />
          <TaxReportTable
            lines={profitAndLossToRows(
              bundle.profitAndLoss,
              profile,
              profile.salesTaxLabel,
              settings.manualEntries
            )}
          />
          <TaxReportFootnote />
          <Button type="button" variant="outline" size="sm" className="w-fit" asChild>
            <Link href="/tax/balance-sheet">
              {t("pl.next")}
              <IconArrowRight className="size-4" />
            </Link>
          </Button>
        </>
      ) : (
        <p className="text-muted-foreground text-sm">{t("selectPeriod")}</p>
      )}
    </TaxPageLayout>
  )
}
