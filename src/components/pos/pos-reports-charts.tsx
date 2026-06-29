"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Pie,
  PieChart,
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
import { statusLabel } from "@/lib/orders"
import type {
  PosDailyTotalRow,
  PosPaymentBreakdownRow,
  PosStatusBreakdownRow,
  PosTopProductRow,
} from "@/lib/pos-reports"
import { formatPosReportMoney } from "@/lib/pos-reports"
import { cn } from "@/lib/utils"

const panelClass =
  "rounded-xl bg-card shadow-sm shadow-black/[0.04] ring-1 ring-border/40"

const axisTick = { fill: "var(--muted-foreground)", fontSize: 11 }

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-[260px] flex-col items-center justify-center gap-2 px-6 text-center">
      <div className="bg-muted/60 size-10 rounded-xl" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  )
}

function ChartPanel({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn(panelClass, "overflow-hidden", className)}>
      <div className="border-border/40 border-b px-4 py-3.5">
        <p className="text-sm font-semibold tracking-tight">{title}</p>
        {description ? (
          <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>
        ) : null}
      </div>
      <div className="bg-muted/15 p-4 pt-3">{children}</div>
    </div>
  )
}

function useChartGradientId(prefix: string) {
  const id = React.useId().replace(/:/g, "")
  return `${prefix}-${id}`
}

const dailyChartConfig = {
  sales: {
    label: "Sales",
    theme: {
      light: "oklch(0.72 0.17 128)",
      dark: "oklch(0.78 0.14 128)",
    },
  },
  returns: {
    label: "Returns",
    theme: {
      light: "oklch(0.65 0.2 25)",
      dark: "oklch(0.72 0.18 25)",
    },
  },
  net: {
    label: "Net",
    theme: {
      light: "oklch(0.55 0.14 250)",
      dark: "oklch(0.72 0.12 250)",
    },
  },
} satisfies ChartConfig

