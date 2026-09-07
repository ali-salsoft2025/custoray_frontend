"use client"

import { useTranslation } from "react-i18next"

import type { TaxReportLine } from "@/lib/tax-reports"
import { cn } from "@/lib/utils"

const panelClass =
  "rounded-xl bg-card shadow-sm shadow-black/[0.04] ring-1 ring-border/40 overflow-hidden"

export function TaxReportTable({
  lines,
  footnote,
  className,
}: {
  lines: TaxReportLine[]
  footnote?: string
  className?: string
}) {
  const sections = [...new Set(lines.map((line) => line.section))]

  return (
    <div className={cn(panelClass, className)}>
      <div className="divide-border/40 divide-y">
        {sections.map((section) => (
          <div key={section}>
            <div className="bg-muted/30 border-border/40 border-b px-4 py-2">
              <p className="text-xs font-semibold tracking-wide uppercase opacity-80">
                {section}
              </p>
            </div>
            <div className="divide-border/30 divide-y">
              {lines
                .filter((line) => line.section === section)
                .map((line) => (
                  <div
                    key={`${line.section}-${line.line}`}
                    className="flex items-start justify-between gap-4 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{line.line}</p>
                      {line.note ? (
                        <p className="text-muted-foreground mt-0.5 text-[11px]">
                          {line.note}
                        </p>
                      ) : null}
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums">
                      {line.amount}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
      {footnote ? (
        <p className="text-muted-foreground border-border/40 border-t px-4 py-3 text-[11px] leading-relaxed">
          {footnote}
        </p>
      ) : null}
    </div>
  )
}

export function TaxReportFootnote() {
  const { t } = useTranslation("tax")
  return (
    <p className="text-muted-foreground text-[11px] leading-relaxed">
      {t("reportFootnote")}
    </p>
  )
}
