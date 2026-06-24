import { z } from "zod"

import {
  formatMoney,
  parseMoney,
  parseStatus,
  statusBadgeClass,
  statusLabel,
} from "@/lib/customers"

export { formatMoney, parseMoney, statusBadgeClass, statusLabel, parseStatus }

export const vendorSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  openingBalance: z.string(),
  totalPurchases: z.string(),
  totalPayments: z.string(),
  phone: z.string(),
  status: z.enum(["active", "inactive"]),
  imageUrl: z.string().default(""),
})

export type VendorRow = z.infer<typeof vendorSchema>

export const VENDORS_STORAGE_KEY = "custoray-vendors-v1"

export const initialVendors: VendorRow[] = [
  {
    id: 1,
    name: "Karachi Steel Supplies",
    description: "Raw materials — net 30 terms",
    openingBalance: "20000.00",
    totalPurchases: "485600.00",
    totalPayments: "460000.00",
    phone: "+92 300 4455667",
    status: "active",
    imageUrl: "",
  },
  {
    id: 2,
    name: "Lahore Packaging Co.",
    description: "Cartons and corrugated supplies",
    openingBalance: "7500.00",
    totalPurchases: "128400.50",
    totalPayments: "120000.00",
    phone: "+92 321 7788990",
    status: "active",
    imageUrl: "",
  },
  {
    id: 3,
    name: "Islamabad Tech Distributors",
    description: "Electronics wholesale",
    openingBalance: "12000.00",
    totalPurchases: "256780.00",
    totalPayments: "256780.00",
    phone: "+92 333 1122334",
    status: "inactive",
    imageUrl: "",
  },
  {
    id: 4,
    name: "Multan Agro Traders",
    description: "Seasonal produce supplier",
    openingBalance: "5000.00",
    totalPurchases: "89450.25",
    totalPayments: "70000.00",
    phone: "+92 345 5566778",
    status: "inactive",
    imageUrl: "",
  },
  {
    id: 5,
    name: "Peshawar Hardware Hub",
    description: "Tools and fixtures",
    openingBalance: "3000.00",
    totalPurchases: "42100.00",
    totalPayments: "41000.00",
    phone: "+92 312 9988776",
    status: "inactive",
    imageUrl: "",
  },
]

export const EMPTY_VENDOR: VendorRow = {
  id: 0,
  name: "",
  description: "",
  openingBalance: "0",
  totalPurchases: "0",
  totalPayments: "0",
  phone: "",
  status: "active",
  imageUrl: "",
}

export function computeBalance(
  vendor: Pick<VendorRow, "openingBalance" | "totalPurchases" | "totalPayments">
): string {
  const opening = Number(vendor.openingBalance)
  const purchases = Number(vendor.totalPurchases)
  const payments = Number(vendor.totalPayments)
  const balance =
    (Number.isFinite(opening) ? opening : 0) +
    (Number.isFinite(purchases) ? purchases : 0) -
    (Number.isFinite(payments) ? payments : 0)
  return balance.toFixed(2)
}

export function mapImportedVendor(
  row: Record<string, string>,
  existing: VendorRow[]
): VendorRow | null {
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
    totalPurchases: parseMoney(
      String(row.totalPurchases ?? row.total_purchases ?? "0")
    ),
    totalPayments: parseMoney(String(row.totalPayments ?? row.total_payments ?? "0")),
    phone: (row.phone ?? row.phone_number ?? "").trim() || "—",
    status: parseStatus(row.status ?? "active"),
    imageUrl: (row.imageUrl ?? row.image_url ?? "").trim(),
  }
}

export function vendorFromFormData(fd: FormData, id: number): VendorRow {
  const name = String(fd.get("name") ?? "").trim()
  return {
    id,
    name,
    description: String(fd.get("description") ?? "").trim() || "—",
    openingBalance: parseMoney(String(fd.get("openingBalance") ?? "0")),
    totalPurchases: parseMoney(String(fd.get("totalPurchases") ?? "0")),
    totalPayments: parseMoney(String(fd.get("totalPayments") ?? "0")),
    phone: String(fd.get("phone") ?? "").trim() || "—",
    status: parseStatus(String(fd.get("status") ?? "active")),
    imageUrl: String(fd.get("imageUrl") ?? "").trim(),
  }
}

export function parsePersistedVendors(raw: string | null): VendorRow[] | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    const normalized = Array.isArray(parsed)
      ? parsed.map((row) =>
          row && typeof row === "object" && (row as VendorRow).status === "on_hold"
            ? { ...row, status: "inactive" }
            : row
        )
      : parsed
    const result = z.array(vendorSchema).safeParse(normalized)
    return result.success ? result.data : null
  } catch {
    return null
  }
}
