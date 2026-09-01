"use client"

import * as React from "react"
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type {
  SalesDailyTotalRow,
  SalesReportSummary,
  SalesReportTrends,
  SalesTimelineBucket,
  SalesTopProductRow,
} from "@/lib/sales-reports"
import {
  formatSalesReportMoney,
  salesTimelineBucketLabel,
} from "@/lib/sales-reports"
import { cn } from "@/lib/utils"

const panelClass =
  "rounded-2xl bg-card shadow-sm shadow-black/[0.03] ring-1 ring-border/50"

/** Solid brand palette — always visible (no CSS-var theme dependency). */
const COLORS = {
  sales: "#92c720",
  net: "#2f9e9a",
  invoices: "#64748b",
  returns: "#e35d6a",
} as const

const axisTick = { fill: "var(--muted-foreground)", fontSize: 11 }

function useChartGradientId(prefix: string) {
  const id = React.useId().replace(/:/g, "")
  return `${prefix}-${id}`
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-2 px-6 text-center">
      <div className="bg-muted/50 size-10 rounded-2xl" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  )
}

function ChartPanel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn(panelClass, "overflow-hidden", className)}>
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-2">
        <div>
          <p className="text-sm font-semibold tracking-tight">{title}</p>
          {description ? (
            <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="px-3 pb-5 pt-1 sm:px-5">{children}</div>
    </div>
  )
}

function formatTrend(value: number | null): string | null {
  if (value == null || !Number.isFinite(value)) return null
  const sign = value > 0 ? "+" : ""
  return `${sign}${value.toFixed(0)}%`
}

