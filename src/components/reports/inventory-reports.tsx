"use client"

import * as React from "react"
import {
  IconAdjustmentsHorizontal,
  IconCloudDownload,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import {
  FastestMoversChart,
  StockAgingChart,
  StockMovementChart,
} from "@/components/reports/inventory-reports-charts"
import { InventoryReportsSkeleton } from "@/components/reports/inventory-reports-skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useProducts } from "@/context/products-context"
import { downloadRowsAsXls } from "@/lib/excel-export"
import {
  buildInventoryMovements,
  computeInventoryAging,
  computeInventoryMovementTimeline,
  computeInventoryReportSummary,
  computeReorderRows,
  computeTopMovers,
  countActiveInventoryFilters,
  createDefaultInventoryReportFilter,
  formatDate,
  formatDaysOfCover,
  formatInventoryReportFilterLabel,
  formatInventoryReportMoney,
  INVENTORY_REPORT_PRESETS,
  listInventoryCategories,
  REORDER_LEAD_TIME_DAYS,
  reorderStatusBadgeClass,
  resolveInventoryReportRange,
  resolveInventoryTimelineBucket,
  type InventoryReorderRow,
  type InventoryReportFilter,
  type InventoryReportPreset,
} from "@/lib/inventory-reports"
import { cn } from "@/lib/utils"

const panelClass =
  "rounded-2xl bg-card shadow-sm shadow-black/[0.03] ring-1 ring-border/50"

function InventoryStatCard({
  label,
  value,
  badgeLabel,
  footerTitle,
  footerHint,
}: {
  label: string
  value: string
  badgeLabel?: string
  footerTitle: string
  footerHint: string
}) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {value}
        </CardTitle>
        {badgeLabel ? (
          <CardAction>
            <Badge variant="outline">{badgeLabel}</Badge>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">{footerTitle}</div>
        <div className="text-muted-foreground">{footerHint}</div>
      </CardFooter>
    </Card>
  )
}

function statusIconTone(status: InventoryReorderRow["status"]): string {
  if (status === "Critical") return "bg-rose-500/10 text-rose-600"
  if (status === "Reorder")
    return "bg-amber-500/15 text-amber-700 dark:text-amber-400"
  if (status === "Overstocked")
    return "bg-violet-500/15 text-violet-700 dark:text-violet-400"
  return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
}

function reorderStatusLabel(
  status: InventoryReorderRow["status"],
  t: (key: string) => string
) {
  if (status === "Critical") return t("inventoryPage.statusCritical")
  if (status === "Reorder") return t("inventoryPage.statusReorder")
  if (status === "Overstocked") return t("inventoryPage.statusOverstocked")
  return t("inventoryPage.statusHealthy")
}

function ReorderList({ rows }: { rows: InventoryReorderRow[] }) {
  const { t } = useTranslation("reports")
  return (
    <div className={cn(panelClass, "overflow-hidden")}>
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div>
          <p className="text-sm font-semibold tracking-tight">
            {t("inventoryPage.reorderSuggestions")}
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {t("inventoryPage.leadTimeHint", { days: REORDER_LEAD_TIME_DAYS })}
          </p>
        </div>
        {rows.length > 0 ? (
          <span className="text-muted-foreground rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium tabular-nums">
            {t("shared.shownCount", { count: rows.length })}
          </span>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <p className="text-muted-foreground flex items-center justify-center px-5 py-12 text-center text-sm">
          {t("inventoryPage.noProducts")}
        </p>
      ) : (
        <div className="border-border/50 border-t">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-muted-foreground h-10 px-4 text-[11px] font-semibold tracking-wide uppercase">
                  {t("inventoryPage.sku")}
                </TableHead>
                <TableHead className="text-muted-foreground h-10 px-4 text-[11px] font-semibold tracking-wide uppercase">
                  {t("inventoryPage.product")}
                </TableHead>
                <TableHead className="text-muted-foreground h-10 px-4 text-[11px] font-semibold tracking-wide uppercase">
                  {t("inventoryPage.status")}
                </TableHead>
                <TableHead className="text-muted-foreground h-10 px-4 text-right text-[11px] font-semibold tracking-wide uppercase">
                  {t("inventoryPage.onHand")}
                </TableHead>
                <TableHead className="text-muted-foreground h-10 px-4 text-right text-[11px] font-semibold tracking-wide uppercase">
                  {t("inventoryPage.dailyUse")}
                </TableHead>
                <TableHead className="text-muted-foreground h-10 px-4 text-right text-[11px] font-semibold tracking-wide uppercase">
                  {t("inventoryPage.daysCover")}
                </TableHead>
                <TableHead className="text-muted-foreground h-10 px-4 text-right text-[11px] font-semibold tracking-wide uppercase">
                  {t("inventoryPage.reorderAt")}
                </TableHead>
                <TableHead className="text-muted-foreground h-10 px-4 text-right text-[11px] font-semibold tracking-wide uppercase">
                  {t("inventoryPage.suggested")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const urgent =
                  row.status === "Critical" || row.status === "Reorder"
                return (
                  <TableRow key={row.productId} className="border-border/50">
                    <TableCell className="px-4 py-3 font-medium tabular-nums">
                      {row.sku}
                    </TableCell>
                    <TableCell className="max-w-[15rem] px-4 py-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold",
                            statusIconTone(row.status)
                          )}
                        >
                          {row.productName.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {row.productName}
                          </p>
                          <p className="text-muted-foreground truncate text-[11px]">
                            {row.category}
                            {row.daysSinceLastIssue != null
                              ? ` · ${t("inventoryPage.soldAgo", { days: row.daysSinceLastIssue })}`
                              : ` · ${t("inventoryPage.neverSold")}`}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "h-5 px-1.5 text-[10px]",
                          reorderStatusBadgeClass(row.status)
                        )}
                      >
                        {reorderStatusLabel(row.status, t)}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "px-4 py-3 text-right tabular-nums",
                        row.stock === 0 && "font-medium text-rose-600"
                      )}
                    >
                      {row.stock}
                    </TableCell>
                    <TableCell className="text-muted-foreground px-4 py-3 text-right tabular-nums">
                      {row.avgDailyUsage.toFixed(1)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "px-4 py-3 text-right tabular-nums",
                        urgent && "font-medium text-amber-700 dark:text-amber-400"
                      )}
                    >
                      {formatDaysOfCover(row.daysOfCover)}
                    </TableCell>
                    <TableCell className="text-muted-foreground px-4 py-3 text-right tabular-nums">
                      {row.reorderPoint}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "px-4 py-3 text-right tabular-nums",
                        row.suggestedQty > 0
                          ? "font-semibold"
                          : "text-muted-foreground"
                      )}
                    >
                      {row.suggestedQty > 0 ? row.suggestedQty : "—"}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function withPresetDates(
  preset: InventoryReportPreset,
  start: string,
  end: string,
  categories: string[]
): InventoryReportFilter {
  if (preset === "custom") {
    return { preset, start, end, categories }
  }
  const range = resolveInventoryReportRange({ preset, start: "", end: "" })
  return { preset, start: range.start, end: range.end, categories }
}

