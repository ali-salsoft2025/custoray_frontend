"use client"

import {
  BillItemViewTableOption,
  BillItemViewToggle,
} from "@/components/shared/bill-item-view-toggle"
import type { BillItemViewMode } from "@/lib/app-preferences"

const BILL_DESCRIPTION = "Bill wise — one row per purchase order"
const ITEM_DESCRIPTION = "Item wise — one row per line item"

export function PurchaseViewToggle({
  value,
  onValueChange,
  className,
  variant = "icons",
}: {
  value: BillItemViewMode
  onValueChange: (value: BillItemViewMode) => void
  className?: string
  variant?: "icons" | "labeled"
}) {
  return (
    <BillItemViewToggle
      value={value}
      onValueChange={onValueChange}
      className={className}
      variant={variant}
      ariaLabel="Purchase view mode"
      billDescription={BILL_DESCRIPTION}
      itemDescription={ITEM_DESCRIPTION}
    />
  )
}

export function PurchaseViewTableOption({
  value,
  onValueChange,
}: {
  value: BillItemViewMode
  onValueChange: (value: BillItemViewMode) => void
}) {
  return (
    <BillItemViewTableOption
      value={value}
      onValueChange={onValueChange}
      ariaLabel="Purchase view mode"
      billDescription={BILL_DESCRIPTION}
      itemDescription={ITEM_DESCRIPTION}
    />
  )
}
