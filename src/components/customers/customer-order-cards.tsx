"use client"

import Link from "next/link"
import { IconReceipt } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  computeBalance,
  formatDate,
  formatMoney,
  ordersForCustomer,
  statusBadgeClass,
  statusLabel,
  type OrderRow,
} from "@/lib/orders"
import { useOrders } from "@/context/orders-context"
import type { CustomerRow } from "@/lib/customers"

function OrderCard({ order }: { order: OrderRow }) {
  const balance = computeBalance(order)
  const itemPreview = order.lines
    .slice(0, 2)
    .map((line) => line.productName)
    .join(", ")
  const extraItems = order.lines.length > 2 ? order.lines.length - 2 : 0

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-foreground truncate text-sm font-semibold">
              {order.invoiceNumber}
            </p>
            <p className="text-muted-foreground text-xs tabular-nums">
              {formatDate(order.orderDate)}
            </p>
          </div>
          <Badge variant="outline" className={statusBadgeClass(order.status)}>
            {statusLabel(order.status)}
          </Badge>
        </div>
        <p className="text-muted-foreground line-clamp-2 text-xs">
          {itemPreview}
          {extraItems > 0 ? ` +${extraItems} more` : ""}
        </p>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Total</p>
            <p className="text-foreground font-medium tabular-nums">
              {formatMoney(order.totalAmount)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Paid</p>
            <p className="text-foreground font-medium tabular-nums">
              {formatMoney(order.paidAmount)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Balance</p>
            <p
              className={
                Number(balance) > 0
                  ? "font-medium tabular-nums text-amber-700 dark:text-amber-400"
                  : "text-muted-foreground font-medium tabular-nums"
              }
            >
              {formatMoney(balance)}
            </p>
          </div>
        </div>
        <p className="text-muted-foreground text-xs">
          {order.lines.length} item{order.lines.length === 1 ? "" : "s"}
        </p>
      </CardContent>
    </Card>
  )
}

export function CustomerOrderCards({ customer }: { customer: CustomerRow }) {
  const { orders } = useOrders()
  const customerOrders = ordersForCustomer(orders, customer.name)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          Orders
        </p>
        {customerOrders.length > 0 ? (
          <Link
            href="/documents/sales-invoice"
            className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
          >
            View all
          </Link>
        ) : null}
      </div>
      {customerOrders.length === 0 ? (
        <div className="border-border/60 bg-muted/20 flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center">
          <IconReceipt className="text-muted-foreground size-8 stroke-[1.25]" />
          <p className="text-muted-foreground text-sm">No orders for this customer yet.</p>
          <Link
            href="/documents/sales-invoice"
            className="text-foreground text-sm font-medium underline-offset-4 hover:underline"
          >
            Create invoice
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {customerOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}
