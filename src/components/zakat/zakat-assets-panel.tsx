"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconArrowRight,
  IconBuildingBank,
  IconCash,
  IconPackage,
  IconReceipt,
  IconSettings,
  IconSearch,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useZakat } from "@/context/zakat-context"
import { formatZakatMoney } from "@/lib/zakat"
import { useTranslation } from "react-i18next"

function AssetRow({
  icon,
  label,
  hint,
  value,
  href,
  action,
}: {
  icon: React.ReactNode
  label: string
  hint: string
  value: number
  href: string
  action: string
}) {
  return (
    <div className="flex flex-col gap-3 border-b px-5 py-4 last:border-b-0 sm:flex-row sm:items-center">
      <div className="text-primary flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/20">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-muted-foreground text-xs">{hint}</p>
      </div>
      <p className="text-sm font-semibold tabular-nums">{formatZakatMoney(value)}</p>
      <Button asChild variant="ghost" size="sm" className="rounded-full">
        <Link href={href}>
          {action}
          <IconArrowRight className="size-4" />
        </Link>
      </Button>
    </div>
  )
}

export function ZakatAssetsPanel() {
  const { t } = useTranslation("zakat")
  const { calculation, settings } = useZakat()
  const [search, setSearch] = React.useState("")
  const query = search.trim().toLowerCase()
  const visibleLines = calculation.inventoryLines.filter(
    (line) =>
      !query ||
      line.name.toLowerCase().includes(query) ||
      line.sku.toLowerCase().includes(query) ||
      line.category.toLowerCase().includes(query)
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{t("assetsPage.title")}</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("assetsPage.hint")}
        </p>
      </div>

      <section className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <AssetRow
          icon={<IconCash className="size-4" />}
          label={t("assetsPage.cashAccounts")}
          hint={t("assetsPage.cashHint")}
          value={calculation.assets.cash}
          href="/zakat/settings"
          action={t("assetsPage.settings")}
        />
        <AssetRow
          icon={<IconBuildingBank className="size-4" />}
          label={t("assetsPage.bankAccounts")}
          hint={t("assetsPage.bankHint")}
          value={calculation.assets.bank}
          href="/zakat/settings"
          action={t("assetsPage.settings")}
        />
        <AssetRow
          icon={<IconPackage className="size-4" />}
          label={t("assetsPage.inventory")}
          hint={t("assetsPage.inventoryHint", {
            method:
              settings.inventoryValuation === "cost"
                ? t("assetsPage.cost")
                : t("assetsPage.selling"),
          })}
          value={calculation.assets.inventory}
          href="/inventory/products"
          action={t("assetsPage.inventory")}
        />
        <AssetRow
          icon={<IconReceipt className="size-4" />}
          label={t("assetsPage.receivables")}
          hint={t("assetsPage.receivablesHint")}
          value={calculation.assets.receivables}
          href="/customers"
          action={t("assetsPage.customers")}
        />
        <AssetRow
          icon={<IconSettings className="size-4" />}
          label={t("assetsPage.manualAdjustment")}
          hint={t("assetsPage.manualHint")}
          value={calculation.assets.manualAdjustment}
          href="/zakat/settings"
          action={t("assetsPage.settings")}
        />
        <div className="flex items-center justify-between gap-4 bg-muted/20 px-5 py-4">
          <p className="text-sm font-semibold">{t("assetsPage.totalAssets")}</p>
          <p className="text-lg font-semibold tabular-nums">
            {formatZakatMoney(calculation.assets.total)}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold">{t("assetsPage.inventoryContribution")}</h3>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {t("assetsPage.productsUnits", {
                products: calculation.inventoryLines.length,
                units: calculation.inventoryUnits.toLocaleString(),
              })}
            </p>
          </div>
          <SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("assetsPage.searchPlaceholder")}
            icon={<IconSearch className="size-4" />}
            className="rounded-full sm:max-w-sm"
          />
        </div>
        <div className="max-h-[32rem] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                <TableHead>{t("assetsPage.product")}</TableHead>
                <TableHead>{t("assetsPage.category")}</TableHead>
                <TableHead className="text-center">{t("assetsPage.quantity")}</TableHead>
                <TableHead className="text-right">{t("assetsPage.unitValue")}</TableHead>
                <TableHead className="text-right">{t("assetsPage.total")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleLines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    {t("assetsPage.noMatches")}
                  </TableCell>
                </TableRow>
              ) : (
                visibleLines.map((line) => (
                  <TableRow key={line.productId}>
                    <TableCell>
                      <p className="font-medium">{line.name}</p>
                      <p className="text-muted-foreground text-xs">{line.sku}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {line.category}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {line.quantity.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatZakatMoney(line.unitValue)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatZakatMoney(line.totalValue)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  )
}
