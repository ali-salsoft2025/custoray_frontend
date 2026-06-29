"use client"

import { IconInfoCircle } from "@tabler/icons-react"

import { cn } from "@/lib/utils"

export function TaxDisclaimer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "border-primary/20 bg-primary/5 flex gap-3 rounded-2xl border px-4 py-3.5",
        className
      )}
    >
      <IconInfoCircle
        className="text-primary mt-0.5 size-4 shrink-0"
        stroke={1.75}
      />
      <div className="min-w-0 space-y-1 text-xs leading-relaxed">
        <p className="text-foreground font-medium">Friendly reminder</p>
        <p className="text-muted-foreground">
          This tool organizes your business numbers to make tax time easier. It does
          not file taxes for you — share these summaries with your accountant or tax
          preparer when you are ready.
        </p>
      </div>
    </div>
  )
}

export function TaxExplainBox({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-muted/30 ring-1 ring-border/40 px-4 py-3.5",
        className
      )}
    >
      <p className="text-sm font-medium">{title}</p>
      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{children}</p>
    </div>
  )
}
