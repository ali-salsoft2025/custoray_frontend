"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconArrowRight,
  IconCheck,
  IconDownload,
  IconFileSpreadsheet,
  IconScale,
  IconSum,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { StatCard, StatCardsGrid } from "@/components/stat-card"
import { TaxDisclaimer } from "@/components/tax/tax-disclaimer"
import { TaxManualEntries } from "@/components/tax/tax-manual-entries"
import { TaxTermBanner } from "@/components/tax/tax-term-banner"
import { useTaxReportBundle } from "@/components/tax/use-tax-report-bundle"
import { useTaxFormatMoney } from "@/components/tax/use-tax-display-profile"
import { Button } from "@/components/ui/button"
import { useTaxSettings } from "@/context/tax-settings-context"
import {
  balanceSheetToRows,
  filterByDateRange,
  profitAndLossToRows,
  yearSummaryToRows,
} from "@/lib/tax-reports"
import { buildTaxExportMeta, downloadAccountantPack } from "@/lib/tax-export"
import { manualEntryCategoryLabel } from "@/lib/tax-settings"
import { getTaxDisplayProfile } from "@/lib/tax-region-config"
import { formatTaxMoney } from "@/lib/tax-region-config"
import { useOrders } from "@/context/orders-context"
import { usePurchases } from "@/context/purchases-context"
import { cn } from "@/lib/utils"

const panelClass =
  "rounded-2xl bg-card shadow-sm shadow-black/[0.04] ring-1 ring-border/40"

function StepHeader({
  step,
  title,
  description,
}: {
  step: number
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
        {step}
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

function ReportStepLink({
  step,
  done,
  title,
  plainTitle,
  description,
  href,
  icon,
}: {
  step: number
  done: boolean
  title: string
  plainTitle: string
  description: string
  href: string
  icon: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        panelClass,
        "hover:ring-primary/30 group flex flex-col gap-3 p-4 transition-all sm:flex-row sm:items-center"
      )}
    >
      <div className="flex items-start gap-3 sm:flex-1">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl",
            done ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground"
          )}
        >
          {done ? <IconCheck className="size-4" stroke={2} /> : icon}
        </div>
        <div className="min-w-0">
          <p className="text-primary text-[11px] font-semibold uppercase">Step {step}</p>
          <p className="text-sm font-semibold">{plainTitle}</p>
          <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <span className="text-muted-foreground text-xs sm:hidden">{title}</span>
        <span className="text-primary inline-flex items-center gap-1 text-xs font-medium">
          Open
          <IconArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}

