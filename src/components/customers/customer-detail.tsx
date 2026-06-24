import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { CustomerAvatar } from "@/components/customers/customer-avatar"
import { CustomerOrderCards } from "@/components/customers/customer-order-cards"
import {
  computeBalance,
  formatMoney,
  statusBadgeClass,
  statusLabel,
  type CustomerRow,
} from "@/lib/customers"

function detailRow(label: string, value: ReactNode) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground min-w-0 font-medium">{value}</dd>
    </div>
  )
}

export function CustomerDetail({ customer }: { customer: CustomerRow }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <CustomerAvatar name={customer.name} imageUrl={customer.imageUrl} size="lg" />
        <div className="min-w-0">
          <p className="text-foreground truncate text-base font-semibold">{customer.name}</p>
          <p className="text-muted-foreground text-xs">ID {customer.id}</p>
        </div>
      </div>
      <dl className="space-y-3">
        {detailRow("Description", customer.description)}
        {detailRow("Opening balance", formatMoney(customer.openingBalance))}
        {detailRow("Total sales", formatMoney(customer.totalSales))}
        {detailRow("Total payments", formatMoney(customer.totalPayments))}
        {detailRow("Balance", formatMoney(computeBalance(customer)))}
        {detailRow("Phone number", customer.phone)}
        {detailRow(
          "Status",
          <Badge variant="outline" className={statusBadgeClass(customer.status)}>
            {statusLabel(customer.status)}
          </Badge>
        )}
      </dl>
      <CustomerOrderCards customer={customer} />
    </div>
  )
}
