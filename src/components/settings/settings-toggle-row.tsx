"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

type SettingsToggleRowProps = {
  title: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}

export function SettingsToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
  className,
}: SettingsToggleRowProps) {
  return (
    <div
      className={cn(
        "bg-muted/25 flex items-center justify-between gap-4 rounded-xl px-4 py-3 ring-1 ring-border/30",
        className
      )}
    >
      <div className="min-w-0 space-y-0.5">
        <Label className="text-sm font-medium">{title}</Label>
        {description ? (
          <p className="text-muted-foreground text-xs">{description}</p>
        ) : null}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