export function TaxHelperHub() {
  const { settings } = useTaxSettings()
  const bundle = useTaxReportBundle()
  const { orders } = useOrders()
  const { purchases } = usePurchases()
  const fmt = useTaxFormatMoney()
  const profile = getTaxDisplayProfile(settings)

  const handleExportPack = () => {
    if (!bundle) {
      toast.error("Pick a fiscal period using the calendar in the top bar first.")
      return
    }
    const sales = filterByDateRange(
      orders.filter((o) => o.status === "completed"),
      (o) => o.orderDate,
      bundle.range
    )
    const purchaseRows = filterByDateRange(
      purchases.filter((p) => p.status === "completed"),
      (p) => p.purchaseDate,
      bundle.range
    )

    downloadAccountantPack({
      meta: buildTaxExportMeta(settings, bundle.range),
      profitAndLoss: profitAndLossToRows(
        bundle.profitAndLoss,
        profile,
        profile.salesTaxLabel,
        settings.manualEntries
      ),
      balanceSheet: balanceSheetToRows(
        bundle.balanceSheet,
        profile,
        settings.manualEntries
      ),
      yearSummary: yearSummaryToRows(bundle.yearSummary, profile),
      monthly: bundle.yearSummary.monthly.map((row) => ({
        Month: row.label,
        Revenue: formatTaxMoney(row.revenue, profile),
        Expenses: formatTaxMoney(row.expenses, profile),
        Net: formatTaxMoney(row.net, profile),
      })),
      manualEntries: settings.manualEntries.map((entry) => ({
        Name: entry.label,
        Type: manualEntryCategoryLabel(entry.category),
        Amount: formatTaxMoney(entry.amount, profile),
        Note: entry.note ?? "",
      })),
      sales,
      purchases: purchaseRows,
    })
    toast.success("Download started — send this file to your accountant.")
  }

  const pl = bundle?.profitAndLoss
  const bs = bundle?.balanceSheet
  const hasManualEntries = settings.manualEntries.length > 0

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-gradient-to-br from-primary/12 via-primary/5 to-transparent px-5 py-6 ring-1 ring-primary/15 sm:px-7 sm:py-8">
        <p className="text-primary text-xs font-semibold tracking-wide uppercase">
          Year-end tax prep
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Tax Helper
        </h2>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
          A simple step-by-step guide — no accounting degree needed. We pull numbers from
          your sales and purchases, you add anything missing, then download a pack for
          your accountant.
        </p>
      </div>

      <TaxDisclaimer />

      <section className="space-y-3">
        <StepHeader
          step={1}
          title="Check your date range"
          description="Use the calendar button in the top bar to pick the fiscal year or period you are preparing for."
        />
        <TaxTermBanner />
      </section>

      <section className="space-y-3">
        <StepHeader
          step={2}
          title="Add anything Custoray might be missing"
          description="Bank fees, equipment, loans, or side income — add them here and we include them in your reports."
        />
        <TaxManualEntries />
      </section>

      {bundle ? (
        <section className="space-y-3">
          <StepHeader
            step={3}
            title="Review your numbers"
            description="A quick summary, then open each report for the full plain-language breakdown."
          />
          <StatCardsGrid>
            <StatCard
              label="Money in"
              value={fmt(pl!.netRevenue)}
              hint="Sales plus any extra income you added"
            />
            <StatCard
              label="Money out"
              value={fmt(pl!.netPurchases)}
              hint="Purchases plus any extra expenses you added"
            />
            <StatCard
              label="What you kept"
              value={fmt(pl!.grossProfitEstimate)}
              hint="Rough profit for the period"
            />
            <StatCard
              label="Net worth (est.)"
              value={fmt(bs!.estimatedEquity)}
              hint="What you have minus what you owe"
            />
          </StatCardsGrid>
          <div className="grid gap-3 pt-1">
          <ReportStepLink
            step={3}
            done={Boolean(bundle && pl!.netRevenue > 0)}
            plainTitle="Money in vs money out"
            title="Profit & loss"
            description="See what came in from sales and what went out on purchases — like a simple income statement."
            href="/tax/profit-loss"
            icon={<IconSum className="size-4" stroke={1.75} />}
          />
          <ReportStepLink
            step={3}
            done={Boolean(bundle && bs!.totalAssets > 0)}
            plainTitle="What you own & owe"
            title="Balance sheet"
            description="A snapshot of customer balances, inventory, and bills — what the business has and owes today."
            href="/tax/balance-sheet"
            icon={<IconScale className="size-4" stroke={1.75} />}
          />
          <ReportStepLink
            step={3}
            done={Boolean(bundle && bundle.yearSummary.counts.salesInvoices > 0)}
            plainTitle="Everything in one place"
            title="Year summary"
            description="Counts, monthly trends, and your biggest customers and vendors — great for your accountant."
            href="/tax/year-summary"
            icon={<IconFileSpreadsheet className="size-4" stroke={1.75} />}
          />
        </div>
        </section>
      ) : (
        <section className="space-y-3">
          <StepHeader
            step={3}
            title="Review your numbers"
            description="Pick a fiscal period from the top bar calendar to see summaries and reports."
          />
        </section>
      )}

      <section className="space-y-3">
        <StepHeader
          step={4}
          title="Download for your accountant"
          description="One Excel file with all reports and details. Optional: add your tax ID and notes in settings first."
        />
        <div
          className={cn(
            panelClass,
            "flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
          )}
        >
          <div className="flex items-start gap-3">
            <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex size-11 shrink-0 items-center justify-center rounded-xl">
              <IconDownload className="size-5" stroke={1.75} />
            </div>
            <div>
              <p className="text-sm font-semibold">Accountant pack (.xls)</p>
              <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                Includes profit &amp; loss, balance sheet, year summary, monthly chart, sales
                &amp; purchase lists
                {hasManualEntries ? ", and your manual entries" : ""}.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href="/tax/settings">Add tax ID &amp; notes</Link>
            </Button>
            <Button type="button" size="sm" onClick={handleExportPack}>
              <IconDownload className="size-4" />
              Download pack
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
