import { z } from "zod"

import {
  employeePermissionsSchema,
  normalizePermissions,
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

export const EMPLOYEES_STORAGE_KEY = "custoray-employees-v2"

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
    permissions: normalizePermissions({
      admin: false,
      modules: {
        customers: { add: true, edit: true, delete: false },
        sales: { add: true, edit: true, delete: false },
        documents: { add: true, edit: true, delete: false },
      },
    }),
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
    permissions: normalizePermissions({
      admin: false,
      modules: {
        inventory: { add: true, edit: true, delete: false },
        purchases: { add: true, edit: false, delete: false },
      },
    }),
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
    permissions: { ...NO_PERMISSIONS },
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
  permissions: { ...NO_PERMISSIONS, modules: normalizePermissions(NO_PERMISSIONS).modules },
}

export type EmployeeFormValues = {
  name: string
  email: string
  phone: string
  department: string
  designation: string
  status: "active" | "inactive"
  hireDate: string
  baseSalary: string
  portalEnabled: boolean
  portalEmail: string
  portalPassword: string
  permissions: EmployeePermissions
}

export function employeeFromValues(
  values: EmployeeFormValues,
  id: number,
  existing?: EmployeeRow
): EmployeeRow {
  const portalEnabled = values.portalEnabled
  return {
    id,
    name: values.name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim() || "—",
    department: values.department.trim() || "—",
    designation: values.designation.trim() || "—",
    status: parseStatus(values.status),
    hireDate: values.hireDate.trim() || new Date().toISOString().slice(0, 10),
    baseSalary: values.baseSalary.trim() || "0",
    portalEnabled,
    portalEmail: portalEnabled ? values.portalEmail.trim().toLowerCase() : "",
    portalPassword: portalEnabled
      ? values.portalPassword.trim() || existing?.portalPassword || ""
      : "",
    permissions: normalizePermissions(values.permissions),
  }
}

/** @deprecated Prefer employeeFromValues for new UI */
export function employeeFromFormData(
  fd: FormData,
  id: number,
  existing?: EmployeeRow
): EmployeeRow {
  const portalEnabled = fd.get("portalEnabled") === "on"
  return employeeFromValues(
    {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      department: String(fd.get("department") ?? ""),
      designation: String(fd.get("designation") ?? ""),
      status: parseStatus(String(fd.get("status") ?? "active")),
      hireDate: String(fd.get("hireDate") ?? ""),
      baseSalary: String(fd.get("baseSalary") ?? "0"),
      portalEnabled,
      portalEmail: String(fd.get("portalEmail") ?? ""),
      portalPassword: String(fd.get("portalPassword") ?? ""),
      permissions: existing?.permissions ?? NO_PERMISSIONS,
    },
    id,
    existing
  )
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
    permissions: { ...NO_PERMISSIONS, modules: normalizePermissions(NO_PERMISSIONS).modules },
  }
}

export function parsePersistedEmployees(raw: string | null): EmployeeRow[] | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return null
    const rows: EmployeeRow[] = []
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue
      const record = item as Record<string, unknown>
      const result = employeeSchema.safeParse({
        ...record,
        permissions: normalizePermissions(record.permissions),
        baseSalary:
          typeof record.baseSalary === "string" || typeof record.baseSalary === "number"
            ? String(record.baseSalary)
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
