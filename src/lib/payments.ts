import { z } from "zod"

import { formatMoney, parseMoney } from "@/lib/customers"

export { formatMoney, parseMoney }

export const PAYMENT_METHODS = ["Cash", "Bank transfer", "Card", "Credit"] as const

export const paymentSchema = z.object({
  id: z.number(),
  paymentNumber: z.string(),
  type: z.enum(["customer", "vendor"]),
  partyName: z.string(),
  referenceNumber: z.string(),
  paymentDate: z.string(),
  amount: z.string(),
  paymentMethod: z.enum(["Cash", "Bank transfer", "Card", "Credit"]),
  status: z.enum(["pending", "completed", "voided"]),
  notes: z.string(),
})

export type PaymentRow = z.infer<typeof paymentSchema>

export const PAYMENTS_STORAGE_KEY = "custoray-payments-v1"

export const initialPayments: PaymentRow[] = [
  {
    id: 1,
    paymentNumber: "CP-4001",
    type: "customer",
    partyName: "Acme Retail Co.",
    referenceNumber: "INV-1001",
    paymentDate: "2026-06-02",
    amount: "45200.00",
    paymentMethod: "Bank transfer",
    status: "completed",
    notes: "Full settlement — bulk order",
  },
  {
    id: 2,
    paymentNumber: "CP-4002",
    type: "customer",
    partyName: "Northwind Traders",
    referenceNumber: "INV-1002",
    paymentDate: "2026-06-06",
    amount: "15000.00",
    paymentMethod: "Credit",
    status: "completed",
    notes: "Partial payment on seasonal restock",
  },
  {
    id: 3,
    paymentNumber: "CP-4003",
    type: "customer",
    partyName: "Contoso Foods",
    referenceNumber: "INV-1003",
    paymentDate: "2026-06-11",
    amount: "12400.00",
    paymentMethod: "Cash",
    status: "completed",
    notes: "Cash on delivery",
  },
  {
    id: 4,
    paymentNumber: "VP-5001",
    type: "vendor",
    partyName: "Karachi Steel Supplies",
    referenceNumber: "PO-2001",
    paymentDate: "2026-06-04",
    amount: "28500.00",
    paymentMethod: "Bank transfer",
    status: "completed",
    notes: "Monthly stock replenishment",
  },
  {
    id: 5,
    paymentNumber: "VP-5002",
    type: "vendor",
    partyName: "Lahore Packaging Co.",
    referenceNumber: "PO-2002",
    paymentDate: "2026-06-15",
    amount: "9800.00",
    paymentMethod: "Card",
    status: "pending",
    notes: "Awaiting approval",
  },
  {
    id: 6,
    paymentNumber: "CP-4004",
    type: "customer",
    partyName: "Litware Inc.",
    referenceNumber: "INV-1005",
    paymentDate: "2026-06-19",
    amount: "2000.00",
    paymentMethod: "Bank transfer",
    status: "pending",
    notes: "Deposit on pending order",
  },
]

