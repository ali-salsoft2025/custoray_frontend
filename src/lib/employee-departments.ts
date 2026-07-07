import { z } from "zod"

export const departmentSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
})

export type DepartmentRow = z.infer<typeof departmentSchema>

export const DEPARTMENTS_STORAGE_KEY = "custoray-departments-v1"

export const initialDepartments: DepartmentRow[] = [
  { id: 1, name: "Sales", description: "Customer-facing sales team" },
  { id: 2, name: "Warehouse", description: "Inventory and fulfillment" },
  { id: 3, name: "Accounts", description: "Finance and bookkeeping" },
  { id: 4, name: "Operations", description: "Day-to-day business operations" },
]

export const EMPTY_DEPARTMENT: DepartmentRow = {
  id: 0,
  name: "",
  description: "",
}

export function parsePersistedDepartments(raw: string | null): DepartmentRow[] | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return null
    const rows: DepartmentRow[] = []
    for (const item of parsed) {
      const result = departmentSchema.safeParse(item)
      if (result.success) rows.push(result.data)
    }
    return rows.length > 0 ? rows : null
  } catch {
    return null
  }
}

export function departmentFromFormData(fd: FormData, id: number): DepartmentRow {
  return {
    id,
    name: String(fd.get("name") ?? "").trim(),
    description: String(fd.get("description") ?? "").trim() || "—",
  }
}
