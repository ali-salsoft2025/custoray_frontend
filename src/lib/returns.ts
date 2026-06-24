import { z } from "zod"

import { formatMoney, parseMoney } from "@/lib/customers"
import { computeLineTotal, computeOrderTotal, type OrderRow } from "@/lib/orders"
import { computePurchaseTotal, type PurchaseRow } from "@/lib/purchases"

export { formatMoney }

export const returnLineSchema = z.object({
  id: z.number(),
  sourceLineId: z.number(),
  productName: z.string(),
  quantity: z.number(),
  maxQuantity: z.number(),
  unitPrice: z.string(),
  lineTotal: z.string(),
})

export type ReturnLineRow = z.infer<typeof returnLineSchema>

export const returnSchema = z.object({
  id: z.number(),
  returnNumber: z.string(),
  type: z.enum(["sales", "purchase"]),
  sourceId: z.number(),
  referenceNumber: z.string(),
  partyName: z.string(),
  returnDate: z.string(),
  description: z.string(),
  totalAmount: z.string(),
  refundedAmount: z.string(),
  sourcePaidAmount: z.string(),
  sourceTotalBefore: z.string(),
  sourceTotalAfter: z.string(),
  refundDue: z.string(),
  balanceDue: z.string(),
  status: z.enum(["pending", "completed", "cancelled"]),
  lines: z.array(returnLineSchema).min(1),
})

export type ReturnRow = z.infer<typeof returnSchema>

export const RETURNS_STORAGE_KEY = "custoray-returns-v1"

export const EMPTY_RETURN_LINE: ReturnLineRow = {
  id: 1,
  sourceLineId: 1,
  productName: "",
  quantity: 1,
  maxQuantity: 1,
  unitPrice: "0",
  lineTotal: "0.00",
}

export const EMPTY_RETURN: ReturnRow = {
  id: 0,
  returnNumber: "",
  type: "sales",
  sourceId: 0,
  referenceNumber: "—",
  partyName: "—",
  returnDate: new Date().toISOString().slice(0, 10),
  description: "—",
  totalAmount: "0.00",
  refundedAmount: "0.00",
  sourcePaidAmount: "0.00",
  sourceTotalBefore: "0.00",
  sourceTotalAfter: "0.00",
  refundDue: "0.00",
  balanceDue: "0.00",
  status: "pending",
  lines: [{ ...EMPTY_RETURN_LINE }],
}

export function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)
}

export function computeReturnTotal(lines: Pick<ReturnLineRow, "lineTotal">[]): string {
  const sum = lines.reduce((acc, line) => {
    const n = Number(line.lineTotal)
    return acc + (Number.isFinite(n) ? n : 0)
  }, 0)
  return sum.toFixed(2)
}

export function computePaymentImpact(
  paidAmount: string,
  totalBefore: string,
  returnAmount: string
) {
  const paid = Number(paidAmount)
  const before = Number(totalBefore)
  const returned = Number(returnAmount)
  const safePaid = Number.isFinite(paid) ? paid : 0
  const safeBefore = Number.isFinite(before) ? before : 0
  const safeReturned = Number.isFinite(returned) ? returned : 0
  const totalAfter = Math.max(0, safeBefore - safeReturned)
  const refundDue = Math.max(0, safePaid - totalAfter)
  const balanceDue = Math.max(0, totalAfter - safePaid)
  return {
    sourceTotalAfter: totalAfter.toFixed(2),
    refundDue: refundDue.toFixed(2),
    balanceDue: balanceDue.toFixed(2),
  }
}

export function nextReturnNumber(
  existing: ReturnRow[],
  type: ReturnRow["type"]
): string {
  const prefix = type === "sales" ? "SR" : "PR"
  const nums = existing
    .filter((row) => row.type === type)
    .map((row) => {
      const match = row.returnNumber.match(new RegExp(`^${prefix}-(\\d+)$`))
      return match ? Number(match[1]) : 0
    })
  const next = (nums.length ? Math.max(...nums) : 3000) + 1
  return `${prefix}-${next}`
}

