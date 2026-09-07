"use client"

import * as React from "react"
import { toast } from "sonner"

import { useCustomers } from "@/context/customers-context"
import { useOrders } from "@/context/orders-context"
import { useProducts } from "@/context/products-context"
import { useReturns } from "@/context/returns-context"
import { confirmReturnLineAction } from "@/lib/confirm-action"
import { applySalesReturnToCustomer } from "@/lib/customers"
import { type OrderLineRow, type OrderRow } from "@/lib/orders"
import {
  canReturnDocument,
  isReturnableOrderLine,
} from "@/lib/return-eligibility"
import { buildReturnFromOrder, type ReturnRow } from "@/lib/returns"

function restoreStockForProductName(
  productName: string,
  quantity: number,
  products: { id: number; name: string; stock: number }[],
  updateProduct: (id: number, patch: { stock: number }) => void
) {
  const product = products.find(
    (item) => item.name.trim().toLowerCase() === productName.trim().toLowerCase()
  )
  if (!product) return
  updateProduct(product.id, { stock: product.stock + quantity })
}

export function useInvoiceLineReturn() {
  const { getOrder, updateOrder } = useOrders()
  const { addReturn } = useReturns()
  const { products, updateProduct } = useProducts()
  const { customers, updateCustomer } = useCustomers()
  const [returningLineId, setReturningLineId] = React.useState<number | null>(null)

  const applyCompletedReturnEffects = React.useCallback(
    (created: ReturnRow, order: OrderRow) => {
      for (const line of created.lines) {
        if (!isReturnableOrderLine(line)) continue
        restoreStockForProductName(
          line.productName,
          line.quantity,
          products,
          updateProduct
        )
      }

      const customer = customers.find(
        (item) =>
          item.name.trim().toLowerCase() ===
          order.customerName.trim().toLowerCase()
      )
      if (customer) {
        updateCustomer(
          customer.id,
          applySalesReturnToCustomer(
            customer,
            created.totalAmount,
            created.refundDue
          )
        )
      }
    },
    [customers, products, updateCustomer, updateProduct]
  )

  const returnInvoiceLine = React.useCallback(
    async (order: OrderRow, line: OrderLineRow) => {
      if (!canReturnDocument(order)) {
        toast.error("Only completed paid sales can be returned.")
        return false
      }
      if (!isReturnableOrderLine(line)) {
        toast.error("This line cannot be returned.")
        return false
      }

      const quantity = await confirmReturnLineAction({
        itemName: line.productName,
        referenceNumber: order.invoiceNumber,
        unitPrice: line.unitPrice,
        maxQuantity: line.quantity,
      })
      if (!quantity) return false

      const draft = buildReturnFromOrder(order, {
        lineIds: [line.id],
        quantities: { [line.id]: quantity },
      })

      setReturningLineId(line.id)
      try {
        const created = addReturn(
          { ...draft, status: "completed" },
          { getOrder, onApplySales: updateOrder }
        )

        applyCompletedReturnEffects(created, order)

        toast.success(
          `Return ${created.returnNumber} recorded. Invoice ${order.invoiceNumber} updated.`
        )
        return true
      } finally {
        setReturningLineId(null)
      }
    },
    [addReturn, applyCompletedReturnEffects, getOrder, updateOrder]
  )

  return { returnInvoiceLine, returningLineId, applyCompletedReturnEffects }
}
