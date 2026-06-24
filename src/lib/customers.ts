import { z } from "zod"

export const customerSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  openingBalance: z.string(),
  totalSales: z.string(),
  totalPayments: z.string(),
  phone: z.string(),
  status: z.enum(["active", "inactive"]),
  imageUrl: z.string().default(""),
})

export type CustomerRow = z.infer<typeof customerSchema>

export const CUSTOMERS_STORAGE_KEY = "custoray-customers-v4"

export const initialCustomers: CustomerRow[] = [
  {
    id: 1,
    name: "Acme Retail Co.",
    description: "Wholesale buyer — priority lane",
    openingBalance: "15000.00",
    totalSales: "124580.50",
    totalPayments: "110000.00",
    phone: "+92 300 1234567",
    status: "active",
    imageUrl: "",
  },
  {
    id: 2,
    name: "Northwind Traders",
    description: "Seasonal peaks Q2–Q4",
    openingBalance: "8500.00",
    totalSales: "89220.00",
    totalPayments: "65000.00",
    phone: "+92 321 9876543",
    status: "inactive",
    imageUrl: "",
  },
  {
    id: 3,
    name: "Contoso Foods",
    description: "Cold chain — weekly invoicing",
    openingBalance: "5000.00",
    totalSales: "45600.25",
    totalPayments: "42000.00",
    phone: "+92 333 4567890",
    status: "active",
    imageUrl: "",
  },
  {
    id: 4,
    name: "Fabrikam Logistics",
    description: "Net 45 — collections watch",
    openingBalance: "25000.00",
    totalSales: "201340.00",
    totalPayments: "180000.00",
    phone: "+92 345 1122334",
    status: "inactive",
    imageUrl: "",
  },
  {
    id: 5,
    name: "Litware Inc.",
    description: "SMB — card on file",
    openingBalance: "1200.00",
    totalSales: "18750.00",
    totalPayments: "15000.00",
    phone: "+92 312 5566778",
    status: "inactive",
    imageUrl: "",
  },
]

export const EMPTY_CUSTOMER: CustomerRow = {
  id: 0,
  name: "",
  description: "",
  openingBalance: "0",
  totalSales: "0",
  totalPayments: "0",
  phone: "",
  status: "active",
  imageUrl: "",
}

export function computeBalance(
  customer: Pick<CustomerRow, "openingBalance" | "totalSales" | "totalPayments">
): string {
  const opening = Number(customer.openingBalance)
  const sales = Number(customer.totalSales)
  const payments = Number(customer.totalPayments)
  const balance =
    (Number.isFinite(opening) ? opening : 0) +
    (Number.isFinite(sales) ? sales : 0) -
    (Number.isFinite(payments) ? payments : 0)
  return balance.toFixed(2)
}

export function formatMoney(value: string): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return value
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n)
}

export function parseMoney(raw: string): string {
  const t = raw.replace(/[^0-9.-]/g, "")
  const n = Number(t)
  return Number.isFinite(n) ? n.toFixed(2) : "0.00"
}

export function statusBadgeClass(status: CustomerRow["status"]) {
  if (status === "active")
    return "border-emerald-500/30 px-1.5 text-emerald-700 dark:text-emerald-400"
  return "border-border px-1.5 text-muted-foreground"
}

export function statusLabel(status: CustomerRow["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function parseStatus(raw: string): CustomerRow["status"] {
  const statusRaw = raw.toLowerCase().replace(/\s+/g, "_")
  if (statusRaw === "on_hold" || statusRaw === "on-hold") return "inactive"
  if (statusRaw === "inactive") return "inactive"
  return "active"
}

export function mapImportedCustomer(
  row: Record<string, string>,
  existing: CustomerRow[]
): CustomerRow | null {
  const maxId = existing.reduce((m, x) => Math.max(m, x.id), 0)
  const id = Number(row.id)
  const finalId = Number.isFinite(id) && id > 0 ? id : maxId + 1
  const name = (row.name ?? "").trim()
  if (!name) return null

  return {
    id: finalId,
    name,
    description: (row.description ?? row.desc ?? "").trim() || "—",
    openingBalance: parseMoney(String(row.openingBalance ?? row.opening_balance ?? "0")),
    totalSales: parseMoney(String(row.totalSales ?? row.total_sales ?? "0")),
    totalPayments: parseMoney(String(row.totalPayments ?? row.total_payments ?? "0")),
    phone: (row.phone ?? row.phone_number ?? "").trim() || "—",
    status: parseStatus(row.status ?? "active"),
    imageUrl: (row.imageUrl ?? row.image_url ?? "").trim(),
  }
}

export function customerFromFormData(fd: FormData, id: number): CustomerRow {
  const name = String(fd.get("name") ?? "").trim()
  return {
    id,
    name,
    description: String(fd.get("description") ?? "").trim() || "—",
    openingBalance: parseMoney(String(fd.get("openingBalance") ?? "0")),
    totalSales: parseMoney(String(fd.get("totalSales") ?? "0")),
    totalPayments: parseMoney(String(fd.get("totalPayments") ?? "0")),
    phone: String(fd.get("phone") ?? "").trim() || "—",
    status: parseStatus(String(fd.get("status") ?? "active")),
    imageUrl: String(fd.get("imageUrl") ?? "").trim(),
  }
}

export function parsePersistedCustomers(raw: string | null): CustomerRow[] | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    const normalized = Array.isArray(parsed)
      ? parsed.map((row) =>
          row && typeof row === "object" && (row as CustomerRow).status === "on_hold"
            ? { ...row, status: "inactive" }
            : row
        )
      : parsed
    const result = z.array(customerSchema).safeParse(normalized)
    return result.success ? result.data : null
  } catch {
    return null
  }
}
