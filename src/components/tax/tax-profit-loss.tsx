"use client"

import Link from "next/link"
import { IconDownload, IconArrowRight } from "@tabler/icons-react"
import { toast } from "sonner"

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
  const { settings } = useTaxSettings()
  const bundle = useTaxReportBundle()
  const profile = useTaxDisplayProfile()

  const handleExport = () => {
    if (!bundle) {
      toast.error("Pick a fiscal period using the calendar in the top bar first.")
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
    toast.success("Report downloaded.")
  }

  return (
    <TaxPageLayout
      step={3}
      title="Money in vs money out"
      subtitle="Think of this as: what did the business earn, and what did it spend, during your selected period?"
      explainTitle="What am I looking at?"
      explainBody="Money in comes from completed sales (plus anything you added manually). Money out comes from completed purchases (plus manual expenses). The bottom line is a rough profit — hand this to your accountant rather than using it to file taxes yourself."
      actions={
        <Button type="button" variant="outline" size="sm" onClick={handleExport}>
          <IconDownload className="size-4" />
          Download
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
              Next: What you own &amp; owe
              <IconArrowRight className="size-4" />
            </Link>
          </Button>
        </>
      ) : (
        <p className="text-muted-foreground text-sm">
          Select a fiscal period from the calendar in the top bar to see this report.
        </p>
      )}
    </TaxPageLayout>
  )
}
