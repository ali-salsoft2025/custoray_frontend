"use client"

import Link from "next/link"

import { InvoicePdfButton } from "@/components/invoices/invoice-pdf-button"
import { formatDate, type OrderRow } from "@/lib/orders"
import { cn } from "@/lib/utils"

type PosRecentSalesProps = {
  recentSales: OrderRow[]
  formatMoney: (value: string) => string
  className?: string
}

export function PosRecentSales({
  recentSales,
  formatMoney,
  className,
}: PosRecentSalesProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl bg-card shadow-sm shadow-black/[0.04] ring-1 ring-border/40",
        className
      )}
    >
      <div className="border-border/40 flex items-center justify-between border-b px-3 py-2">
        <p className="text-xs font-semibold">Recent sales</p>
        <Link
          href="/pos/sales"
          className="text-muted-foreground hover:text-foreground text-[10px] font-medium"
        >
          View all
        </Link>
      </div>
      {recentSales.length === 0 ? (
        <p className="text-muted-foreground px-3 py-4 text-center text-xs">
          Completed sales will appear here.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-xs">
            <thead>
              <tr className="text-muted-foreground border-border/40 border-b text-left text-[10px]">
                <th className="px-3 py-1.5 font-medium">Receipt</th>
                <th className="px-3 py-1.5 font-medium">Date</th>
                <th className="px-3 py-1.5 font-medium">Customer</th>
                <th className="px-3 py-1.5 text-right font-medium">Total</th>
                <th className="px-3 py-1.5 text-right font-medium">PDF</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map((order) => (
                <tr key={order.id} className="border-border/30 border-b last:border-0">
                  <td className="px-3 py-2 font-medium tabular-nums">{order.invoiceNumber}</td>
                  <td className="text-muted-foreground px-3 py-2">
                    {formatDate(order.orderDate)}
                  </td>
                  <td className="max-w-[8rem] truncate px-3 py-2">{order.customerName}</td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums">
                    {formatMoney(order.totalAmount)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <InvoicePdfButton
                      order={order}
                      size="sm"
                      variant="outline"
                      label="PDF"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
