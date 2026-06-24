import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import {
  computeBalance,
  formatDate,
  formatMoney,
  statusBadgeClass,
  statusLabel,
  type SaleRow,
} from "@/lib/sales"

function detailRow(label: string, value: ReactNode) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground min-w-0 font-medium">{value}</dd>
    </div>
  )
}

export function SaleDetail({ sale }: { sale: SaleRow }) {
  const balance = computeBalance(sale)

  return (
    <div className="flex flex-col gap-4">
      <div className="min-w-0">
        <p className="text-foreground text-base font-semibold">{sale.saleNumber}</p>
        <p className="text-muted-foreground text-xs">
          ID {sale.id} · {formatDate(sale.saleDate)}
        </p>
      </div>
      <dl className="space-y-3">
        {detailRow("Customer", sale.customerName)}
        {detailRow("Description", sale.description)}
        {detailRow("Sale date", formatDate(sale.saleDate))}
        {detailRow("Total amount", formatMoney(sale.totalAmount))}
        {detailRow("Paid amount", formatMoney(sale.paidAmount))}
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
        {detailRow("Payment method", sale.paymentMethod)}
        {detailRow(
          "Status",
          <Badge variant="outline" className={statusBadgeClass(sale.status)}>
            {statusLabel(sale.status)}
          </Badge>
        )}
      </dl>
    </div>
  )
}
