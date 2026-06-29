"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

type SettingsToggleRowProps = {
  title: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  compact?: boolean
  className?: string
}

export function SettingsToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
  compact = false,
  className,
}: SettingsToggleRowProps) {
  return (
    <div
      className={cn(
        "bg-muted/25 flex items-center justify-between ring-1 ring-border/30",
        compact ? "gap-3 rounded-lg px-3 py-2" : "gap-4 rounded-xl px-4 py-3",
        className
      )}
    >
      <div className="min-w-0 space-y-0.5">
        <Label className={cn("font-medium", compact ? "text-xs" : "text-sm")}>
          {title}
        </Label>
        {description ? (
          <p className="text-muted-foreground text-[11px] leading-snug">{description}</p>
        ) : null}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