export function InventoryReports() {
  const { t } = useTranslation("reports")
  const { products } = useProducts()
  const [filter, setFilter] = React.useState<InventoryReportFilter>(() =>
    createDefaultInventoryReportFilter()
  )
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    const frame = window.requestAnimationFrame(() => setReady(true))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const categories = React.useMemo(
    () => listInventoryCategories(products),
    [products]
  )
  const movements = React.useMemo(
    () => buildInventoryMovements(products),
    [products]
  )
  const summary = React.useMemo(
    () => computeInventoryReportSummary(products, movements, filter),
    [filter, movements, products]
  )
  const timeline = React.useMemo(
    () => computeInventoryMovementTimeline(products, movements, filter),
    [filter, movements, products]
  )
  const aging = React.useMemo(
    () => computeInventoryAging(products, movements, filter),
    [filter, movements, products]
  )
  const movers = React.useMemo(
    () => computeTopMovers(movements, filter, 6),
    [filter, movements]
  )
  const reorderRows = React.useMemo(
    () => computeReorderRows(products, movements, filter),
    [filter, movements, products]
  )

  const periodLabel = formatInventoryReportFilterLabel(filter)
  const range = resolveInventoryReportRange(filter)
  const timelineBucket = resolveInventoryTimelineBucket(range, filter.preset)
  const activeFilterCount = countActiveInventoryFilters(filter)
  const customDatesEnabled = filter.preset === "custom"

  const setPreset = (preset: InventoryReportPreset) => {
    setFilter((prev) =>
      withPresetDates(preset, prev.start, prev.end, prev.categories)
    )
  }

  const toggleCategory = (category: string) => {
    setFilter((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((item) => item !== category)
        : [...prev.categories, category],
    }))
  }

  const resetFilters = () => {
    setFilter(createDefaultInventoryReportFilter())
  }

  const handleExport = () => {
    if (reorderRows.length === 0) {
      toast.error(t("inventoryPage.toastNoStock"))
      return
    }

    downloadRowsAsXls(
      reorderRows.map((row) => ({
        [t("inventoryPage.sku")]: row.sku,
        [t("inventoryPage.product")]: row.productName,
        [t("inventoryPage.category")]: row.category,
        [t("inventoryPage.exportBrand")]: row.brand,
        [t("inventoryPage.status")]: reorderStatusLabel(row.status, t),
        [t("inventoryPage.exportOnHand")]: row.stock,
        [t("inventoryPage.exportAvgDaily")]: row.avgDailyUsage.toFixed(2),
        [t("inventoryPage.exportDaysCover")]: formatDaysOfCover(row.daysOfCover),
        [t("inventoryPage.exportReorderPoint")]: row.reorderPoint,
        [t("inventoryPage.exportSuggestedQty")]: row.suggestedQty,
        [t("inventoryPage.exportStockValue")]: row.stockValue,
        [t("inventoryPage.exportDaysSinceSale")]:
          row.daysSinceLastIssue ?? t("inventoryPage.exportNever"),
      })),
      `inventory-report-${filter.preset}.xls`
    )
    toast.success(t("shared.toastExported"))
  }

  if (!ready) {
    return <InventoryReportsSkeleton />
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{periodLabel}</p>
          <p className="text-muted-foreground truncate text-xs">
            {formatDate(range.start)}
            {range.start !== range.end ? ` – ${formatDate(range.end)}` : ""} ·{" "}
            {t("inventoryPage.skuCount", { count: summary.skuCount })}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 lg:shrink-0">
          <Popover modal={false}>
            <div className="border-border/70 bg-background inline-flex h-9 shrink-0 items-center overflow-visible rounded-full border shadow-sm">
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "text-muted-foreground hover:bg-muted/50 hover:text-foreground relative size-9 rounded-full border-0 shadow-none",
                    activeFilterCount > 0 && "bg-primary/5 text-foreground"
                  )}
                  aria-label={t("shared.openFilters")}
                >
                  <IconAdjustmentsHorizontal className="size-4 opacity-90" />
                  {activeFilterCount > 0 ? (
                    <span className="bg-primary text-primary-foreground border-background pointer-events-none absolute top-0 right-0 z-10 flex size-5 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-[10px] font-semibold tabular-nums leading-none shadow-sm">
                      {activeFilterCount > 9 ? "9+" : activeFilterCount}
                    </span>
                  ) : null}
                </Button>
              </PopoverTrigger>
            </div>
            <PopoverContent
              align="end"
              sideOffset={6}
              className="border-border/70 text-popover-foreground w-[min(100vw-1.5rem,22rem)] max-w-[22rem] overflow-hidden rounded-xl border bg-popover p-0 shadow-xl"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <div className="from-muted/50 border-border/60 bg-gradient-to-b to-popover border-b px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <h3 className="text-foreground text-sm font-semibold tracking-tight">
                      {t("shared.reportFilters")}
                    </h3>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      {t("shared.inventoryFiltersHint")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground h-8 shrink-0 border-border/80 px-2.5 text-xs font-medium"
                    disabled={activeFilterCount === 0}
                    onClick={resetFilters}
                  >
                    {t("shared.resetFilters")}
                  </Button>
                </div>
              </div>

              <div className="max-h-[min(70vh,28rem)] space-y-4 overflow-y-auto px-4 py-3">
                <div className="space-y-2">
                  <Label className="text-muted-foreground block text-[11px] font-semibold tracking-wide uppercase">
                    {t("shared.period")}
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {INVENTORY_REPORT_PRESETS.map(({ value }) => {
                      const selected = filter.preset === value
                      return (
                        <Button
                          key={value}
                          type="button"
                          variant={selected ? "default" : "outline"}
                          size="sm"
                          className="h-7 rounded-full px-2.5 text-xs"
                          onClick={() => setPreset(value)}
                        >
                          {t(`presets.${value}`)}
                        </Button>
                      )
                    })}
                  </div>
                </div>

                <div className="border-border/80 space-y-3 border-t pt-3">
                  <Label className="text-muted-foreground block text-[11px] font-semibold tracking-wide uppercase">
                    {t("shared.dateRange")}
                  </Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="inventory-report-from" className="text-xs">
                        {t("shared.fromDate")}
                      </Label>
                      <Input
                        id="inventory-report-from"
                        type="date"
                        value={range.start}
                        max={range.end || undefined}
                        disabled={!customDatesEnabled}
                        onChange={(event) =>
                          setFilter((prev) => ({
                            ...prev,
                            preset: "custom",
                            start: event.target.value,
                          }))
                        }
                        className="border-input/80 bg-background h-8 text-sm shadow-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="inventory-report-to" className="text-xs">
                        {t("shared.toDate")}
                      </Label>
                      <Input
                        id="inventory-report-to"
                        type="date"
                        value={range.end}
                        min={range.start || undefined}
                        disabled={!customDatesEnabled}
                        onChange={(event) =>
                          setFilter((prev) => ({
                            ...prev,
                            preset: "custom",
                            end: event.target.value,
                          }))
                        }
                        className="border-input/80 bg-background h-8 text-sm shadow-none"
                      />
                    </div>
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    {customDatesEnabled
                      ? `${formatDate(range.start)} – ${formatDate(range.end)}`
                      : t("shared.switchToCustom")}
                  </p>
                </div>

                <div className="border-border/80 space-y-2 border-t pt-3">
                  <Label className="text-muted-foreground block text-[11px] font-semibold tracking-wide uppercase">
                    {t("inventoryPage.category")}
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((category) => {
                      const selected = filter.categories.includes(category)
                      return (
                        <Button
                          key={category}
                          type="button"
                          variant={selected ? "default" : "outline"}
                          size="sm"
                          className="h-7 rounded-full px-2.5 text-xs"
                          onClick={() => toggleCategory(category)}
                        >
                          {category}
                        </Button>
                      )
                    })}
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    {filter.categories.length === 0
                      ? t("inventoryPage.noSelection")
                      : t("inventoryPage.showingOf", {
                          selected: filter.categories.length,
                          total: categories.length,
                        })}
                  </p>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-full px-7 shadow-sm"
            onClick={handleExport}
          >
            <IconCloudDownload />
            <span className="hidden sm:inline">{t("shared.export")}</span>
          </Button>
        </div>
      </div>

      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 xl:grid-cols-4">
        <InventoryStatCard
          label={t("inventoryPage.unitsIssued")}
          value={String(summary.unitsIssued)}
          badgeLabel={t("inventoryPage.turn", {
            rate: summary.turnoverRate.toFixed(0),
          })}
          footerTitle={t("inventoryPage.unitsReceived", {
            count: summary.unitsReceived,
          })}
          footerHint={t("inventoryPage.netUnits", {
            sign: summary.netUnits >= 0 ? "+" : "",
            count: summary.netUnits,
          })}
        />
        <InventoryStatCard
          label={t("inventoryPage.stockOnHand")}
          value={String(summary.unitCount)}
          badgeLabel={t("inventoryPage.skuCount", { count: summary.skuCount })}
          footerTitle={t("inventoryPage.atCost", {
            amount: formatInventoryReportMoney(summary.stockValue),
          })}
          footerHint={t("inventoryPage.atRetail", {
            amount: formatInventoryReportMoney(summary.retailValue),
          })}
        />
        <InventoryStatCard
          label={t("inventoryPage.needsReordering")}
          value={String(summary.reorderCount)}
          badgeLabel={
            summary.criticalCount > 0
              ? t("inventoryPage.criticalCount", {
                  count: summary.criticalCount,
                })
              : undefined
          }
          footerTitle={
            summary.reorderCount === 0
              ? t("inventoryPage.everyLineHasCover")
              : t("inventoryPage.belowLeadTime", {
                  count: summary.criticalCount,
                })
          }
          footerHint={
            summary.avgDaysOfCover != null
              ? t("inventoryPage.avgCover", {
                  days: formatDaysOfCover(summary.avgDaysOfCover),
                })
              : t("inventoryPage.noUsage")
          }
        />
        <InventoryStatCard
          label={t("inventoryPage.deadStock")}
          value={formatInventoryReportMoney(summary.deadStockValue)}
          badgeLabel={t("inventoryPage.skuCount", {
            count: summary.deadStockCount,
          })}
          footerTitle={
            summary.deadStockCount === 0
              ? t("inventoryPage.nothingStale")
              : t("inventoryPage.capitalTied")
          }
          footerHint={t("inventoryPage.noSale60")}
        />
      </div>

      <StockMovementChart data={timeline} bucket={timelineBucket} />

      <div className="grid gap-4 lg:grid-cols-2">
        <StockAgingChart data={aging} />
        <FastestMoversChart data={movers} />
      </div>

      <ReorderList rows={reorderRows} />
    </div>
  )
}
