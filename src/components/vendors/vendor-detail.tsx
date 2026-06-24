import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { CustomerAvatar } from "@/components/customers/customer-avatar"
import {
  computeBalance,
  formatMoney,
  statusBadgeClass,
  statusLabel,
  type VendorRow,
} from "@/lib/vendors"

function detailRow(label: string, value: ReactNode) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground min-w-0 font-medium">{value}</dd>
    </div>
  )
}

export function VendorDetail({ vendor }: { vendor: VendorRow }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <CustomerAvatar name={vendor.name} imageUrl={vendor.imageUrl} size="lg" />
        <div className="min-w-0">
          <p className="text-foreground truncate text-base font-semibold">{vendor.name}</p>
          <p className="text-muted-foreground text-xs">ID {vendor.id}</p>
        </div>
      </div>
      <dl className="space-y-3">
        {detailRow("Description", vendor.description)}
        {detailRow("Opening balance", formatMoney(vendor.openingBalance))}
        {detailRow("Total purchases", formatMoney(vendor.totalPurchases))}
        {detailRow("Total payments", formatMoney(vendor.totalPayments))}
        {detailRow("Balance", formatMoney(computeBalance(vendor)))}
        {detailRow("Phone number", vendor.phone)}
        {detailRow(
          "Status",
          <Badge variant="outline" className={statusBadgeClass(vendor.status)}>
            {statusLabel(vendor.status)}
          </Badge>
        )}
      </dl>
    </div>
  )
}
