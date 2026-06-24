"use client"

import { BillItemViewTableOption } from "@/components/shared/bill-item-view-toggle"
import type { BillItemViewMode } from "@/lib/app-preferences"

export function ReturnViewTableOption({
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
      ariaLabel="Returns view mode"
      billDescription="Return wise — one row per return document"
      itemDescription="Item wise — one row per returned line"
    />
  )
}
