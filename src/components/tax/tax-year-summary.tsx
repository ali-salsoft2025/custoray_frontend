"use client"

import Link from "next/link"
import { IconDownload, IconArrowRight } from "@tabler/icons-react"
import { toast } from "sonner"

import { StatCard, StatCardsGrid } from "@/components/stat-card"
import { TaxPageLayout } from "@/components/tax/tax-page-layout"
import {
  TaxReportFootnote,
  TaxReportTable,
} from "@/components/tax/tax-report-table"
import { useTaxReportBundle } from "@/components/tax/use-tax-report-bundle"
import { useTaxFormatMoney } from "@/components/tax/use-tax-display-profile"
import { useTaxDisplayProfile } from "@/components/tax/use-tax-display-profile"
import { Button } from "@/components/ui/button"
import { useTaxSettings } from "@/context/tax-settings-context"
import { buildTaxExportMeta, downloadTaxReportXls } from "@/lib/tax-export"
import { yearSummaryToRows } from "@/lib/tax-reports"
import { cn } from "@/lib/utils"

const panelClass =
  "rounded-2xl bg-card shadow-sm shadow-black/[0.04] ring-1 ring-border/40"

export function TaxYearSummaryReport() {
  const { settings } = useTaxSettings()
  const bundle = useTaxReportBundle()
  const profile = useTaxDisplayProfile()
  const fmt = useTaxFormatMoney()

  const handleExport = () => {
    if (!bundle) {
      toast.error("Pick a fiscal period using the calendar in the top bar first.")
      return
    }
    downloadTaxReportXls(
      "tax-year-summary.xls",
      buildTaxExportMeta(settings, bundle.range),
      yearSummaryToRows(bundle.yearSummary, profile)
    )
    toast.success("Report downloaded.")
  }

  const summary = bundle?.yearSummary

  return (
    <TaxPageLayout
      step={3}
      title="Year summary"
      subtitle="The big picture — how many invoices, payments, and returns you had, plus trends by month."
      explainTitle="Why share this with your accountant?"
      explainBody="It saves them time. They get totals, monthly patterns, and your top customers and vendors in one view, alongside the detailed profit and balance reports."
      actions={
        <Button type="button" variant="outline" size="sm" onClick={handleExport}>
          <IconDownload className="size-4" />
          Download
        </Button>
      }
    >
      {bundle && summary ? (
        <>
          <StatCardsGrid>
            <StatCard
              label="Sales invoices"
              value={String(summary.counts.salesInvoices)}
              hint={`${summary.counts.pendingSales} still pending`}
            />
            <StatCard
              label="Purchase orders"
              value={String(summary.counts.purchaseOrders)}
              hint={`${summary.counts.pendingPurchases} still pending`}
            />
            <StatCard
              label="Returns"
              value={String(
                summary.counts.salesReturns + summary.counts.purchaseReturns
              )}
              hint="Sales and purchase returns"
            />
            <StatCard
              label="Payments logged"
              value={String(
                summary.counts.customerPayments + summary.counts.vendorPayments
              )}
              hint="Money in and out"
            />
          </StatCardsGrid>

          <TaxReportTable lines={yearSummaryToRows(summary, profile)} />

          {summary.monthly.length > 0 ? (
            <div className={cn(panelClass, "overflow-hidden")}>
              <div className="border-border/40 border-b px-4 py-3">
                <p className="text-sm font-semibold">Month by month</p>
                <p className="text-muted-foreground text-xs">
                  Green-ish numbers are good — more in than out.
                </p>
              </div>
              <div className="hidden grid-cols-4 gap-2 border-border/40 border-b px-4 py-2 text-[11px] font-medium sm:grid">
                <span>Month</span>
                <span>Money in</span>
                <span>Money out</span>
                <span>Difference</span>
              </div>
              <div className="divide-border/30 divide-y">
                {summary.monthly.map((row) => (
                  <div
                    key={row.month}
                    className="grid grid-cols-2 gap-2 px-4 py-3 text-sm sm:grid-cols-4"
                  >
                    <p className="font-medium">{row.label}</p>
                    <p className="tabular-nums">{fmt(row.revenue)}</p>
                    <p className="text-muted-foreground tabular-nums">{fmt(row.expenses)}</p>
                    <p className="font-medium tabular-nums">{fmt(row.net)}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 lg:grid-cols-2">
            <PartyList title="Top customers" rows={summary.topCustomers} fmt={fmt} />
            <PartyList title="Top vendors" rows={summary.topVendors} fmt={fmt} />
          </div>

          <TaxReportFootnote />

          <Button type="button" size="sm" className="w-fit" asChild>
            <Link href="/tax">
              Back to download pack
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

function PartyList({
  title,
  rows,
  fmt,
}: {
  title: string
  rows: { name: string; total: number; count: number }[]
  fmt: (value: number | string) => string
}) {
  return (
    <div className={cn(panelClass, "overflow-hidden")}>
      <div className="border-border/40 border-b px-4 py-3">
        <p className="text-sm font-semibold">{title}</p>
      </div>
      {rows.length === 0 ? (
        <p className="text-muted-foreground px-4 py-6 text-sm">No data in this period yet.</p>
      ) : (
        <div className="divide-border/30 divide-y">
          {rows.map((row) => (
            <div
              key={row.name}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{row.name}</p>
                <p className="text-muted-foreground text-xs">
                  {row.count} transaction{row.count === 1 ? "" : "s"}
                </p>
              </div>
              <p className="shrink-0 font-semibold tabular-nums">{fmt(row.total)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