export function buildReturnFromOrder(
  order: OrderRow,
  options?: { lineIds?: number[] }
): Omit<ReturnRow, "id"> {
  const lineFilter = options?.lineIds?.length
    ? (line: OrderRow["lines"][number]) => options.lineIds!.includes(line.id)
    : () => true

  const lines: ReturnLineRow[] = (order.lines ?? [])
    .filter(lineFilter)
    .map((line, index) => ({
      id: index + 1,
      sourceLineId: line.id,
      productName: line.productName,
      quantity: line.quantity,
      maxQuantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
    }))

  const totalAmount = computeReturnTotal(lines)
  const impact = computePaymentImpact(order.paidAmount, order.totalAmount, totalAmount)

  return {
    returnNumber: "",
    type: "sales",
    sourceId: order.id,
    referenceNumber: order.invoiceNumber,
    partyName: order.customerName,
    returnDate: new Date().toISOString().slice(0, 10),
    description: "—",
    totalAmount,
    refundedAmount: impact.refundDue,
    sourcePaidAmount: order.paidAmount,
    sourceTotalBefore: order.totalAmount,
    sourceTotalAfter: impact.sourceTotalAfter,
    refundDue: impact.refundDue,
    balanceDue: impact.balanceDue,
    status: "pending",
    lines: lines.length > 0 ? lines : [{ ...EMPTY_RETURN_LINE }],
  }
}

export function buildReturnFromPurchase(
  purchase: PurchaseRow,
  options?: { lineIds?: number[] }
): Omit<ReturnRow, "id"> {
  const lineFilter = options?.lineIds?.length
    ? (line: PurchaseRow["lines"][number]) => options.lineIds!.includes(line.id)
    : () => true

  const lines: ReturnLineRow[] = (purchase.lines ?? [])
    .filter(lineFilter)
    .map((line, index) => ({
      id: index + 1,
      sourceLineId: line.id,
      productName: line.productName,
      quantity: line.quantity,
      maxQuantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
    }))

  const totalAmount = computeReturnTotal(lines)
  const impact = computePaymentImpact(
    purchase.paidAmount,
    purchase.totalAmount,
    totalAmount
  )

  return {
    returnNumber: "",
    type: "purchase",
    sourceId: purchase.id,
    referenceNumber: purchase.purchaseNumber,
    partyName: purchase.vendorName,
    returnDate: new Date().toISOString().slice(0, 10),
    description: "—",
    totalAmount,
    refundedAmount: impact.refundDue,
    sourcePaidAmount: purchase.paidAmount,
    sourceTotalBefore: purchase.totalAmount,
    sourceTotalAfter: impact.sourceTotalAfter,
    refundDue: impact.refundDue,
    balanceDue: impact.balanceDue,
    status: "pending",
    lines: lines.length > 0 ? lines : [{ ...EMPTY_RETURN_LINE }],
  }
}

export function applyReturnToOrder(order: OrderRow, returnDoc: ReturnRow): OrderRow {
  const returnByLineId = new Map(
    returnDoc.lines.map((line) => [line.sourceLineId, line.quantity])
  )

  const nextLines = (order.lines ?? [])
    .map((line) => {
      const returnQty = returnByLineId.get(line.id) ?? 0
      if (returnQty <= 0) return line
      const newQty = line.quantity - returnQty
      if (newQty <= 0) return null
      return {
        ...line,
        quantity: newQty,
        lineTotal: computeLineTotal(newQty, line.unitPrice),
      }
    })
    .filter((line): line is OrderRow["lines"][number] => line !== null)

  const lines =
    nextLines.length > 0
      ? nextLines
      : [
          {
            id: 1,
            productName: "(All items returned)",
            quantity: 1,
            unitPrice: "0",
            lineTotal: "0.00",
          },
        ]

  return {
    ...order,
    totalAmount: computeOrderTotal(lines),
    lines,
  }
}

