import { z } from "zod"

import { normalizeUniqueNumericIds, nextUniqueNumericId } from "@/lib/utils"
export const departmentSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  status: z.enum(["active", "inactive"]).default("active"),
})

export type DepartmentRow = z.infer<typeof departmentSchema>

export const DEPARTMENTS_STORAGE_KEY = "custoray-departments-v2"

export const initialDepartments: DepartmentRow[] = [
  {
    id: 1,
    name: "Sales",
    description: "Customer-facing sales team",
    status: "active",
  },
  {
    id: 2,
    name: "Warehouse",
    description: "Inventory and fulfillment",
    status: "active",
  },
  {
    id: 3,
    name: "Accounts",
    description: "Finance and bookkeeping",
    status: "active",
  },
  {
    id: 4,
    name: "Operations",
    description: "Day-to-day business operations",
    status: "inactive",
  },
]

export const EMPTY_DEPARTMENT: DepartmentRow = {
  id: 0,
  name: "",
  description: "",
  status: "active",
}

export function parseStatus(value: string): "active" | "inactive" {
  return value === "inactive" ? "inactive" : "active"
}

export function parsePersistedDepartments(
  raw: string | null
): DepartmentRow[] | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return null
    const rows: DepartmentRow[] = []
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue
      const record = item as Record<string, unknown>
      const result = departmentSchema.safeParse({
        ...record,
        status: parseStatus(String(record.status ?? "active")),
        description:
          typeof record.description === "string" ? record.description : "—",
      })
      if (result.success) rows.push(result.data)
    }
    return rows.length > 0 ? normalizeUniqueNumericIds(rows) : null
  } catch {
    return null
  }
}

export function departmentFromFormData(
  fd: FormData,
  id: number
): DepartmentRow {
  return {
    id,
    name: String(fd.get("name") ?? "").trim(),
    description: String(fd.get("description") ?? "").trim() || "—",
    status: parseStatus(String(fd.get("status") ?? "active")),
  }
}

export function mapImportedDepartment(
  row: Record<string, string>,
  existing: DepartmentRow[]
): DepartmentRow | null {
  const name = (row.name ?? "").trim()
  if (!name) return null
  const parsedId = Number(row.id)
  const finalId = nextUniqueNumericId(
    existing,
    Number.isFinite(parsedId) && parsedId > 0 ? parsedId : undefined
  )
  return {
    id: finalId,
    name,
    description: (row.description ?? "").trim() || "—",
    status: parseStatus(row.status ?? "active"),
  }
}
