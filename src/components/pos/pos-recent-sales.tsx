"use client"

import Link from "next/link"
import {
  IconChevronRight,
  IconReceipt,
  IconShoppingCart,
} from "@tabler/icons-react"

import { InvoicePdfButton } from "@/components/invoices/invoice-pdf-button"
import { Badge } from "@/components/ui/badge"
import { formatDate, statusBadgeClass, statusLabel, type OrderRow } from "@/lib/orders"
import { cn } from "@/lib/utils"

type PosRecentSalesProps = {
  recentSales: OrderRow[]
  formatMoney: (value: string) => string
  className?: string
}

function orderItemCount(order: OrderRow): number {
  return order.lines.reduce((sum, line) => sum + line.quantity, 0)
}

function sumOrderTotals(orders: OrderRow[]): string {
  const total = orders.reduce((acc, order) => {
    const value = Number(order.totalAmount)
    return acc + (Number.isFinite(value) ? value : 0)
  }, 0)
  return total.toFixed(2)
}

export function PosRecentSales({
  recentSales,
  formatMoney,
  className,
}: PosRecentSalesProps) {
  const recentTotal = sumOrderTotals(recentSales)

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl bg-card shadow-sm shadow-black/[0.04] ring-1 ring-border/40",
        className
      )}
    >
      <div className="border-border/40 flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-lg">
              <IconReceipt className="size-3.5" stroke={1.75} />
            </div>
            <p className="text-sm font-semibold tracking-tight">Recent sales</p>
          </div>
          {recentSales.length > 0 ? (
            <p className="text-muted-foreground mt-1 pl-9 text-xs tabular-nums">
              {recentSales.length} receipt{recentSales.length === 1 ? "" : "s"} ·{" "}
              {formatMoney(recentTotal)} total
            </p>
          ) : null}
        </div>

        <Link
          href="/pos/sales"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 self-start text-xs font-medium transition-colors sm:self-center"
        >
          View all
          <IconChevronRight className="size-3.5" stroke={1.75} />
        </Link>
      </div>

      {recentSales.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
          <div className="bg-muted/60 text-muted-foreground flex size-11 items-center justify-center rounded-2xl">
            <IconShoppingCart className="size-5" stroke={1.5} />
          </div>
          <p className="text-sm font-medium">No sales yet</p>
          <p className="text-muted-foreground max-w-xs text-xs">
            Completed register receipts will show up here for quick access.
          </p>
        </div>
      ) : (
        <div className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-3">
          {recentSales.map((order) => {
            const items = orderItemCount(order)

            return (
              <article
                key={order.id}
                className="group flex flex-col gap-3 rounded-xl bg-muted/20 p-3 ring-1 ring-border/25 transition-colors hover:bg-muted/35"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-semibold tabular-nums tracking-tight">
                        {order.invoiceNumber}
                      </p>
                      {order.status !== "completed" ? (
                        <Badge
                          variant="outline"
                          className={cn("h-5 shrink-0 px-1.5 text-[10px] font-normal", statusBadgeClass(order.status))}
                        >
                          {statusLabel(order.status)}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-muted-foreground mt-0.5 truncate text-xs">
                      {order.customerName}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatMoney(order.totalAmount)}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px]">
                    <span>{formatDate(order.orderDate)}</span>
                    <span aria-hidden>·</span>
                    <span>
                      {items} item{items === 1 ? "" : "s"}
                    </span>
                    <span aria-hidden>·</span>
                    <Badge
                      variant="outline"
                      className="h-5 border-border/50 px-1.5 text-[10px] font-normal"
                    >
                      {order.paymentMethod}
                    </Badge>
                  </div>

                  <InvoicePdfButton
                    order={order}
                    size="sm"
                    variant="outline"
                    label="PDF"
                    className="h-7 shrink-0 rounded-lg px-2 text-[11px] opacity-80 transition-opacity group-hover:opacity-100"
                  />
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
