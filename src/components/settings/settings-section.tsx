"use client"

import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type SettingsSectionProps = {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
  contentClassName?: string
}

export function SettingsSection({
  title,
  description,
  children,
  footer,
  className,
  contentClassName,
}: SettingsSectionProps) {
  return (
    <section
      className={cn(
        "rounded-2xl bg-card shadow-sm shadow-black/[0.04] ring-1 ring-border/40",
        className
      )}
    >
      <div className="border-border/40 border-b px-5 py-4">
        <h3 className="text-base font-semibold">{title}</h3>
        {description ? (
          <p className="text-muted-foreground mt-0.5 text-sm">{description}</p>
        ) : null}
      </div>
      <div className={cn("space-y-5 p-5", contentClassName)}>{children}</div>
      {footer ? (
        <div className="border-border/40 flex items-center border-t px-5 py-4">
          {footer}
        </div>
      ) : null}
    </section>
  )
}
