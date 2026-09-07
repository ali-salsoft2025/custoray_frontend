"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconBell,
  IconBuildingBank,
  IconCash,
  IconPackage,
  IconReceipt,
  IconRefresh,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import { StatCard, StatCardsGrid } from "@/components/stat-card"
import { ZakatFinalizeDialog } from "@/components/zakat/zakat-finalize-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useZakat } from "@/context/zakat-context"
import {
  addLunarYear,
  daysSince,
  formatZakatDate,
  formatZakatMoney,
} from "@/lib/zakat"

export function ZakatOverview() {
  const { t } = useTranslation("zakat")
  const { calculation, settings, history, refreshCalculation } = useZakat()
  const [finalizeOpen, setFinalizeOpen] = React.useState(false)
  const latest = history[0]
  const lastPaidDate = latest?.paymentDate || settings.lastPaidDate
  const nextDue = addLunarYear(lastPaidDate)
  const elapsed = daysSince(lastPaidDate)
  const daysUntilDue = nextDue
    ? Math.ceil(
        (new Date(`${nextDue}T00:00:00`).getTime() - Date.now()) /
          (24 * 60 * 60 * 1000)
      )
    : null
  const showReminder =
    settings.remindersEnabled &&
    daysUntilDue !== null &&
    daysUntilDue <= settings.notificationDays

  return (
    <>
      <ZakatFinalizeDialog open={finalizeOpen} onOpenChange={setFinalizeOpen} />
      <div className="flex flex-col gap-6">
        {showReminder ? (
          <div className="flex gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3.5">
            <IconBell className="text-primary mt-0.5 size-4 shrink-0" />
            <p className="text-sm">
              {daysUntilDue! > 0
                ? t("overviewPage.dueInDays", { count: daysUntilDue })
                : t("overviewPage.dueArrived")}
            </p>
          </div>
        ) : null}

        <section className="rounded-xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-muted-foreground text-xs font-medium">
                {t("overviewPage.estimatedTitle")}
              </p>
              <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl">
                {formatZakatMoney(calculation.estimatedZakat)}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant={elapsed !== null ? "default" : "outline"}>
                  {elapsed !== null
                    ? t("overviewPage.daysSincePayment", { count: elapsed })
                    : t("overviewPage.noPayment")}
                </Badge>
                {settings.nisab > 0 ? (
                  <Badge variant="outline">
                    {calculation.reachesNisab
                      ? t("overviewPage.aboveNisab")
                      : t("overviewPage.belowNisab")}
                  </Badge>
                ) : null}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground text-xs">{t("overviewPage.lastPaid")}</p>
                <p className="mt-1 text-sm font-semibold">
                  {formatZakatDate(lastPaidDate)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{t("overviewPage.nextDue")}</p>
                <p className="mt-1 text-sm font-semibold">
                  {formatZakatDate(nextDue)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 border-t pt-5 sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground text-xs">{t("overviewPage.businessAssets")}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {formatZakatMoney(calculation.assets.total)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">{t("overviewPage.businessLiabilities")}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {formatZakatMoney(calculation.liabilities.total)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">{t("overviewPage.netAssets")}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {formatZakatMoney(calculation.netAssets)}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                refreshCalculation()
                toast.success(t("overviewPage.toastRefreshed"))
              }}
            >
              <IconRefresh className="size-4" />
              {t("overviewPage.calculateAgain")}
            </Button>
            <Button
              type="button"
              className="rounded-full px-5"
              onClick={() => setFinalizeOpen(true)}
            >
              {t("overviewPage.finalizeZakat")}
            </Button>
          </div>
        </section>

        <StatCardsGrid>
          <StatCard
            label={t("overviewPage.cash")}
            value={formatZakatMoney(calculation.assets.cash)}
            hint={t("overviewPage.tempBalanceHint")}
          />
          <StatCard
            label={t("overviewPage.bank")}
            value={formatZakatMoney(calculation.assets.bank)}
            hint={t("overviewPage.tempBalanceHint")}
          />
          <StatCard
            label={t("overviewPage.inventory")}
            value={formatZakatMoney(calculation.assets.inventory)}
            hint={t("overviewPage.includedProducts", {
              count: calculation.inventoryLines.length,
            })}
          />
          <StatCard
            label={t("overviewPage.receivables")}
            value={formatZakatMoney(calculation.assets.receivables)}
            hint={t("overviewPage.positiveCustomerBalances")}
          />
        </StatCardsGrid>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Button asChild variant="outline" className="h-auto justify-between rounded-xl p-4">
            <Link href="/zakat/assets">
              <span className="flex items-center gap-2">
                <IconCash className="size-4" />
                {t("overviewPage.reviewAssets")}
              </span>
              <span>{formatZakatMoney(calculation.assets.total)}</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto justify-between rounded-xl p-4">
            <Link href="/zakat/liabilities">
              <span className="flex items-center gap-2">
                <IconReceipt className="size-4" />
                {t("overviewPage.reviewLiabilities")}
              </span>
              <span>{formatZakatMoney(calculation.liabilities.total)}</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto justify-start rounded-xl p-4">
            <Link href="/inventory/products">
              <IconPackage className="size-4" />
              {t("overviewPage.inventorySource")}
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto justify-start rounded-xl p-4">
            <Link href="/zakat/settings">
              <IconBuildingBank className="size-4" />
              {t("overviewPage.cashBankSettings")}
            </Link>
          </Button>
        </div>
      </div>
    </>
  )
}
