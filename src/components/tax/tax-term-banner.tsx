"use client"

import { IconCalendar } from "@tabler/icons-react"

import { useFiscalTerms } from "@/context/fiscal-term-context"
import { getTermDateRange } from "@/lib/tax-reports"
import { cn } from "@/lib/utils"

const panelClass =
  "rounded-xl bg-card shadow-sm shadow-black/[0.04] ring-1 ring-border/40"

export function TaxTermBanner({ className }: { className?: string }) {
  const { viewing, plannedEndIso } = useFiscalTerms()

  if (!viewing) return null

  const range = getTermDateRange(viewing, plannedEndIso)

  return (
    <div className={cn(panelClass, "flex items-start gap-3 px-4 py-3", className)}>
      <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
        <IconCalendar className="size-4" stroke={1.75} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold tracking-tight">
          Preparing taxes for this period
        </p>
        <p className="text-muted-foreground mt-0.5 text-xs">{range.label}</p>
        <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
          Reports use completed sales and purchases in these dates. Pending items are
          listed separately on the year summary.
        </p>
      </div>
    </div>
  )
}
