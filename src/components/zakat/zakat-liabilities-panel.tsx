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
  const { calculation } = useZakat()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Business liabilities
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Review deductible business obligations and update them at their source.
        </p>
      </div>

      <section className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <LiabilityRow
          icon={<IconBuildingStore className="size-4" />}
          label="Supplier payables"
          hint="Positive balances from vendor accounts"
          value={calculation.liabilities.supplierPayables}
          href="/vendors"
          action="Suppliers"
        />
        <LiabilityRow
          icon={<IconReceiptTax className="size-4" />}
          label="Expenses payable"
          hint="Temporary balance maintained in Zakat settings"
          value={calculation.liabilities.expensesPayable}
          href="/zakat/settings"
          action="Settings"
        />
        <LiabilityRow
          icon={<IconCashBanknote className="size-4" />}
          label="Short-term loans"
          hint="Temporary balance maintained in Zakat settings"
          value={calculation.liabilities.shortTermLoans}
          href="/zakat/settings"
          action="Settings"
        />
        <LiabilityRow
          icon={<IconSettings className="size-4" />}
          label="Manual adjustment"
          hint="Other eligible short-term liabilities"
          value={calculation.liabilities.manualAdjustment}
          href="/zakat/settings"
          action="Settings"
        />
        <div className="flex items-center justify-between gap-4 bg-muted/20 px-5 py-4">
          <p className="text-sm font-semibold">Total liabilities</p>
          <p className="text-lg font-semibold tabular-nums">
            {formatZakatMoney(calculation.liabilities.total)}
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold">Calculation impact</h3>
        <div className="mt-4 divide-y rounded-lg border">
          <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
            <span className="text-muted-foreground">Business assets</span>
            <span className="font-medium tabular-nums">
              {formatZakatMoney(calculation.assets.total)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
            <span className="text-muted-foreground">Less liabilities</span>
            <span className="font-medium tabular-nums">
              − {formatZakatMoney(calculation.liabilities.total)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
            <span className="font-medium">Net Zakat assets</span>
            <span className="font-semibold tabular-nums">
              {formatZakatMoney(calculation.netAssets)}
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
