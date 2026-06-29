"use client"

import * as React from "react"
import { IconDownload } from "@tabler/icons-react"
import { toast } from "sonner"

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
      toast.error("No data to export for this period.")
      return
    }

    downloadRowsAsXls(
      dailyTotals.map((row) => ({
        Date: row.label,
        Sales: row.sales,
        Returns: row.returns,
        Net: row.net,
        "Sale count": row.saleCount,
        "Return count": row.returnCount,
      })),
      `pos-report-${period}.xls`
    )
    toast.success("Report exported.")
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">POS reports</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Charts and summaries from register sales and returns.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleExport}>
          <IconDownload className="size-4" />
          Export
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {POS_REPORT_PERIODS.map(({ value, label }) => (
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
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Gross sales"
          value={formatPosReportMoney(summary.grossSales)}
          hint={`${summary.saleCount} receipt${summary.saleCount === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Returns"
          value={formatPosReportMoney(summary.totalReturns)}
          hint={`${summary.returnCount} return${summary.returnCount === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Net sales"
          value={formatPosReportMoney(summary.netSales)}
          hint={`${summary.itemsSold} items sold`}
        />
        <StatCard
          label="Avg. ticket"
          value={formatPosReportMoney(summary.avgTicket)}
          hint="Completed sales only"
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
          <p className="text-sm font-semibold">Daily breakdown</p>
          <p className="text-muted-foreground mt-0.5 text-xs">Detailed totals by date</p>
        </div>
        {dailyTotals.length === 0 ? (
          <p className="text-muted-foreground px-4 py-8 text-center text-sm">
            No register activity in this period.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-muted-foreground border-border/40 border-b text-left text-xs">
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 text-right font-medium">Sales</th>
                  <th className="px-4 py-2 text-right font-medium">Returns</th>
                  <th className="px-4 py-2 text-right font-medium">Net</th>
                  <th className="px-4 py-2 text-right font-medium">Receipts</th>
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