export const EMPTY_PAYMENT: PaymentRow = {
  id: 0,
  paymentNumber: "",
  type: "customer",
  partyName: "",
  referenceNumber: "—",
  paymentDate: new Date().toISOString().slice(0, 10),
  amount: "0.00",
  paymentMethod: "Cash",
  status: "pending",
  notes: "—",
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

export function nextPaymentNumber(
  existing: PaymentRow[],
  type: PaymentRow["type"]
): string {
  const prefix = type === "customer" ? "CP" : "VP"
  const nums = existing
    .filter((row) => row.type === type)
    .map((row) => {
      const match = row.paymentNumber.match(new RegExp(`^${prefix}-(\\d+)$`))
      return match ? Number(match[1]) : 0
    })
  const next = (nums.length ? Math.max(...nums) : type === "customer" ? 4000 : 5000) + 1
  return `${prefix}-${next}`
}

export function typeLabel(type: PaymentRow["type"]) {
  return type === "customer" ? "Customer payment" : "Vendor payment"
}

export function typeBadgeClass(type: PaymentRow["type"]) {
  if (type === "customer")
    return "border-blue-500/30 px-1.5 text-blue-700 dark:text-blue-400"
  return "border-violet-500/30 px-1.5 text-violet-700 dark:text-violet-400"
}

export function statusBadgeClass(status: PaymentRow["status"]) {
  if (status === "completed")
    return "border-emerald-500/30 px-1.5 text-emerald-700 dark:text-emerald-400"
  if (status === "pending")
    return "border-amber-500/30 px-1.5 text-amber-700 dark:text-amber-400"
  return "border-border px-1.5 text-muted-foreground"
}

export function statusLabel(status: PaymentRow["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function parsePaymentType(raw: string): PaymentRow["type"] {
  const normalized = raw.toLowerCase().replace(/\s+/g, "_")
  if (normalized === "vendor" || normalized === "vendor_payment") return "vendor"
  return "customer"
}

export function parsePaymentStatus(raw: string): PaymentRow["status"] {
  const normalized = raw.toLowerCase().replace(/\s+/g, "_")
  if (normalized === "completed") return "completed"
  if (normalized === "voided" || normalized === "void") return "voided"
  return "pending"
}

export function parsePaymentMethod(raw: string): PaymentRow["paymentMethod"] {
  const normalized = raw.trim()
  if (PAYMENT_METHODS.includes(normalized as PaymentRow["paymentMethod"])) {
    return normalized as PaymentRow["paymentMethod"]
  }
  return "Cash"
}

export function paymentStatusTabFilter(row: PaymentRow, tab: string) {
  if (tab === "all") return true
  return row.status === tab
}

export function paymentTabFilter(row: PaymentRow, tab: string) {
  if (tab === "all") return true
  if (tab === "customer" || tab === "vendor") return row.type === tab
  return row.status === tab
}

export function mapImportedPayment(
  row: Record<string, string>,
  existing: PaymentRow[]
): PaymentRow | null {
  const maxId = existing.reduce((m, x) => Math.max(m, x.id), 0)
  const id = Number(row.id)
  const finalId = Number.isFinite(id) && id > 0 ? id : maxId + 1
  const type = parsePaymentType(row.type ?? "customer")
  const partyName = (row.partyName ?? row.party_name ?? row.customer ?? row.vendor ?? "").trim()
  if (!partyName) return null

  const paymentNumber =
    (row.paymentNumber ?? row.payment_number ?? "").trim() ||
    nextPaymentNumber(existing, type)

  return {
    id: finalId,
    paymentNumber,
    type,
    partyName,
    referenceNumber:
      (row.referenceNumber ?? row.reference_number ?? row.reference ?? "").trim() || "—",
    paymentDate:
      (row.paymentDate ?? row.payment_date ?? row.date ?? "").trim() ||
      new Date().toISOString().slice(0, 10),
    amount: parseMoney(String(row.amount ?? "0")),
    paymentMethod: parsePaymentMethod(
      String(row.paymentMethod ?? row.payment_method ?? "Cash")
    ),
    status: parsePaymentStatus(row.status ?? "pending"),
    notes: (row.notes ?? row.description ?? "").trim() || "—",
  }
}

export function paymentFromFormData(fd: FormData, id: number): PaymentRow {
  const type = parsePaymentType(String(fd.get("type") ?? "customer"))
  const partyName = String(fd.get("partyName") ?? "").trim()
  return {
    id,
    paymentNumber: String(fd.get("paymentNumber") ?? "").trim(),
    type,
    partyName,
    referenceNumber: String(fd.get("referenceNumber") ?? "").trim() || "—",
    paymentDate:
      String(fd.get("paymentDate") ?? "").trim() ||
      new Date().toISOString().slice(0, 10),
    amount: parseMoney(String(fd.get("amount") ?? "0")),
    paymentMethod: parsePaymentMethod(String(fd.get("paymentMethod") ?? "Cash")),
    status: parsePaymentStatus(String(fd.get("status") ?? "pending")),
    notes: String(fd.get("notes") ?? "").trim() || "—",
  }
}

export function parsePersistedPayments(raw: string | null): PaymentRow[] | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    const result = z.array(paymentSchema).safeParse(parsed)
    return result.success ? result.data : null
  } catch {
    return null
  }
}
