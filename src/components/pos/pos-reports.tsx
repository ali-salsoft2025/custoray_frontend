"use client"

import * as React from "react"
import { IconDownload } from "@tabler/icons-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import {
  PosDailyTrendChart,
  PosPaymentChart,
  PosStatusChart,
  PosTopProductsChart,
} from "@/components/pos/pos-reports-charts"
import { Button } from "@/components/ui/button"
import { useOrders } from "@/context/orders-context"
import { useReturns } from "@/context/returns-context"
import { downloadRowsAsXls } from "@/lib/excel-export"
import {
  computePosDailyTotals,
  computePosPaymentBreakdown,
  computePosReportSummary,
  computePosStatusBreakdown,
  computePosTopProducts,
  formatPosReportMoney,
  POS_REPORT_PERIODS,
  type PosReportPeriod,
} from "@/lib/pos-reports"
import { cn } from "@/lib/utils"

const panelClass =
  "rounded-xl bg-card shadow-sm shadow-black/[0.04] ring-1 ring-border/40"

function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className={cn(panelClass, "p-4")}>
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight">{value}</p>
      {hint ? <p className="text-muted-foreground mt-1 text-[11px]">{hint}</p> : null}
    </div>
  )
}

export function PosReports() {
  const { t } = useTranslation("pos")
  const { t: tc } = useTranslation("common")
  const { orders } = useOrders()
  const { returns } = useReturns()
  const [period, setPeriod] = React.useState<PosReportPeriod>("7d")

  const summary = React.useMemo(
    () => computePosReportSummary(orders, returns, period),
    [orders, period, returns]
  )
  const paymentBreakdown = React.useMemo(
    () => computePosPaymentBreakdown(orders, period),
    [orders, period]
  )
  const statusBreakdown = React.useMemo(
    () => computePosStatusBreakdown(orders, period),
    [orders, period]
  )
  const topProducts = React.useMemo(
    () => computePosTopProducts(orders, period),
    [orders, period]
  )
  const dailyTotals = React.useMemo(
    () => computePosDailyTotals(orders, returns, period),
    [orders, period, returns]
  )

  const handleExport = () => {
    if (dailyTotals.length === 0) {
      toast.error(t("reportsPage.toastNoData"))
      return
    }

    downloadRowsAsXls(
      dailyTotals.map((row) => ({
        [t("reportsPage.exportDate")]: row.label,
        [t("reportsPage.exportSales")]: row.sales,
        [t("reportsPage.exportReturns")]: row.returns,
        [t("reportsPage.exportNet")]: row.net,
        [t("reportsPage.exportSaleCount")]: row.saleCount,
        [t("reportsPage.exportReturnCount")]: row.returnCount,
      })),
      `pos-report-${period}.xls`
    )
    toast.success(t("reportsPage.toastExported"))
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{t("reportsPage.title")}</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("reportsPage.hint")}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleExport}>
          <IconDownload className="size-4" />
          {tc("actions.export")}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {POS_REPORT_PERIODS.map(({ value }) => (
          <button
            key={value}
            type="button"
            onClick={() => setPeriod(value)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors ring-1",
              period === value
                ? "bg-primary text-primary-foreground ring-primary"
                : "bg-muted/30 text-muted-foreground ring-border/40 hover:text-foreground"
            )}
          >
            {t(`periods.${value}`)}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("reportsPage.grossSales")}
          value={formatPosReportMoney(summary.grossSales)}
          hint={t("reportsPage.receiptCount", { count: summary.saleCount })}
        />
        <StatCard
          label={t("reportsPage.returns")}
          value={formatPosReportMoney(summary.totalReturns)}
          hint={t("reportsPage.returnCount", { count: summary.returnCount })}
        />
        <StatCard
          label={t("reportsPage.netSales")}
          value={formatPosReportMoney(summary.netSales)}
          hint={t("reportsPage.itemsSold", { count: summary.itemsSold })}
        />
        <StatCard
          label={t("reportsPage.avgTicket")}
          value={formatPosReportMoney(summary.avgTicket)}
          hint={t("reportsPage.completedOnly")}
        />
      </div>

      <PosDailyTrendChart data={dailyTotals} />

      <div className="grid gap-4 lg:grid-cols-2">
        <PosPaymentChart data={paymentBreakdown} />
        <PosStatusChart data={statusBreakdown} />
      </div>

      <PosTopProductsChart data={topProducts} />

      <div className={cn(panelClass, "overflow-hidden")}>
        <div className="border-border/40 border-b px-4 py-3">
          <p className="text-sm font-semibold">{t("reportsPage.dailyBreakdown")}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">{t("reportsPage.detailedTotals")}</p>
        </div>
        {dailyTotals.length === 0 ? (
          <p className="text-muted-foreground px-4 py-8 text-center text-sm">
            {t("reportsPage.noActivity")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-muted-foreground border-border/40 border-b text-left text-xs">
                  <th className="px-4 py-2 font-medium">{t("reportsPage.date")}</th>
                  <th className="px-4 py-2 text-right font-medium">{t("reportsPage.sales")}</th>
                  <th className="px-4 py-2 text-right font-medium">{t("reportsPage.returns")}</th>
                  <th className="px-4 py-2 text-right font-medium">{t("reportsPage.net")}</th>
                  <th className="px-4 py-2 text-right font-medium">{t("reportsPage.receipts")}</th>
                </tr>
              </thead>
              <tbody>
                {dailyTotals.map((row) => (
                  <tr key={row.date} className="border-border/30 border-b last:border-0">
                    <td className="px-4 py-2.5">{row.label}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {formatPosReportMoney(row.sales)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {formatPosReportMoney(row.returns)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                      {formatPosReportMoney(row.net)}
                    </td>
                    <td className="text-muted-foreground px-4 py-2.5 text-right text-xs tabular-nums">
                      {row.saleCount} / {row.returnCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