export function PosDailyTrendChart({ data }: { data: PosDailyTotalRow[] }) {
  const salesFillId = useChartGradientId("pos-sales")
  const netFillId = useChartGradientId("pos-net")

  const chartData = React.useMemo(
    () =>
      [...data].reverse().map((row) => ({
        label: row.label,
        sales: Number(row.sales),
        returns: Number(row.returns),
        net: Number(row.net),
      })),
    [data]
  )

  if (chartData.length === 0) {
    return (
      <ChartPanel title="Daily trend" description="Sales, returns, and net by day">
        <ChartEmpty message="No register activity in this period." />
      </ChartPanel>
    )
  }

  return (
    <ChartPanel title="Daily trend" description="Sales, returns, and net by day">
      <ChartContainer config={dailyChartConfig} className="aspect-auto h-[300px] w-full">
        <AreaChart
          accessibilityLayer
          data={chartData}
          margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={salesFillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-sales)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-sales)" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id={netFillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-net)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="var(--color-net)" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="4 4" className="stroke-border/50" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            minTickGap={28}
            interval="preserveStartEnd"
            tick={axisTick}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={52}
            tick={axisTick}
            tickFormatter={(value: number) =>
              value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value)
            }
          />
          <ChartTooltip
            cursor={{ stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "4 4" }}
            content={
              <ChartTooltipContent
                indicator="dot"
                labelFormatter={(label) => String(label)}
                formatter={(value, name) => (
                  <span className="font-medium tabular-nums">
                    {formatPosReportMoney(String(value))}
                  </span>
                )}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Area
            type="monotone"
            dataKey="sales"
            stroke="var(--color-sales)"
            strokeWidth={2}
            fill={`url(#${salesFillId})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="net"
            stroke="var(--color-net)"
            strokeWidth={2.5}
            fill={`url(#${netFillId})`}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="returns"
            stroke="var(--color-returns)"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            fill="none"
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        </AreaChart>
      </ChartContainer>
    </ChartPanel>
  )
}

const PAYMENT_CHART_KEYS: Record<PosPaymentBreakdownRow["method"], string> = {
  Cash: "cash",
  "Bank transfer": "bank",
  Card: "card",
  Credit: "credit",
}

const paymentChartConfig: ChartConfig = {
  cash: {
    label: "Cash",
    theme: { light: "oklch(0.72 0.17 128)", dark: "oklch(0.78 0.14 128)" },
  },
  bank: {
    label: "Bank transfer",
    theme: { light: "oklch(0.55 0.14 250)", dark: "oklch(0.72 0.12 250)" },
  },
  card: {
    label: "Card",
    theme: { light: "oklch(0.62 0.16 200)", dark: "oklch(0.75 0.13 200)" },
  },
  credit: {
    label: "Credit",
    theme: { light: "oklch(0.68 0.18 55)", dark: "oklch(0.78 0.15 55)" },
  },
}

function DonutCenterLabel({
  viewBox,
  primary,
  secondary,
}: {
  viewBox?: { cx?: number; cy?: number }
  primary: string
  secondary: string
}) {
  if (!viewBox || viewBox.cx == null || viewBox.cy == null) return null
  return (
    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={viewBox.cx} dy="-0.2em" className="fill-foreground text-base font-semibold">
        {primary}
      </tspan>
      <tspan x={viewBox.cx} dy="1.4em" className="fill-muted-foreground text-[11px]">
        {secondary}
      </tspan>
    </text>
  )
}

export function PosPaymentChart({ data }: { data: PosPaymentBreakdownRow[] }) {
  const chartData = React.useMemo(
    () =>
      data.map((row) => {
        const key = PAYMENT_CHART_KEYS[row.method]
        return {
          key,
          method: row.method,
          value: Number(row.total),
          share: row.share,
          fill: `var(--color-${key})`,
        }
      }),
    [data]
  )

  const total = chartData.reduce((sum, row) => sum + row.value, 0)

  if (chartData.length === 0) {
    return (
      <ChartPanel title="Payment methods" description="Share of completed sales">
        <ChartEmpty message="No completed sales in this period." />
      </ChartPanel>
    )
  }

  return (
    <ChartPanel title="Payment methods" description="Share of completed sales">
      <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-center lg:justify-center lg:gap-8">
        <ChartContainer
          config={paymentChartConfig}
          className="aspect-square h-[220px] w-full max-w-[220px]"
        >
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, _name, item) => (
                    <span className="tabular-nums">
                      {formatPosReportMoney(String(value))} ·{" "}
                      {Number(item.payload?.share ?? 0).toFixed(1)}%
                    </span>
                  )}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="key"
              innerRadius={58}
              outerRadius={82}
              paddingAngle={3}
              cornerRadius={6}
              strokeWidth={2}
              stroke="var(--background)"
            >
              {chartData.map((entry) => (
                <Cell key={entry.key} fill={entry.fill} />
              ))}
              <Label
                content={({ viewBox }) => (
                  <DonutCenterLabel
                    viewBox={viewBox as { cx?: number; cy?: number }}
                    primary={formatPosReportMoney(total.toFixed(2))}
                    secondary="Total sales"
                  />
                )}
              />
            </Pie>
          </PieChart>
        </ChartContainer>

        <div className="grid w-full max-w-xs gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {chartData.map((row) => (
            <div
              key={row.key}
              className="bg-background/80 flex items-center gap-2.5 rounded-lg px-3 py-2 ring-1 ring-border/40"
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: row.fill }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{row.method}</p>
                <p className="text-muted-foreground text-[11px] tabular-nums">
                  {row.share.toFixed(1)}% · {formatPosReportMoney(row.value.toFixed(2))}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ChartPanel>
  )
}

const statusChartConfig: ChartConfig = {
  completed: {
    label: "Completed",
    theme: { light: "oklch(0.72 0.17 128)", dark: "oklch(0.78 0.14 128)" },
  },
  pending: {
    label: "Pending",
    theme: { light: "oklch(0.68 0.18 55)", dark: "oklch(0.78 0.15 55)" },
  },
  cancelled: {
    label: "Cancelled",
    theme: { light: "oklch(0.65 0.2 25)", dark: "oklch(0.72 0.18 25)" },
  },
}

