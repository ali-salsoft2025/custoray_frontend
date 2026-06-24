import type { ReactNode } from "react"
import { PurchaseStatusBadge } from "@/components/purchases/purchase-status-badge"
import {
  formatDate,
  formatMoney,
  type PurchaseLineReportRow,
} from "@/lib/purchases-report"

function detailRow(label: string, value: ReactNode) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground min-w-0 font-medium">{value}</dd>
    </div>
  )
}

export function PurchaseLineDetail({ line }: { line: PurchaseLineReportRow }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="min-w-0">
        <p className="text-foreground text-base font-semibold">{line.productName}</p>
        <p className="text-muted-foreground text-xs">
          {line.purchaseNumber} · {formatDate(line.purchaseDate)}
        </p>
      </div>
      <dl className="space-y-3">
        {detailRow("PO #", line.purchaseNumber)}
        {detailRow("Vendor", line.vendorName)}
        {detailRow("Date", formatDate(line.purchaseDate))}
        {detailRow("Quantity", line.quantity)}
        {detailRow("Unit price", formatMoney(line.unitPrice))}
        {detailRow("Line total", formatMoney(line.lineTotal))}
        {detailRow(
          "Status",
          <PurchaseStatusBadge status={line.purchaseStatus} />
        )}
      </dl>
    </div>
  )
}
