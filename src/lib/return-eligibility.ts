type ReturnEligibleDocument = {
  status?: "pending" | "completed" | "cancelled"
  paidAmount: string
}

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