function formatAxisMoney(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10_000 ? 0 : 1)}k`
  return String(Math.round(value))
}

function shortTickLabel(label: string, bucket: SalesTimelineBucket): string {
  if (bucket === "year") return label
  if (bucket === "month") {
    return label.replace(/ (\d{2})(\d{2})$/, " ’$2")
  }
  return label.replace(/,\s*\d{4}$/, "")
}

const performanceChartConfig = {
  sales: { label: "Sales", color: COLORS.sales },
  net: { label: "Net", color: COLORS.net },
  invoices: { label: "Invoices", color: COLORS.invoices },
} satisfies ChartConfig

export function SalesPerformanceLineChart({
  data,
  trends,
  bucket = "day",
}: {
  data: SalesDailyTotalRow[]
  summary?: SalesReportSummary
  trends: SalesReportTrends
  bucket?: SalesTimelineBucket
}) {
  const salesFillId = useChartGradientId("perf-sales")
  const netFillId = useChartGradientId("perf-net")
  const grain = salesTimelineBucketLabel(bucket).toLowerCase()

  const chartData = React.useMemo(
    () =>
      data.map((row) => ({
        label: shortTickLabel(row.label, bucket),
        fullLabel: row.label,
        date: row.date,
        sales: Number(row.sales),
        net: Number(row.net),
        invoices: row.saleCount,
      })),
    [bucket, data]
  )

  const hasActivity = chartData.some((row) => row.sales > 0 || row.net > 0)
  const netTrend = formatTrend(trends.netChangePct)

  if (!hasActivity) {
    return (
      <ChartPanel
        title="Sales performance"
        description={`${salesTimelineBucketLabel(bucket)} sales, net, and invoice volume`}
      >
        <ChartEmpty message="No sales in this period." />
      </ChartPanel>
    )
  }

  return (
    <ChartPanel
      title="Sales performance"
      description={`${salesTimelineBucketLabel(bucket)} sales, net, and invoice volume`}
      action={
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium capitalize">
            {grain}
          </span>
          {netTrend ? (
            <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-medium text-primary">
              Net {netTrend}
              {trends.compareLabel ? ` ${trends.compareLabel}` : ""}
            </span>
          ) : null}
        </div>
      }
    >
      <ChartContainer
        config={performanceChartConfig}
        className="!aspect-auto h-[340px] w-full min-h-[340px]"
      >
        <ComposedChart
          accessibilityLayer
          data={chartData}
          margin={{ top: 16, right: 8, left: 0, bottom: 4 }}
        >
          <defs>
            <linearGradient id={salesFillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.sales} stopOpacity={0.4} />
              <stop offset="100%" stopColor={COLORS.sales} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id={netFillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.net} stopOpacity={0.22} />
              <stop offset="100%" stopColor={COLORS.net} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 8"
            className="stroke-border/35"
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            minTickGap={bucket === "day" ? 22 : 16}
            interval="preserveStartEnd"
            tick={axisTick}
          />
          <YAxis
            yAxisId="money"
            tickLine={false}
            axisLine={false}
            width={46}
            tick={axisTick}
            tickFormatter={formatAxisMoney}
          />
          <YAxis
            yAxisId="count"
            orientation="right"
            tickLine={false}
            axisLine={false}
            width={28}
            tick={axisTick}
            allowDecimals={false}
          />
          <ChartTooltip
            cursor={{ stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "4 4" }}
            content={
              <ChartTooltipContent
                indicator="line"
                labelFormatter={(_, payload) => {
                  const full = payload?.[0]?.payload?.fullLabel
                  return full ? String(full) : ""
                }}
                formatter={(value, name) => {
                  const key = String(name)
                  if (key === "invoices") {
                    return (
                      <span className="font-medium tabular-nums">
                        {Number(value)} invoice{Number(value) === 1 ? "" : "s"}
                      </span>
                    )
                  }
                  return (
                    <span className="font-medium tabular-nums">
                      {formatSalesReportMoney(String(value))}
                    </span>
                  )
                }}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Area
            yAxisId="money"
            type="monotone"
            dataKey="sales"
            stroke={COLORS.sales}
            strokeWidth={2.5}
            fill={`url(#${salesFillId})`}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0, fill: COLORS.sales }}
          />
          <Area
            yAxisId="money"
            type="monotone"
            dataKey="net"
            stroke={COLORS.net}
            strokeWidth={2}
            fill={`url(#${netFillId})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: COLORS.net }}
          />
          <Line
            yAxisId="count"
            type="monotone"
            dataKey="invoices"
            stroke={COLORS.invoices}
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            activeDot={{ r: 3.5, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ChartContainer>
    </ChartPanel>
  )
}

const salesVsReturnsConfig = {
  sales: { label: "Sales", color: COLORS.sales },
  returns: { label: "Returns", color: COLORS.returns },
} satisfies ChartConfig

export function SalesVsReturnsChart({
  data,
  summary,
  trends,
  periodLabel = "Selected period",
  bucket = "day",
}: {
  data: SalesDailyTotalRow[]
  summary: SalesReportSummary
  trends: SalesReportTrends
  periodLabel?: string
  bucket?: SalesTimelineBucket
}) {
  const salesFillId = useChartGradientId("svr-sales")
  const returnsFillId = useChartGradientId("svr-returns")
  const grain = salesTimelineBucketLabel(bucket)

  const chartData = React.useMemo(
    () =>
      data.map((row) => ({
        label: shortTickLabel(row.label, bucket),
        fullLabel: row.label,
        date: row.date,
        sales: Number(row.sales),
        returns: Number(row.returns),
      })),
    [bucket, data]
  )

  const hasActivity = chartData.some((row) => row.sales > 0 || row.returns > 0)
  const returnRate =
    Number(summary.grossSales) > 0
      ? (Number(summary.totalReturns) / Number(summary.grossSales)) * 100
      : 0
  const returnsTrend = formatTrend(trends.returnsChangePct)

  if (!hasActivity) {
    return (
      <ChartPanel
        title="Sales vs returns"
        description={`${periodLabel} — ${grain.toLowerCase()} comparison`}
      >
        <ChartEmpty message="No sales or returns in this period." />
      </ChartPanel>
    )
  }

  return (
    <ChartPanel
      title="Sales vs returns"
      description={`${periodLabel} — ${grain.toLowerCase()} comparison`}
      action={
        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium tabular-nums">
          {returnRate.toFixed(0)}% return rate
          {returnsTrend && trends.compareLabel ? ` · ${returnsTrend}` : ""}
        </span>
      }
    >
      <ChartContainer
        config={salesVsReturnsConfig}
        className="!aspect-auto h-[300px] w-full min-h-[300px]"
      >
        <BarChart
          accessibilityLayer
          data={chartData}
          margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
          barCategoryGap={chartData.length > 12 ? "18%" : "22%"}
          barGap={3}
        >
          <defs>
            <linearGradient id={salesFillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.sales} stopOpacity={1} />
              <stop offset="100%" stopColor={COLORS.sales} stopOpacity={0.65} />
            </linearGradient>
            <linearGradient id={returnsFillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.returns} stopOpacity={1} />
              <stop offset="100%" stopColor={COLORS.returns} stopOpacity={0.65} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 8"
            className="stroke-border/35"
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            minTickGap={18}
            interval="preserveStartEnd"
            tick={axisTick}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={46}
            tick={axisTick}
            tickFormatter={formatAxisMoney}
          />
          <ChartTooltip
            cursor={{ fill: "var(--muted)", opacity: 0.22 }}
            content={
              <ChartTooltipContent
                indicator="dot"
                labelFormatter={(_, payload) => {
                  const full = payload?.[0]?.payload?.fullLabel
                  return full ? String(full) : ""
                }}
                formatter={(value) => (
                  <span className="font-medium tabular-nums">
                    {formatSalesReportMoney(String(value))}
                  </span>
                )}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            dataKey="sales"
            fill={`url(#${salesFillId})`}
            radius={[7, 7, 0, 0]}
            maxBarSize={36}
          />
          <Bar
            dataKey="returns"
            fill={`url(#${returnsFillId})`}
            radius={[7, 7, 0, 0]}
            maxBarSize={36}
          />
        </BarChart>
      </ChartContainer>
    </ChartPanel>
  )
}

const topProductsConfig = {
  revenue: { label: "Revenue", color: COLORS.sales },
} satisfies ChartConfig

export function SalesTopProductsChart({
  data,
}: {
  data: SalesTopProductRow[]
}) {
  const barFillId = useChartGradientId("top-products")

  const chartData = React.useMemo(() => {
    const maxRevenue = Math.max(...data.map((row) => Number(row.revenue)), 1)
    return data.map((row, index) => ({
      rank: index + 1,
      name:
        row.productName.length > 22
          ? `${row.productName.slice(0, 20)}…`
          : row.productName,
      fullName: row.productName,
      revenue: Number(row.revenue),
      quantity: row.quantity,
      share: (Number(row.revenue) / maxRevenue) * 100,
    }))
  }, [data])

  const hasActivity = chartData.some((row) => row.revenue > 0)
  const leader = chartData[0]

  if (!hasActivity) {
    return (
      <ChartPanel
        title="Top selling products"
        description="Best revenue contributors this period"
      >
        <ChartEmpty message="No product sales in this period." />
      </ChartPanel>
    )
  }

  return (
    <ChartPanel
      title="Top selling products"
      description="Best revenue contributors this period"
      action={
        leader ? (
          <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-medium text-primary">
            #{1} {leader.name}
          </span>
        ) : null
      }
    >
      <ChartContainer
        config={topProductsConfig}
        className="!aspect-auto h-[300px] w-full min-h-[300px]"
      >
        <BarChart
          accessibilityLayer
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 12, left: 4, bottom: 0 }}
          barCategoryGap="16%"
        >
          <defs>
            <linearGradient id={barFillId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={COLORS.sales} stopOpacity={0.5} />
              <stop offset="100%" stopColor={COLORS.sales} stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid
            horizontal={false}
            strokeDasharray="3 8"
            className="stroke-border/35"
          />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={axisTick}
            tickFormatter={formatAxisMoney}
          />
          <YAxis
            type="category"
            dataKey="name"
            tickLine={false}
            axisLine={false}
            width={118}
            tick={axisTick}
          />
          <ChartTooltip
            cursor={{ fill: "var(--muted)", opacity: 0.22 }}
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => {
                  const full = payload?.[0]?.payload?.fullName
                  const rank = payload?.[0]?.payload?.rank
                  return full ? `#${rank} ${full}` : ""
                }}
                formatter={(value, _name, item) => (
                  <span className="tabular-nums">
                    {formatSalesReportMoney(String(value))} ·{" "}
                    {item.payload?.quantity} sold
                  </span>
                )}
              />
            }
          />
          <Bar
            dataKey="revenue"
            fill={`url(#${barFillId})`}
            radius={[0, 10, 10, 0]}
            maxBarSize={26}
          />
        </BarChart>
      </ChartContainer>
    </ChartPanel>
  )
}
