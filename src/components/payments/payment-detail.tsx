"use client"

import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import {
  formatDate,
  formatMoney,
  statusBadgeClass,
  typeBadgeClass,
  type PaymentRow,
} from "@/lib/payments"

function detailRow(label: string, value: ReactNode) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground min-w-0 font-medium">{value}</dd>
    </div>
  )
}

export function PaymentDetail({ payment }: { payment: PaymentRow }) {
  const { t } = useTranslation("payments")
  return (
    <div className="flex flex-col gap-4">
      <div className="min-w-0">
        <p className="text-foreground text-base font-semibold">{payment.paymentNumber}</p>
        <p className="text-muted-foreground text-xs">
          {t("detail.idDate", { id: payment.id, date: formatDate(payment.paymentDate) })}
        </p>
      </div>
      <dl className="space-y-3">
        {detailRow(
          t("detail.type"),
          <Badge variant="outline" className={typeBadgeClass(payment.type)}>
            {payment.type === "customer"
              ? t("columns.customer")
              : t("columns.vendor")}
          </Badge>
        )}
        {detailRow(
          payment.type === "customer" ? t("columns.customer") : t("columns.vendor"),
          payment.partyName
        )}
        {detailRow(t("detail.reference"), payment.referenceNumber)}
        {detailRow(t("detail.paymentDate"), formatDate(payment.paymentDate))}
        {detailRow(t("detail.amount"), formatMoney(payment.amount))}
        {detailRow(t("detail.paymentMethod"), payment.paymentMethod)}
        {detailRow(
          t("detail.status"),
          <Badge variant="outline" className={statusBadgeClass(payment.status)}>
            {t(`status.${payment.status}`, { ns: "common" })}
          </Badge>
        )}
        {detailRow(t("detail.notes"), payment.notes)}
      </dl>
    </div>
  )
}
