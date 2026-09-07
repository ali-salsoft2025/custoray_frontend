"use client"

import { useTranslation } from "react-i18next"

import {
  BillItemViewTableOption,
  BillItemViewToggle,
} from "@/components/shared/bill-item-view-toggle"
import type { BillItemViewMode } from "@/lib/app-preferences"

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
  const { t } = useTranslation("purchases")
  return (
    <BillItemViewToggle
      value={value}
      onValueChange={onValueChange}
      className={className}
      variant={variant}
      ariaLabel={t("viewMode.aria")}
      billDescription={t("viewMode.billDescription")}
      itemDescription={t("viewMode.itemDescription")}
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
  const { t } = useTranslation("purchases")
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
