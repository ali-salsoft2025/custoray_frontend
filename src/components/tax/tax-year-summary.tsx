"use client"

import Link from "next/link"
import { IconDownload, IconArrowRight } from "@tabler/icons-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

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
  const { t } = useTranslation("tax")
  const { t: tc } = useTranslation("common")
  const { settings } = useTaxSettings()
  const bundle = useTaxReportBundle()
  const profile = useTaxDisplayProfile()
  const fmt = useTaxFormatMoney()

  const handleExport = () => {
    if (!bundle) {
      toast.error(t("toastPickPeriod"))
      return
    }
    downloadTaxReportXls(
      "tax-year-summary.xls",
      buildTaxExportMeta(settings, bundle.range),
      yearSummaryToRows(bundle.yearSummary, profile)
    )
    toast.success(t("toastDownloaded"))
  }

  const summary = bundle?.yearSummary

  return (
    <TaxPageLayout
      step={3}
      title={t("ys.title")}
      subtitle={t("ys.subtitle")}
      explainTitle={t("ys.explainTitle")}
      explainBody={t("ys.explainBody")}
      actions={
        <Button type="button" variant="outline" size="sm" onClick={handleExport}>
          <IconDownload className="size-4" />
          {tc("actions.download")}
        </Button>
      }
    >
      {bundle && summary ? (
        <>
          <StatCardsGrid>
            <StatCard
              label={t("ys.salesInvoices")}
              value={String(summary.counts.salesInvoices)}
              hint={t("stillPending", { count: summary.counts.pendingSales })}
            />
            <StatCard
              label={t("ys.purchaseOrders")}
              value={String(summary.counts.purchaseOrders)}
              hint={t("stillPending", { count: summary.counts.pendingPurchases })}
            />
            <StatCard
              label={t("ys.returns")}
              value={String(
                summary.counts.salesReturns + summary.counts.purchaseReturns
              )}
              hint={t("ys.returnsHint")}
            />
            <StatCard
              label={t("ys.paymentsLogged")}
              value={String(
                summary.counts.customerPayments + summary.counts.vendorPayments
              )}
              hint={t("ys.moneyInOut")}
            />
          </StatCardsGrid>

          <TaxReportTable lines={yearSummaryToRows(summary, profile)} />

          {summary.monthly.length > 0 ? (
            <div className={cn(panelClass, "overflow-hidden")}>
              <div className="border-border/40 border-b px-4 py-3">
                <p className="text-sm font-semibold">{t("ys.monthByMonth")}</p>
                <p className="text-muted-foreground text-xs">{t("ys.monthHint")}</p>
              </div>
              <div className="hidden grid-cols-4 gap-2 border-border/40 border-b px-4 py-2 text-[11px] font-medium sm:grid">
                <span>{t("ys.month")}</span>
                <span>{t("ys.moneyInCol")}</span>
                <span>{t("ys.moneyOutCol")}</span>
                <span>{t("ys.difference")}</span>
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
            <PartyList title={t("ys.topCustomers")} rows={summary.topCustomers} fmt={fmt} />
            <PartyList title={t("ys.topVendors")} rows={summary.topVendors} fmt={fmt} />
          </div>

          <TaxReportFootnote />

          <Button type="button" size="sm" className="w-fit" asChild>
            <Link href="/tax">
              {t("ys.backToPack")}
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

function PartyList({
  title,
  rows,
  fmt,
}: {
  title: string
  rows: { name: string; total: number; count: number }[]
  fmt: (value: number | string) => string
}) {
  const { t } = useTranslation("tax")
  return (
    <div className={cn(panelClass, "overflow-hidden")}>
      <div className="border-border/40 border-b px-4 py-3">
        <p className="text-sm font-semibold">{title}</p>
      </div>
      {rows.length === 0 ? (
        <p className="text-muted-foreground px-4 py-6 text-sm">{t("ys.noData")}</p>
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
                  {t("ys.transaction", { count: row.count })}
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
