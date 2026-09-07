"use client"

import * as React from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
  InventoryAgingRow,
  InventoryMovementBucketRow,
  InventoryTimelineBucket,
} from "@/lib/inventory-reports"
import {
  formatInventoryReportMoney,
  inventoryTimelineBucketLabel,
} from "@/lib/inventory-reports"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

const panelClass =
  "rounded-2xl bg-card shadow-sm shadow-black/[0.03] ring-1 ring-border/50"

/** Solid brand palette — always visible (no CSS-var theme dependency). */
const COLORS = {
  received: "#92c720",
  issued: "#e35d6a",
  balance: "#2f9e9a",
  movers: "#5b8def",
} as const

const AGING_COLORS = ["#3fa34d", "#9bbf30", "#e0a200", "#e35d6a"] as const

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

function formatAxisMoney(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10_000 ? 0 : 1)}k`
  return String(Math.round(value))
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

function shortTickLabel(label: string, bucket: InventoryTimelineBucket): string {
  if (bucket === "month") return label.replace(/ (\d{2})(\d{2})$/, " ’$2")
  return label.replace(/,\s*\d{4}$/, "")
}

export function StockMovementChart({
  data,
  bucket = "day",
}: {
  data: InventoryMovementBucketRow[]
  bucket?: InventoryTimelineBucket
}) {
  const { t } = useTranslation("reports")
  const receivedFillId = useChartGradientId("mv-received")
  const issuedFillId = useChartGradientId("mv-issued")
  const grain = inventoryTimelineBucketLabel(bucket)
  const movementChartConfig = {
    received: { label: t("inventoryPage.chartReceived"), color: COLORS.received },
    issued: { label: t("inventoryPage.chartIssued"), color: COLORS.issued },
    balance: { label: t("inventoryPage.chartOnHand"), color: COLORS.balance },
  } satisfies ChartConfig

  const chartData = React.useMemo(
    () =>
      data.map((row) => ({
        label: shortTickLabel(row.label, bucket),
        fullLabel: row.label,
        received: row.received,
        issued: row.issued,
        balance: row.balance,
        net: row.net,
      })),
    [bucket, data]
  )

  const hasActivity = chartData.some(
    (row) => row.received > 0 || row.issued > 0
  )
  const totalReceived = chartData.reduce((sum, row) => sum + row.received, 0)
  const totalIssued = chartData.reduce((sum, row) => sum + row.issued, 0)
  const net = totalReceived - totalIssued

  if (!hasActivity) {
    return (
      <ChartPanel
        title={t("inventoryPage.stockMovement")}
        description={t("inventoryPage.movementHint", {
          bucket: inventoryTimelineBucketLabel(bucket),
        })}
      >
        <ChartEmpty message={t("inventoryPage.noMovement")} />
      </ChartPanel>
    )
  }

  return (
    <ChartPanel
      title={t("inventoryPage.stockMovement")}
      description={t("inventoryPage.movementHint", {
        bucket: inventoryTimelineBucketLabel(bucket),
      })}
      action={
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium capitalize">
            {grain}
          </span>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-medium tabular-nums",
              net >= 0
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                : "bg-rose-500/15 text-rose-700 dark:text-rose-400"
            )}
          >
            {t("inventoryPage.netUnitsBadge", {
              sign: net >= 0 ? "+" : "",
              count: net,
            })}
          </span>
        </div>
      }
    >
      <ChartContainer
        config={movementChartConfig}
        className="!aspect-auto h-[340px] w-full min-h-[340px]"
      >
        <ComposedChart
          accessibilityLayer
          data={chartData}
          margin={{ top: 16, right: 8, left: 0, bottom: 4 }}
          barGap={3}
        >
          <defs>
            <linearGradient id={receivedFillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.received} stopOpacity={1} />
              <stop
                offset="100%"
                stopColor={COLORS.received}
                stopOpacity={0.65}
              />
            </linearGradient>
            <linearGradient id={issuedFillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.issued} stopOpacity={1} />
              <stop offset="100%" stopColor={COLORS.issued} stopOpacity={0.65} />
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
            yAxisId="units"
            tickLine={false}
            axisLine={false}
            width={40}
            tick={axisTick}
            allowDecimals={false}
          />
          <YAxis
            yAxisId="balance"
            orientation="right"
            tickLine={false}
            axisLine={false}
            width={44}
            tick={axisTick}
            allowDecimals={false}
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
                formatter={(value, name) => (
                  <span className="font-medium tabular-nums">
                    {String(name) === "balance"
                      ? t("inventoryPage.unitsOnHand", { count: Number(value) })
                      : t("inventoryPage.unitsCount", { count: Number(value) })}
                  </span>
                )}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            yAxisId="units"
            dataKey="received"
            fill={`url(#${receivedFillId})`}
            radius={[7, 7, 0, 0]}
            maxBarSize={34}
          />
          <Bar
            yAxisId="units"
            dataKey="issued"
            fill={`url(#${issuedFillId})`}
            radius={[7, 7, 0, 0]}
            maxBarSize={34}
          />
          <Line
            yAxisId="balance"
            type="monotone"
            dataKey="balance"
            stroke={COLORS.balance}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4.5, strokeWidth: 0, fill: COLORS.balance }}
          />
        </ComposedChart>
      </ChartContainer>
    </ChartPanel>
  )
}

