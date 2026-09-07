"use client"

import Link from "next/link"
import {
  IconArrowRight,
  IconBuildingStore,
  IconCashBanknote,
  IconReceiptTax,
  IconSettings,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { useZakat } from "@/context/zakat-context"
import { formatZakatMoney } from "@/lib/zakat"
import { useTranslation } from "react-i18next"

function LiabilityRow({
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

export function ZakatLiabilitiesPanel() {
  const { t } = useTranslation("zakat")
  const { calculation } = useZakat()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          {t("liabilitiesPage.title")}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("liabilitiesPage.hint")}
        </p>
      </div>

      <section className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <LiabilityRow
          icon={<IconBuildingStore className="size-4" />}
          label={t("liabilitiesPage.supplierPayables")}
          hint={t("liabilitiesPage.supplierHint")}
          value={calculation.liabilities.supplierPayables}
          href="/vendors"
          action={t("liabilitiesPage.suppliers")}
        />
        <LiabilityRow
          icon={<IconReceiptTax className="size-4" />}
          label={t("liabilitiesPage.expensesPayable")}
          hint={t("liabilitiesPage.expensesHint")}
          value={calculation.liabilities.expensesPayable}
          href="/zakat/settings"
          action={t("liabilitiesPage.settings")}
        />
        <LiabilityRow
          icon={<IconCashBanknote className="size-4" />}
          label={t("liabilitiesPage.shortTermLoans")}
          hint={t("liabilitiesPage.loansHint")}
          value={calculation.liabilities.shortTermLoans}
          href="/zakat/settings"
          action={t("liabilitiesPage.settings")}
        />
        <LiabilityRow
          icon={<IconSettings className="size-4" />}
          label={t("liabilitiesPage.manualAdjustment")}
          hint={t("liabilitiesPage.manualHint")}
          value={calculation.liabilities.manualAdjustment}
          href="/zakat/settings"
          action={t("liabilitiesPage.settings")}
        />
        <div className="flex items-center justify-between gap-4 bg-muted/20 px-5 py-4">
          <p className="text-sm font-semibold">{t("liabilitiesPage.totalLiabilities")}</p>
          <p className="text-lg font-semibold tabular-nums">
            {formatZakatMoney(calculation.liabilities.total)}
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold">{t("liabilitiesPage.calculationImpact")}</h3>
        <div className="mt-4 divide-y rounded-lg border">
          <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
            <span className="text-muted-foreground">{t("liabilitiesPage.businessAssets")}</span>
            <span className="font-medium tabular-nums">
              {formatZakatMoney(calculation.assets.total)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
            <span className="text-muted-foreground">{t("liabilitiesPage.lessLiabilities")}</span>
            <span className="font-medium tabular-nums">
              − {formatZakatMoney(calculation.liabilities.total)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
            <span className="font-medium">{t("liabilitiesPage.netAssets")}</span>
            <span className="font-semibold tabular-nums">
              {formatZakatMoney(calculation.netAssets)}
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