export function PosStatusChart({ data }: { data: PosStatusBreakdownRow[] }) {
  const chartData = React.useMemo(
    () => {
      const total = data.reduce((sum, row) => sum + Number(row.total), 0)
      return data.map((row) => ({
        status: row.status,
        label: statusLabel(row.status),
        value: Number(row.total),
        count: row.count,
        share: total > 0 ? (Number(row.total) / total) * 100 : 0,
        fill: `var(--color-${row.status})`,
      }))
    },
    [data]
  )

  const receiptTotal = chartData.reduce((sum, row) => sum + row.count, 0)

  if (chartData.length === 0) {
    return (
      <ChartPanel title="Sale status" description="Receipts by status">
        <ChartEmpty message="No sales in this period." />
      </ChartPanel>
    )
  }

  return (
    <ChartPanel title="Sale status" description="Receipts by status">
      <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-center lg:justify-center lg:gap-8">
        <ChartContainer
          config={statusChartConfig}
          className="aspect-square h-[220px] w-full max-w-[220px]"
        >
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, _name, item) => (
                    <span className="tabular-nums">
                      {formatPosReportMoney(String(value))} · {item.payload?.count} receipts
                    </span>
                  )}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="status"
              innerRadius={58}
              outerRadius={82}
              paddingAngle={3}
              cornerRadius={6}
              strokeWidth={2}
              stroke="var(--background)"
            >
              {chartData.map((entry) => (
                <Cell key={entry.status} fill={entry.fill} />
              ))}
              <Label
                content={({ viewBox }) => (
                  <DonutCenterLabel
                    viewBox={viewBox as { cx?: number; cy?: number }}
                    primary={String(receiptTotal)}
                    secondary="Receipts"
                  />
                )}
              />
            </Pie>
          </PieChart>
        </ChartContainer>

        <div className="grid w-full max-w-xs gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {chartData.map((row) => (
            <div
              key={row.status}
              className="bg-background/80 flex items-center gap-2.5 rounded-lg px-3 py-2 ring-1 ring-border/40"
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: row.fill }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium">{row.label}</p>
                <p className="text-muted-foreground text-[11px] tabular-nums">
                  {row.count} · {row.share.toFixed(0)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ChartPanel>
  )
}

const topProductsChartConfig = {
  revenue: {
    label: "Revenue",
    theme: {
      light: "oklch(0.72 0.17 128)",
      dark: "oklch(0.78 0.14 128)",
    },
  },
} satisfies ChartConfig

function truncateLabel(value: string, max = 24): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

export function PosTopProductsChart({ data }: { data: PosTopProductRow[] }) {
  const barFillId = useChartGradientId("pos-products")

  const chartData = React.useMemo(
    () =>
      data.map((row) => ({
        product: truncateLabel(row.productName),
        fullName: row.productName,
        revenue: Number(row.revenue),
        quantity: row.quantity,
      })),
    [data]
  )

  if (chartData.length === 0) {
    return (
      <ChartPanel title="Top products" description="Best sellers by revenue">
        <ChartEmpty message="No product sales in this period." />
      </ChartPanel>
    )
  }

  return (
    <ChartPanel title="Top products" description="Best sellers by revenue">
      <ChartContainer config={topProductsChartConfig} className="aspect-auto h-[300px] w-full">
        <BarChart
          accessibilityLayer
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
          barCategoryGap="20%"
        >
          <defs>
            <linearGradient id={barFillId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.85} />
              <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0.45} />
            </linearGradient>
          </defs>
          <CartesianGrid horizontal={false} strokeDasharray="4 4" className="stroke-border/50" />
          <YAxis
            type="category"
            dataKey="product"
            tickLine={false}
            axisLine={false}
            width={108}
            tick={axisTick}
          />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tick={axisTick}
            tickFormatter={(value: number) =>
              value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value)
            }
          />
          <ChartTooltip
            cursor={{ fill: "var(--muted)", opacity: 0.25 }}
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value, _name, item) => (
                  <div className="flex flex-col gap-0.5">
                    <span className="max-w-[200px] font-medium leading-snug">
                      {item.payload?.fullName}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {formatPosReportMoney(String(value))} · {item.payload?.quantity} sold
                    </span>
                  </div>
                )}
              />
            }
          />
          <Bar
            dataKey="revenue"
            radius={[0, 8, 8, 0]}
            maxBarSize={26}
            background={{ fill: "var(--muted)", opacity: 0.35, radius: 8 }}
          >
            {chartData.map((entry) => (
              <Cell key={entry.fullName} fill={`url(#${barFillId})`} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </ChartPanel>
  )
}