export function StockAgingChart({ data }: { data: InventoryAgingRow[] }) {
  const { t } = useTranslation("reports")
  const agingChartConfig = {
    stockValue: { label: t("inventoryPage.chartStockValue"), color: AGING_COLORS[0] },
  } satisfies ChartConfig
  const chartData = React.useMemo(
    () =>
      data.map((row) => ({
        label: t(`aging.${agingBucketKey(row.bucket)}`),
        bucket: row.bucket,
        stockValue: Number(row.stockValue),
        skuCount: row.skuCount,
        units: row.units,
        share: row.share,
      })),
    [data, t]
  )

  const hasActivity = chartData.some((row) => row.stockValue > 0)
  const stale = data
    .filter((row) => row.bucket === "61-90 days" || row.bucket === "90+ days")
    .reduce((sum, row) => sum + row.share, 0)

  if (!hasActivity) {
    return (
      <ChartPanel
        title={t("inventoryPage.stockAging")}
        description={t("inventoryPage.agingHint")}
      >
        <ChartEmpty message={t("inventoryPage.noStockToAge")} />
      </ChartPanel>
    )
  }

  return (
    <ChartPanel
      title={t("inventoryPage.stockAging")}
      description={t("inventoryPage.agingHint")}
      action={
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-medium tabular-nums",
            stale > 25
              ? "bg-rose-500/15 text-rose-700 dark:text-rose-400"
              : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
          )}
        >
          {t("inventoryPage.percentStale", { rate: stale.toFixed(0) })}
        </span>
      }
    >
      <ChartContainer
        config={agingChartConfig}
        className="!aspect-auto h-[300px] w-full min-h-[300px]"
      >
        <BarChart
          accessibilityLayer
          data={chartData}
          margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
          barCategoryGap="26%"
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
            width={46}
            tick={axisTick}
            tickFormatter={formatAxisMoney}
          />
          <ChartTooltip
            cursor={{ fill: "var(--muted)", opacity: 0.22 }}
            content={
              <ChartTooltipContent
                indicator="dot"
                formatter={(value, _name, item) => (
                  <span className="tabular-nums">
                    {t("inventoryPage.agingTooltip", {
                      amount: formatInventoryReportMoney(String(value)),
                      skuCount: item.payload?.skuCount,
                      units: item.payload?.units,
                    })}
                  </span>
                )}
              />
            }
          />
          <Bar dataKey="stockValue" radius={[8, 8, 0, 0]} maxBarSize={62}>
            {chartData.map((row, index) => (
              <Cell key={row.label} fill={AGING_COLORS[index] ?? AGING_COLORS[3]} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </ChartPanel>
  )
}

export function FastestMoversChart({
  data,
}: {
  data: { sku: string; productName: string; issued: number; value: string }[]
}) {
  const { t } = useTranslation("reports")
  const barFillId = useChartGradientId("movers")
  const moversConfig = {
    issued: { label: t("inventoryPage.unitsIssued"), color: COLORS.movers },
  } satisfies ChartConfig

  const chartData = React.useMemo(
    () =>
      data.map((row, index) => ({
        rank: index + 1,
        name: truncate(row.productName),
        fullName: row.productName,
        sku: row.sku,
        issued: row.issued,
        value: Number(row.value),
      })),
    [data]
  )

  const hasActivity = chartData.some((row) => row.issued > 0)
  const leader = chartData[0]

  if (!hasActivity) {
    return (
      <ChartPanel
        title={t("inventoryPage.fastestMovers")}
        description={t("inventoryPage.moversHint")}
      >
        <ChartEmpty message={t("inventoryPage.nothingMoved")} />
      </ChartPanel>
    )
  }

  return (
    <ChartPanel
      title={t("inventoryPage.fastestMovers")}
      description={t("inventoryPage.moversHint")}
      action={
        leader ? (
          <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-medium text-primary">
            #{1} {leader.name}
          </span>
        ) : null
      }
    >
      <ChartContainer
        config={moversConfig}
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
              <stop offset="0%" stopColor={COLORS.movers} stopOpacity={0.5} />
              <stop offset="100%" stopColor={COLORS.movers} stopOpacity={1} />
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
            allowDecimals={false}
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
                  const sku = payload?.[0]?.payload?.sku
                  return full ? `${full} · ${sku}` : ""
                }}
                formatter={(value, _name, item) => (
                  <span className="tabular-nums">
                    {t("inventoryPage.moverTooltip", {
                      count: Number(value),
                      amount: formatInventoryReportMoney(
                        String(item.payload?.value ?? 0)
                      ),
                    })}
                  </span>
                )}
              />
            }
          />
          <Bar
            dataKey="issued"
            fill={`url(#${barFillId})`}
            radius={[0, 10, 10, 0]}
            maxBarSize={26}
          />
        </BarChart>
      </ChartContainer>
    </ChartPanel>
  )
}
