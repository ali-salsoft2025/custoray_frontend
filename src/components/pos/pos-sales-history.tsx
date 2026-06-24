"use client"

import * as React from "react"
import { IconSearch } from "@tabler/icons-react"
import { toast } from "sonner"

import { InvoicePdfButton } from "@/components/invoices/invoice-pdf-button"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { useOrders } from "@/context/orders-context"
import { useProducts } from "@/context/products-context"
import { useReturns } from "@/context/returns-context"
import { confirmReturnAction } from "@/lib/confirm-action"
import { formatMoney } from "@/lib/customers"
import { buildReturnFromOrder } from "@/lib/returns"
import type { OrderRow } from "@/lib/orders"
import { isPosOrder } from "@/lib/pos"
import { canReturnDocument } from "@/lib/return-eligibility"
import { cn } from "@/lib/utils"

function formatPosMoney(value: string) {
  return formatMoney(value).replace(/^\$/, "Rs ")
}

const panelClass =
  "rounded-2xl bg-card shadow-sm shadow-black/[0.04] ring-1 ring-border/40"

const searchInputClass =
  "rounded-full shadow-sm focus-visible:ring-0 focus-visible:ring-offset-0 hover:ring-0 focus:ring-0 focus:outline-none min-w-0 flex-1"

export function PosSalesHistory() {
  const { orders, getOrder, updateOrder } = useOrders()
  const { products, updateProduct } = useProducts()
  const { addReturn } = useReturns()
  const [search, setSearch] = React.useState("")

  const posOrders = React.useMemo(() => {
    const query = search.trim().toLowerCase()
    return orders
      .filter(isPosOrder)
      .filter((order) => {
        if (!query) return true
        return (
          order.invoiceNumber.toLowerCase().includes(query) ||
          order.customerName.toLowerCase().includes(query)
        )
      })
      .sort((a, b) => {
        const dateCompare = b.orderDate.localeCompare(a.orderDate)
        if (dateCompare !== 0) return dateCompare
        return b.id - a.id
      })
  }, [orders, search])

  const restoreStockForReturn = React.useCallback(
    (order: OrderRow, lineIds?: number[]) => {
      const lineFilter = lineIds?.length
        ? (line: OrderRow["lines"][number]) => lineIds.includes(line.id)
        : () => true

      const qtyByProductId = new Map<number, number>()
      for (const line of order.lines.filter(lineFilter)) {
        const product = products.find((item) => item.name === line.productName)
        if (product) {
          qtyByProductId.set(
            product.id,
            (qtyByProductId.get(product.id) ?? 0) + line.quantity
          )
        }
      }

      for (const [productId, quantity] of qtyByProductId) {
        const product = products.find((item) => item.id === productId)
        if (product) {
          updateProduct(productId, { stock: product.stock + quantity })
        }
      }
    },
    [products, updateProduct]
  )

  const handleReturnOrder = React.useCallback(
    async (order: OrderRow, lineIds?: number[]) => {
      if (!canReturnDocument(order)) {
        toast.error("This sale cannot be returned.")
        return
      }

      const draft = buildReturnFromOrder(order, { lineIds })
      const scope = lineIds?.length === 1 ? "item" : "invoice"
      const itemName =
        scope === "item" ? draft.lines[0]?.productName : order.invoiceNumber

      if (
        !(await confirmReturnAction({
          scope,
          itemName,
          referenceNumber: order.invoiceNumber,
          totalAmount: draft.totalAmount,
          refundDue: draft.refundDue,
        }))
      ) {
        return
      }

      const created = addReturn({ ...draft, status: "completed" }, {
        getOrder,
        onApplySales: updateOrder,
      })

      restoreStockForReturn(order, lineIds)
      toast.success(`Return ${created.returnNumber} recorded.`)
    },
    [addReturn, getOrder, restoreStockForReturn, updateOrder]
  )

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Sales history</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Past register receipts. Download invoices or process returns.
        </p>
      </div>

      <div className={cn(panelClass, "overflow-hidden")}>
        <div className="border-border/40 border-b px-4 py-4">
          <p className="text-muted-foreground text-sm">
            {posOrders.length} receipt{posOrders.length === 1 ? "" : "s"}
          </p>
          <div className="mt-3 sm:max-w-md">
            <SearchInput
              placeholder="Search by receipt or customer…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              icon={<IconSearch className="size-4" />}
              className={searchInputClass}
            />
          </div>
        </div>

        <div className="p-4">
          {posOrders.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center text-sm">
              No POS sales yet. Complete a sale from the register.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="text-muted-foreground border-border/40 border-b text-left text-xs tracking-wide uppercase">
                    <th className="pb-3 pr-4 font-medium">Receipt</th>
                    <th className="pb-3 pr-4 font-medium">Date</th>
                    <th className="pb-3 pr-4 font-medium">Customer</th>
                    <th className="pb-3 pr-4 font-medium">Payment</th>
                    <th className="pb-3 pr-4 text-right font-medium">Total</th>
                    <th className="pb-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-border/30 border-b last:border-0 hover:bg-muted/20"
                    >
                      <td className="py-3.5 pr-4 font-medium">{order.invoiceNumber}</td>
                      <td className="text-muted-foreground py-3.5 pr-4">{order.orderDate}</td>
                      <td className="py-3.5 pr-4">{order.customerName}</td>
                      <td className="py-3.5 pr-4">{order.paymentMethod}</td>
                      <td className="py-3.5 pr-4 text-right font-medium tabular-nums">
                        {formatPosMoney(order.totalAmount)}
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex justify-end gap-2">
                          <InvoicePdfButton
                            order={order}
                            size="sm"
                            variant="outline"
                            label="PDF"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={!canReturnDocument(order)}
                            onClick={() => handleReturnOrder(order)}
                          >
                            Return
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
