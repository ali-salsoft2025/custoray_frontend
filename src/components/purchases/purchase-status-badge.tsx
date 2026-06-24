import type { ComponentType } from "react"
import {
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconClock,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  statusBadgeClass,
  statusLabel,
  type PurchaseRow,
} from "@/lib/purchases"
import { cn } from "@/lib/utils"

type PurchaseStatus = PurchaseRow["status"]

const statusIcons: Record<
  PurchaseStatus,
  ComponentType<{ className?: string }>
> = {
  pending: IconClock,
  completed: IconCircleCheckFilled,
  cancelled: IconCircleXFilled,
}

const statusIconClass: Record<PurchaseStatus, string> = {
  pending: "text-blue-600 dark:text-blue-400",
  completed: "fill-green-500 dark:fill-green-400 text-green-500 dark:text-green-400",
  cancelled: "fill-muted-foreground/70 text-muted-foreground",
}

type PurchaseStatusBadgeProps = {
  status: PurchaseStatus | undefined | null
  className?: string
}

export function PurchaseStatusBadge({ status, className }: PurchaseStatusBadgeProps) {
  const normalized = status ?? "pending"
  const Icon = statusIcons[normalized]

  return (
    <Badge
      variant="outline"
      className={cn("gap-1 pr-2 pl-1.5", statusBadgeClass(normalized), className)}
    >
      <Icon className={cn("size-3.5 shrink-0", statusIconClass[normalized])} />
      {statusLabel(normalized)}
    </Badge>
  )
}
