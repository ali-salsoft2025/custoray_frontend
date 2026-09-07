import {
  computeLineTotal,
  computeOrderTotal,
  type OrderLineRow,
  type OrderRow,
} from "@/lib/orders"

import type { ProductRow } from "@/lib/products"

export const POS_ORDER_DESCRIPTION = "POS sale"
export const POS_DISCOUNT_LINE_NAME = "Discount"
export const POS_ADDITION_LINE_NAME = "Addition"

function normalizeLineName(name: string): string {
  return name.trim().toLowerCase()
}

export function isDiscountLine(line: { productName: string }): boolean {
  return normalizeLineName(line.productName) === POS_DISCOUNT_LINE_NAME.toLowerCase()
}

export function isAdditionLine(line: { productName: string }): boolean {
  const name = normalizeLineName(line.productName)
  return (
    name === POS_ADDITION_LINE_NAME.toLowerCase() || name === "additions"
  )
}

export type PosCartLine = {
  productId: number
  productName: string
  sku: string
  quantity: number
  unitPrice: string
  maxStock: number
  /** When set, overrides quantity × unit price for this line. */
  finalLineTotal?: string
}

export function cartLineBaseTotal(line: PosCartLine): string {
  return computeLineTotal(line.quantity, line.unitPrice)
}

export function cartLineTotal(line: PosCartLine): string {
  if (line.finalLineTotal !== undefined && line.finalLineTotal !== "") {
    const parsed = Number(line.finalLineTotal)
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed.toFixed(2)
    }
  }
  return cartLineBaseTotal(line)
}

export function cartLineAdjustment(line: PosCartLine): string {
  const base = Number(cartLineBaseTotal(line))
  const finalTotal = Number(cartLineTotal(line))
  if (!Number.isFinite(base) || !Number.isFinite(finalTotal)) return "0.00"
  return (finalTotal - base).toFixed(2)
}

export function cartLineHasAdjustment(line: PosCartLine): boolean {
  return Math.abs(Number(cartLineAdjustment(line))) >= 0.005
}

export function isPosOrder(
  order: Pick<OrderRow, "invoiceNumber" | "description">
): boolean {
  return (
    order.description === POS_ORDER_DESCRIPTION ||
    order.invoiceNumber.startsWith("POS-")
  )
}

export function nextPosInvoiceNumber(
  existing: OrderRow[],
  prefix = "POS"
): string {
  const safePrefix =
    prefix.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "") || "POS"
  const pattern = new RegExp(`^${safePrefix}-(\\d+)$`)
  const nums = existing
    .filter(isPosOrder)
    .map((order) => {
      const match = order.invoiceNumber.match(pattern)
      return match ? Number(match[1]) : 0
    })
  const next = (nums.length ? Math.max(...nums) : 1000) + 1
  return `${safePrefix}-${next}`
}

export function cartSubtotal(cart: PosCartLine[]): string {
  const lines = cart.map((line) => ({ lineTotal: cartLineTotal(line) }))
  return computeOrderTotal(lines)
}

export function cartListSubtotal(cart: PosCartLine[]): string {
  const lines = cart.map((line) => ({ lineTotal: cartLineBaseTotal(line) }))
  return computeOrderTotal(lines)
}

export function cartAdjustmentTotals(cart: PosCartLine[]): {
  discounts: string
  additions: string
} {
  let discounts = 0
  let additions = 0
  for (const line of cart) {
    const adjustment = Number(cartLineAdjustment(line))
    if (!Number.isFinite(adjustment)) continue
    if (adjustment > 0.005) additions += adjustment
    else if (adjustment < -0.005) discounts += Math.abs(adjustment)
  }
  return {
    discounts: discounts.toFixed(2),
    additions: additions.toFixed(2),
  }
}

export function normalizeDiscountAmount(
  subtotal: string,
  discountAmount: string
): string {
  const sub = Number(subtotal)
  const safeSub = Number.isFinite(sub) ? sub : 0
  const disc = Number(discountAmount)
  const safeDisc = Number.isFinite(disc) ? disc : 0
  return Math.min(Math.max(0, safeDisc), safeSub).toFixed(2)
}

export function computePosTotals(subtotal: string, discountAmount: string) {
  const normalizedSubtotal = Number(subtotal)
  const safeSubtotal = Number.isFinite(normalizedSubtotal) ? normalizedSubtotal : 0
  const discount = normalizeDiscountAmount(subtotal, discountAmount)
  const total = Math.max(0, safeSubtotal - Number(discount)).toFixed(2)
  return {
    subtotal: safeSubtotal.toFixed(2),
    discount,
    total,
  }
}

export function buildPosOrderFromCart(
  cart: PosCartLine[],
  options: {
    customerName: string
    paymentMethod: OrderRow["paymentMethod"]
    invoiceNumber: string
    orderDate?: string
    discountAmount?: string
    status?: OrderRow["status"]
    paidAmount?: string
  }
): Omit<OrderRow, "id"> {
  const productLines: OrderLineRow[] = cart.map((line, index) => {
    const lineTotal = cartLineTotal(line)
    const effectiveUnitPrice =
      line.quantity > 0
        ? (Number(lineTotal) / line.quantity).toFixed(2)
        : line.unitPrice

    return {
      id: index + 1,
      productName: line.productName,
      quantity: line.quantity,
      unitPrice: effectiveUnitPrice,
      lineTotal,
    }
  })

  const subtotal = computeOrderTotal(productLines)
  const discount = normalizeDiscountAmount(subtotal, options.discountAmount ?? "0")
  const { total } = computePosTotals(subtotal, discount)

  const lines =
    Number(discount) > 0
      ? [
          ...productLines,
          {
            id: productLines.length + 1,
            productName: POS_DISCOUNT_LINE_NAME,
            quantity: 1,
            unitPrice: `-${discount}`,
            lineTotal: `-${discount}`,
          },
        ]
      : productLines

  const description =
    Number(discount) > 0
      ? `${POS_ORDER_DESCRIPTION} · Discount ${discount}`
      : POS_ORDER_DESCRIPTION

  const status = options.status ?? "completed"

  return {
    invoiceNumber: options.invoiceNumber,
    customerName: options.customerName.trim() || "Walk-in",
    description,
    orderDate: options.orderDate ?? new Date().toISOString().slice(0, 10),
    totalAmount: total,
    paidAmount:
      options.paidAmount ??
      (status === "completed" ? total : "0.00"),
    paymentMethod: options.paymentMethod,
    status,
    lines,
  }
}

function isActiveLifecycle(lifecycle: ProductRow["lifecycle"] | string | undefined) {
  return String(lifecycle ?? "active").toLowerCase() === "active"
}

function inStock(product: ProductRow) {
  return Number(product.stock) > 0
}

/** Active inventory rows for the POS sale catalog. */
export function posCatalogProducts(
  products: ProductRow[],
  options?: { hideOutOfStock?: boolean }
): ProductRow[] {
  const hideOutOfStock = options?.hideOutOfStock ?? true
  const active = products.filter((product) => isActiveLifecycle(product.lifecycle))
  const available = hideOutOfStock ? active.filter(inStock) : active
  const catalog = available.length > 0 ? available : active
  return [...catalog].sort((a, b) => a.name.localeCompare(b.name))
}

/** Active inventory rows for POS returns (includes out-of-stock items). */
export function posReturnCatalogProducts(products: ProductRow[]): ProductRow[] {
  return products
    .filter((product) => isActiveLifecycle(product.lifecycle))
    .sort((a, b) => a.name.localeCompare(b.name))
}
