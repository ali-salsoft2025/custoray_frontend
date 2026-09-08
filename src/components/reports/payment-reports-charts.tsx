"use client"

import * as React from "react"
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
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
  PaymentAgingRow,
  PaymentCashFlowRow,
  PaymentPartyRow,
  PaymentReportTrends,
  PaymentTimelineBucket,
} from "@/lib/payment-reports"
import {
  formatPaymentReportMoney,
  paymentTimelineBucketLabel,
} from "@/lib/payment-reports"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

const panelClass =
  "rounded-2xl bg-card shadow-sm shadow-black/[0.03] ring-1 ring-border/50"

/** Solid brand palette — always visible (no CSS-var theme dependency). */
const COLORS = {
  received: "#92c720",
  paidOut: "#e35d6a",
  net: "#2f9e9a",
  receivable: "#5b8def",
  payable: "#e0a200",
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
  const abs = Math.abs(value)
  const sign = value < 0 ? "-" : ""
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(abs >= 10_000 ? 0 : 1)}k`
  return `${sign}${Math.round(abs)}`
}

function truncate(value: string, max = 22): string {
  return value.length > max ? `${value.slice(0, max - 2)}…` : value
}

function agingBucketKey(bucket: string): "d0_30" | "d31_60" | "d61_90" | "d90plus" {
  if (bucket.startsWith("0-30")) return "d0_30"
  if (bucket.startsWith("31-60")) return "d31_60"
  if (bucket.startsWith("61-90")) return "d61_90"
  return "d90plus"
}

function shortTickLabel(label: string, bucket: PaymentTimelineBucket): string {
  if (bucket === "year") return label
  if (bucket === "month") return label.replace(/ (\d{2})(\d{2})$/, " ’$2")
  return label.replace(/,\s*\d{4}$/, "")
}

export function CashFlowChart({
  data,
  trends,
  bucket = "day",
}: {
  data: PaymentCashFlowRow[]
  trends: PaymentReportTrends
  bucket?: PaymentTimelineBucket
}) {
  const { t } = useTranslation("reports")
  const netFillId = useChartGradientId("cf-net")
  const grain = paymentTimelineBucketLabel(bucket)
  const cashFlowConfig = {
    received: { label: t("paymentsPage.chartReceived"), color: COLORS.received },
    paidOut: { label: t("paymentsPage.chartPaidOut"), color: COLORS.paidOut },
    net: { label: t("purchasesPage.chartNet"), color: COLORS.net },
  } satisfies ChartConfig

  const chartData = React.useMemo(
    () =>
      data.map((row) => ({
        label: shortTickLabel(row.label, bucket),
        fullLabel: row.label,
        received: Number(row.received),
        paidOut: Number(row.paidOut),
        net: Number(row.net),
      })),
    [bucket, data]
  )

  const hasActivity = chartData.some(
    (row) => row.received > 0 || row.paidOut > 0
  )
  const netTrend = formatTrend(trends.netChangePct)

  if (!hasActivity) {
    return (
      <ChartPanel
        title={t("paymentsPage.cashFlow")}
        description={t("paymentsPage.cashFlowHint", {
          bucket: paymentTimelineBucketLabel(bucket),
        })}
      >
        <ChartEmpty message={t("paymentsPage.noSettled")} />
      </ChartPanel>
    )
  }

  return (
    <ChartPanel
      title={t("paymentsPage.cashFlow")}
      description={t("paymentsPage.cashFlowHint", {
        bucket: paymentTimelineBucketLabel(bucket),
      })}
      action={
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium capitalize">
            {grain}
          </span>
          {netTrend ? (
            <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-medium text-primary">
              {t("paymentsPage.netTrend", { trend: netTrend })}
              {trends.compareLabel ? ` ${trends.compareLabel}` : ""}
            </span>
          ) : null}
        </div>
      }
    >
      <ChartContainer
        config={cashFlowConfig}
        className="!aspect-auto h-[340px] w-full min-h-[340px]"
      >
        <ComposedChart
          accessibilityLayer
          data={chartData}
          margin={{ top: 16, right: 8, left: 0, bottom: 4 }}
          barGap={3}
        >
          <defs>
            <linearGradient id={netFillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.net} stopOpacity={0.28} />
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
            tickLine={false}
            axisLine={false}
            width={50}
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
                    {formatPaymentReportMoney(String(value))}
                  </span>
                )}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            dataKey="received"
            fill={COLORS.received}
            radius={[7, 7, 0, 0]}
            maxBarSize={30}
          />
          <Bar
            dataKey="paidOut"
            fill={COLORS.paidOut}
            radius={[7, 7, 0, 0]}
            maxBarSize={30}
          />
          <Area
            type="monotone"
            dataKey="net"
            stroke={COLORS.net}
            strokeWidth={2.5}
            fill={`url(#${netFillId})`}
            dot={false}
            activeDot={{ r: 4.5, strokeWidth: 0, fill: COLORS.net }}
          />
        </ComposedChart>
      </ChartContainer>
    </ChartPanel>
  )
}

