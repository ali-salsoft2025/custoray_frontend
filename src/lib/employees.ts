import { z } from "zod"

import {
  employeePermissionsSchema,
  NO_PERMISSIONS,
  type EmployeePermissions,
} from "@/lib/employee-permissions"
import { parseStatus, statusBadgeClass, statusLabel } from "@/lib/customers"

export { statusBadgeClass, statusLabel, parseStatus }

export const employeeSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  department: z.string(),
  designation: z.string(),
  status: z.enum(["active", "inactive"]),
  hireDate: z.string(),
  baseSalary: z.string(),
  portalEnabled: z.boolean(),
  portalEmail: z.string(),
  portalPassword: z.string(),
  permissions: employeePermissionsSchema,
})

export type EmployeeRow = z.infer<typeof employeeSchema>

export const EMPLOYEES_STORAGE_KEY = "custoray-employees-v1"

export const initialEmployees: EmployeeRow[] = [
  {
    id: 1,
    name: "Sara Ahmed",
    email: "sara.ahmed@example.com",
    phone: "+92 300 1112233",
    department: "Sales",
    designation: "Sales Manager",
    status: "active",
    hireDate: "2023-04-15",
    baseSalary: "85000.00",
    portalEnabled: true,
    portalEmail: "sara@custoray.demo",
    portalPassword: "staff123",
    permissions: { view: true, edit: true, delete: false, admin: false },
  },
  {
    id: 2,
    name: "Omar Khan",
    email: "omar.khan@example.com",
    phone: "+92 321 4455667",
    department: "Warehouse",
    designation: "Inventory Clerk",
    status: "active",
    hireDate: "2024-01-10",
    baseSalary: "45000.00",
    portalEnabled: true,
    portalEmail: "omar@custoray.demo",
    portalPassword: "staff123",
    permissions: { view: true, edit: false, delete: false, admin: false },
  },
  {
    id: 3,
    name: "Fatima Noor",
    email: "fatima.noor@example.com",
    phone: "+92 333 7788990",
    department: "Accounts",
    designation: "Accountant",
    status: "inactive",
    hireDate: "2022-08-01",
    baseSalary: "72000.00",
    portalEnabled: false,
    portalEmail: "",
    portalPassword: "",
    permissions: NO_PERMISSIONS,
  },
]

export const EMPTY_EMPLOYEE: EmployeeRow = {
  id: 0,
  name: "",
  email: "",
  phone: "",
  department: "",
  designation: "",
  status: "active",
  hireDate: new Date().toISOString().slice(0, 10),
  baseSalary: "0",
  portalEnabled: false,
  portalEmail: "",
  portalPassword: "",
  permissions: { view: true, edit: false, delete: false, admin: false },
}

export function employeeFromFormData(
  fd: FormData,
  id: number,
  existing?: EmployeeRow
): EmployeeRow {
  const portalEnabled = fd.get("portalEnabled") === "on"
  const permissions = parsePermissionsFromForm(fd)

  return {
    id,
    name: String(fd.get("name") ?? "").trim(),
    email: String(fd.get("email") ?? "").trim(),
    phone: String(fd.get("phone") ?? "").trim() || "—",
    department: String(fd.get("department") ?? "").trim() || "—",
    designation: String(fd.get("designation") ?? "").trim() || "—",
    status: parseStatus(String(fd.get("status") ?? "active")),
    hireDate: String(fd.get("hireDate") ?? "").trim() || new Date().toISOString().slice(0, 10),
    baseSalary: String(fd.get("baseSalary") ?? "0").trim() || "0",
    portalEnabled,
    portalEmail: portalEnabled
      ? String(fd.get("portalEmail") ?? "").trim().toLowerCase()
      : "",
    portalPassword: portalEnabled
      ? String(fd.get("portalPassword") ?? "").trim() ||
        existing?.portalPassword ||
        ""
      : "",
    permissions,
  }
}

function parsePermissionsFromForm(fd: FormData): EmployeePermissions {
  const admin = fd.get("perm_admin") === "on"
  if (admin) {
    return { view: true, edit: true, delete: true, admin: true }
  }
  return {
    view: fd.get("perm_view") === "on",
    edit: fd.get("perm_edit") === "on",
    delete: fd.get("perm_delete") === "on",
    admin: false,
  }
}

export function mapImportedEmployee(
  row: Record<string, string>,
  existing: EmployeeRow[]
): EmployeeRow | null {
  const maxId = existing.reduce((m, x) => Math.max(m, x.id), 0)
  const id = Number(row.id)
  const finalId = Number.isFinite(id) && id > 0 ? id : maxId + 1
  const name = (row.name ?? "").trim()
  if (!name) return null

  return {
    id: finalId,
    name,
    email: (row.email ?? "").trim(),
    phone: (row.phone ?? "").trim() || "—",
    department: (row.department ?? "").trim() || "—",
    designation: (row.designation ?? "").trim() || "—",
    status: parseStatus(row.status ?? "active"),
    hireDate: (row.hireDate ?? "").trim() || new Date().toISOString().slice(0, 10),
    baseSalary: (row.baseSalary ?? "0").trim() || "0",
    portalEnabled: row.portalEnabled === "true" || row.portalEnabled === "yes",
    portalEmail: (row.portalEmail ?? "").trim().toLowerCase(),
    portalPassword: (row.portalPassword ?? "").trim(),
    permissions: NO_PERMISSIONS,
  }
}

export function parsePersistedEmployees(raw: string | null): EmployeeRow[] | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return null
    const rows: EmployeeRow[] = []
    for (const item of parsed) {
      const result = employeeSchema.safeParse({
        ...item,
        baseSalary:
          typeof item === "object" && item && "baseSalary" in item
            ? (item as EmployeeRow).baseSalary
            : "0",
      })
      if (result.success) rows.push(result.data)
    }
    return rows.length > 0 ? rows : null
  } catch {
    return null
  }
}

export function findEmployeeByPortalLogin(
  employees: EmployeeRow[],
  email: string,
  password: string
): EmployeeRow | undefined {
  const normalized = email.trim().toLowerCase()
  return employees.find(
    (employee) =>
      employee.status === "active" &&
      employee.portalEnabled &&
      employee.portalEmail === normalized &&
      employee.portalPassword === password
  )
}
