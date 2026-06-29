"use client"

import Link from "next/link"
import { IconArrowLeft } from "@tabler/icons-react"

import { TaxDisclaimer, TaxExplainBox } from "@/components/tax/tax-disclaimer"
import { TaxTermBanner } from "@/components/tax/tax-term-banner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const panelClass =
  "rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent ring-1 ring-primary/15"

export function TaxPageLayout({
  step,
  totalSteps = 4,
  title,
  subtitle,
  explainTitle,
  explainBody,
  backHref = "/tax",
  actions,
  children,
}: {
  step?: number
  totalSteps?: number
  title: string
  subtitle: string
  explainTitle?: string
  explainBody?: string
  backHref?: string
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground -ml-2 w-fit"
        asChild
      >
        <Link href={backHref}>
          <IconArrowLeft className="size-4" />
          Back to Tax Helper
        </Link>
      </Button>

      <div className={cn(panelClass, "px-5 py-5 sm:px-6")}>
        {step ? (
          <p className="text-primary text-xs font-semibold tracking-wide uppercase">
            Step {step} of {totalSteps}
          </p>
        ) : null}
        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
              {subtitle}
            </p>
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </div>
      </div>

      <TaxDisclaimer />
      <TaxTermBanner />

      {explainTitle && explainBody ? (
        <TaxExplainBox title={explainTitle}>{explainBody}</TaxExplainBox>
      ) : null}

      {children}
    </div>
  )
}