export function OutstandingAgingChart({ data }: { data: PaymentAgingRow[] }) {
  const { t } = useTranslation("reports")
  const agingConfig = {
    receivable: { label: t("paymentsPage.chartReceivable"), color: COLORS.receivable },
    payable: { label: t("paymentsPage.chartPayable"), color: COLORS.payable },
  } satisfies ChartConfig
  const chartData = React.useMemo(
    () =>
      data.map((row) => ({
        label: t(`aging.${agingBucketKey(row.bucket)}`),
        bucket: row.bucket,
        receivable: Number(row.receivable),
        payable: Number(row.payable),
        receivableCount: row.receivableCount,
        payableCount: row.payableCount,
      })),
    [data, t]
  )

  const hasActivity = chartData.some(
    (row) => row.receivable > 0 || row.payable > 0
  )
  const overdue = chartData
    .filter((row) => row.bucket !== "0-30 days")
    .reduce((sum, row) => sum + row.receivable + row.payable, 0)

  if (!hasActivity) {
    return (
      <ChartPanel
        title={t("paymentsPage.outstandingAging")}
        description={t("paymentsPage.agingHint")}
      >
        <ChartEmpty message={t("paymentsPage.nothingOutstanding")} />
      </ChartPanel>
    )
  }

  return (
    <ChartPanel
      title={t("paymentsPage.outstandingAging")}
      description={t("paymentsPage.agingHint")}
      action={
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-medium tabular-nums",
            overdue > 0
              ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
              : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
          )}
        >
          {overdue > 0
            ? t("paymentsPage.past30d", {
                amount: formatPaymentReportMoney(String(overdue)),
              })
            : t("paymentsPage.allCurrent")}
        </span>
      }
    >
      <ChartContainer
        config={agingConfig}
        className="!aspect-auto h-[300px] w-full min-h-[300px]"
      >
        <BarChart
          accessibilityLayer
          data={chartData}
          margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
          barCategoryGap="26%"
          barGap={3}
        >
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
            interval={0}
            tick={axisTick}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={50}
            tick={axisTick}
            tickFormatter={formatAxisMoney}
          />
          <ChartTooltip
            cursor={{ fill: "var(--muted)", opacity: 0.22 }}
            content={
              <ChartTooltipContent
                indicator="dot"
                formatter={(value, name, item) => {
                  const isReceivable = String(name) === "receivable"
                  const count = isReceivable
                    ? item.payload?.receivableCount
                    : item.payload?.payableCount
                  return (
                    <span className="tabular-nums">
                      {formatPaymentReportMoney(String(value))} ·{" "}
                      {t("paymentsPage.openCount", { count })}
                    </span>
                  )
                }}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            dataKey="receivable"
            fill={COLORS.receivable}
            radius={[7, 7, 0, 0]}
            maxBarSize={38}
          />
          <Bar
            dataKey="payable"
            fill={COLORS.payable}
            radius={[7, 7, 0, 0]}
            maxBarSize={38}
          />
        </BarChart>
      </ChartContainer>
    </ChartPanel>
  )
}

export function TopPartiesChart({
  data,
  title,
  description,
  color = COLORS.received,
}: {
  data: PaymentPartyRow[]
  title: string
  description: string
  color?: string
}) {
  const { t } = useTranslation("reports")
  const barFillId = useChartGradientId("parties")
  const partiesConfig = {
    total: { label: t("paymentsPage.chartTotal"), color: COLORS.received },
  } satisfies ChartConfig

  const chartData = React.useMemo(
    () =>
      data.map((row, index) => ({
        rank: index + 1,
        name: truncate(row.partyName),
        fullName: row.partyName,
        total: Number(row.total),
        paymentCount: row.paymentCount,
      })),
    [data]
  )

  const hasActivity = chartData.some((row) => row.total > 0)
  const leader = chartData[0]

  if (!hasActivity) {
    return (
      <ChartPanel title={title} description={description}>
        <ChartEmpty message={t("paymentsPage.noSettled")} />
      </ChartPanel>
    )
  }

  return (
    <ChartPanel
      title={title}
      description={description}
      action={
        leader ? (
          <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-medium text-primary">
            #{1} {leader.name}
          </span>
        ) : null
      }
    >
      <ChartContainer
        config={partiesConfig}
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
              <stop offset="0%" stopColor={color} stopOpacity={0.5} />
              <stop offset="100%" stopColor={color} stopOpacity={1} />
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
            width={128}
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
                    {formatPaymentReportMoney(String(value))} ·{" "}
                    {t("paymentsPage.paymentCount", {
                      count: item.payload?.paymentCount,
                    })}
                  </span>
                )}
              />
            }
          />
          <Bar
            dataKey="total"
            fill={`url(#${barFillId})`}
            radius={[0, 10, 10, 0]}
            maxBarSize={26}
          />
        </BarChart>
      </ChartContainer>
    </ChartPanel>
  )
}
