"use client"

import { BillItemViewTableOption } from "@/components/shared/bill-item-view-toggle"
import type { BillItemViewMode } from "@/lib/app-preferences"

export function SalesViewTableOption({
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
      ariaLabel="Sales view mode"
      billDescription="Bill wise — one row per invoice"
      itemDescription="Item wise — one row per sold line item"
    />
  )
}