export function applyReturnToPurchase(
  purchase: PurchaseRow,
  returnDoc: ReturnRow
): PurchaseRow {
  const returnByLineId = new Map(
    returnDoc.lines.map((line) => [line.sourceLineId, line.quantity])
  )

  const nextLines = (purchase.lines ?? [])
    .map((line) => {
      const returnQty = returnByLineId.get(line.id) ?? 0
      if (returnQty <= 0) return line
      const newQty = line.quantity - returnQty
      if (newQty <= 0) return null
      return {
        ...line,
        quantity: newQty,
        lineTotal: computeLineTotal(newQty, line.unitPrice),
      }
    })
    .filter((line): line is PurchaseRow["lines"][number] => line !== null)

  const lines =
    nextLines.length > 0
      ? nextLines
      : [
          {
            id: 1,
            productName: "(All items returned)",
            quantity: 1,
            unitPrice: "0",
            lineTotal: "0.00",
          },
        ]

  return {
    ...purchase,
    totalAmount: computePurchaseTotal(lines),
    lines,
  }
}

export function returnFromFormData(fd: FormData, id: number): ReturnRow {
  const type = (String(fd.get("type") ?? "sales") as ReturnRow["type"]) || "sales"
  const lines: ReturnLineRow[] = []
  let lineIndex = 0

  while (fd.has(`lines[${lineIndex}].productName`)) {
    const quantity = Number(fd.get(`lines[${lineIndex}].quantity`)) || 1
    const unitPrice = parseMoney(String(fd.get(`lines[${lineIndex}].unitPrice`) ?? "0"))
    const maxQuantity =
      Number(fd.get(`lines[${lineIndex}].maxQuantity`)) || quantity
    lines.push({
      id: Number(fd.get(`lines[${lineIndex}].id`)) || lineIndex + 1,
      sourceLineId: Number(fd.get(`lines[${lineIndex}].sourceLineId`)) || lineIndex + 1,
      productName: String(fd.get(`lines[${lineIndex}].productName`) ?? "").trim(),
      quantity,
      maxQuantity,
      unitPrice,
      lineTotal: computeLineTotal(quantity, unitPrice),
    })
    lineIndex++
  }

  const totalAmount = computeReturnTotal(lines)
  const sourcePaidAmount = parseMoney(String(fd.get("sourcePaidAmount") ?? "0"))
  const sourceTotalBefore = parseMoney(String(fd.get("sourceTotalBefore") ?? "0"))
  const refundedAmount = parseMoney(String(fd.get("refundedAmount") ?? "0"))
  const impact = computePaymentImpact(sourcePaidAmount, sourceTotalBefore, totalAmount)

  return {
    id,
    returnNumber: String(fd.get("returnNumber") ?? "").trim(),
    type,
    sourceId: Number(fd.get("sourceId")) || 0,
    referenceNumber: String(fd.get("referenceNumber") ?? "—").trim(),
    partyName: String(fd.get("partyName") ?? "—").trim(),
    returnDate:
      String(fd.get("returnDate") ?? "").trim() ||
      new Date().toISOString().slice(0, 10),
    description: String(fd.get("description") ?? "").trim() || "—",
    totalAmount,
    refundedAmount: refundedAmount || impact.refundDue,
    sourcePaidAmount,
    sourceTotalBefore,
    sourceTotalAfter: impact.sourceTotalAfter,
    refundDue: impact.refundDue,
    balanceDue: impact.balanceDue,
    status: (String(fd.get("status") ?? "pending") as ReturnRow["status"]) || "pending",
    lines: lines.length > 0 ? lines : [{ ...EMPTY_RETURN_LINE }],
  }
}

export function parsePersistedReturns(raw: string | null): ReturnRow[] | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    const result = z.array(returnSchema).safeParse(parsed)
    return result.success ? result.data : null
  } catch {
    return null
  }
}
