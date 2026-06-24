"use client"

import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import {
  formatDate,
  formatMoney,
  statusBadgeClass,
  statusLabel,
  typeLabel,
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
  return (
    <div className="flex flex-col gap-4">
      <div className="min-w-0">
        <p className="text-foreground text-base font-semibold">{payment.paymentNumber}</p>
        <p className="text-muted-foreground text-xs">
          ID {payment.id} · {formatDate(payment.paymentDate)}
        </p>
      </div>
      <dl className="space-y-3">
        {detailRow(
          "Type",
          <Badge variant="outline" className={typeBadgeClass(payment.type)}>
            {typeLabel(payment.type)}
          </Badge>
        )}
        {detailRow(
          payment.type === "customer" ? "Customer" : "Vendor",
          payment.partyName
        )}
        {detailRow("Reference", payment.referenceNumber)}
        {detailRow("Payment date", formatDate(payment.paymentDate))}
        {detailRow("Amount", formatMoney(payment.amount))}
        {detailRow("Payment method", payment.paymentMethod)}
        {detailRow(
          "Status",
          <Badge variant="outline" className={statusBadgeClass(payment.status)}>
            {statusLabel(payment.status)}
          </Badge>
        )}
        {detailRow("Notes", payment.notes)}
      </dl>
    </div>
  )
}
