"use client"

import { Badge } from "@/components/ui/badge"
import { getTaxRegionProfile, type TaxRegion } from "@/lib/tax-region-config"
import { cn } from "@/lib/utils"

export function TaxRegionBadge({
  region,
  className,
}: {
  region: TaxRegion
  className?: string
}) {
  const profile = getTaxRegionProfile(region)

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-primary/30 bg-primary/5 text-primary h-6 px-2 text-[11px] font-medium",
        className
      )}
    >
      {profile.shortLabel} · {profile.currency}
    </Badge>
  )
}
