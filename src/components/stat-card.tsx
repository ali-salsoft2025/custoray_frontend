import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

const statCardClass =
  "rounded-xl bg-card shadow-sm shadow-black/[0.04] ring-1 ring-border/40"

export function sumNumericField<T>(
  rows: T[],
  getValue: (row: T) => string | number
): number {
  return rows.reduce((acc, row) => {
    const value = Number(getValue(row))
    return acc + (Number.isFinite(value) ? value : 0)
  }, 0)
}

export function StatCard({
  label,
  value,
  hint,
  className,
}: {
  label: string
  value: string
  hint?: string
  className?: string
}) {
  return (
    <div className={cn(statCardClass, "p-4", className)}>
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">{value}</p>
      {hint ? <p className="text-muted-foreground mt-0.5 text-[11px]">{hint}</p> : null}
    </div>
  )
}

export function StatCardsGrid({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {children}
    </div>
  )
}
