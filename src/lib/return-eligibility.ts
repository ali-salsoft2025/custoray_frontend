import { isAdditionLine, isDiscountLine } from "@/lib/pos"

type ReturnEligibleDocument = {
  status?: "pending" | "completed" | "cancelled"
  paidAmount: string
}

export const ALL_ITEMS_RETURNED_NAME = "(All items returned)"

function parsePaidAmount(value: string): number {
  const paid = Number(String(value).replace(/,/g, ""))
  return Number.isFinite(paid) ? paid : 0
}

export function canReturnDocument(doc: ReturnEligibleDocument): boolean {
  const status = doc.status ?? "pending"
  if (status !== "completed") return false
  return parsePaidAmount(doc.paidAmount) > 0
}

export function canCancelDocument(doc: ReturnEligibleDocument): boolean {
  const status = doc.status ?? "pending"
  if (status === "cancelled") return false
  const unpaid = parsePaidAmount(doc.paidAmount) <= 0
  return unpaid && status === "pending"
}

export function isReturnableOrderLine(line: {
  productName: string
  quantity: number
  lineTotal: string
}): boolean {
  const name = line.productName.trim()
  if (!name || name === ALL_ITEMS_RETURNED_NAME) return false
  if (isDiscountLine(line) || isAdditionLine(line)) return false
  return line.quantity > 0 && Number(line.lineTotal) !== 0
}
