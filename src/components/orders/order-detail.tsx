"use client"

import type { ReactNode } from "react"

import { InvoicePdfButton } from "@/components/invoices/invoice-pdf-button"
import { Badge } from "@/components/ui/badge"
import {
  computeBalance,
  formatDate,
  formatMoney,
  statusBadgeClass,
  statusLabel,
  type OrderRow,
} from "@/lib/orders"

function detailRow(label: string, value: ReactNode) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground min-w-0 font-medium">{value}</dd>
    </div>
  )
}

export function OrderDetail({ order }: { order: OrderRow }) {
  const balance = computeBalance(order)

  return (
    <div className="flex flex-col gap-4">
      <div className="min-w-0">
        <p className="text-foreground text-base font-semibold">{order.invoiceNumber}</p>
        <p className="text-muted-foreground text-xs">
          ID {order.id} · {formatDate(order.orderDate)}
        </p>
      </div>
      <dl className="space-y-3">
        {detailRow("Customer", order.customerName)}
        {detailRow("Notes", order.description)}
        {detailRow("Order date", formatDate(order.orderDate))}
        {detailRow("Total amount", formatMoney(order.totalAmount))}
        {detailRow("Paid amount", formatMoney(order.paidAmount))}
        {detailRow(
          "Balance",
          <span
            className={
              Number(balance) > 0
                ? "text-amber-700 tabular-nums dark:text-amber-400"
                : "text-muted-foreground tabular-nums"
            }
          >
            {formatMoney(balance)}
          </span>
        )}
        {detailRow(
          "Status",
          <Badge variant="outline" className={statusBadgeClass(order.status)}>
            {statusLabel(order.status)}
          </Badge>
        )}
      </dl>

      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          Line items
        </p>
        <div className="border-border/60 overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-border/60 border-b text-left">
                <th className="text-muted-foreground px-3 py-2 font-medium">Product</th>
                <th className="text-muted-foreground px-3 py-2 text-right font-medium">Qty</th>
                <th className="text-muted-foreground px-3 py-2 text-right font-medium">Rate</th>
                <th className="text-muted-foreground px-3 py-2 text-right font-medium">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((line) => (
                <tr key={line.id} className="border-border/40 border-b last:border-0">
                  <td className="px-3 py-2">{line.productName}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{line.quantity}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatMoney(line.unitPrice)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatMoney(line.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <InvoicePdfButton order={order} className="w-full sm:w-auto" />
    </div>
  )
}
