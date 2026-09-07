"use client"

import { useTranslation } from "react-i18next"

import { BillItemViewTableOption } from "@/components/shared/bill-item-view-toggle"
import type { BillItemViewMode } from "@/lib/app-preferences"

export function SalesViewTableOption({
  value,
  onValueChange,
}: {
  value: BillItemViewMode
  onValueChange: (value: BillItemViewMode) => void
}) {
  const { t } = useTranslation("sales")
  return (
    <BillItemViewTableOption
      value={value}
      onValueChange={onValueChange}
      ariaLabel={t("viewMode.aria")}
      billDescription={t("viewMode.billDescription")}
      itemDescription={t("viewMode.itemDescription")}
    />
  )
}
