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
import { balanceSheetToRows } from "@/lib/tax-reports"

export function TaxBalanceSheetReport() {
  const { settings } = useTaxSettings()
  const bundle = useTaxReportBundle()
  const profile = useTaxDisplayProfile()

  const handleExport = () => {
    if (!bundle) {
      toast.error("Pick a fiscal period using the calendar in the top bar first.")
      return
    }
    downloadTaxReportXls(
      "tax-what-you-own-owe.xls",
      buildTaxExportMeta(settings, bundle.range),
      balanceSheetToRows(bundle.balanceSheet, profile, settings.manualEntries)
    )
    toast.success("Report downloaded.")
  }

  return (
    <TaxPageLayout
      step={3}
      title="What you own & what you owe"
      subtitle="A snapshot of the business today — customer balances, stock on hand, and unpaid vendor bills."
      explainTitle="What am I looking at?"
      explainBody="This is a simplified balance sheet. “What you have” includes money customers owe you and inventory. “What you owe” is outstanding vendor bills plus anything you added manually (like a loan)."
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
            lines={balanceSheetToRows(
              bundle.balanceSheet,
              profile,
              settings.manualEntries
            )}
          />
          <TaxReportFootnote />
          <Button type="button" variant="outline" size="sm" className="w-fit" asChild>
            <Link href="/tax/year-summary">
              Next: Year summary
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
