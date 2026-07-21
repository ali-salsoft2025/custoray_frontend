import { z } from "zod"

export const MODULE_IDS = [
  "dashboard",
  "inventory",
  "customers",
  "vendors",
  "sales",
  "purchases",
  "returns",
  "payments",
  "documents",
  "pos",
  "employees",
  "reports",
  "settings",
] as const

export type ModuleId = (typeof MODULE_IDS)[number]

export const MODULE_LABELS: Record<ModuleId, string> = {
  dashboard: "Dashboard",
  inventory: "Inventory",
  customers: "Customers",
  vendors: "Vendors",
  sales: "Sales",
  purchases: "Purchases",
  returns: "Returns",
  payments: "Payments",
  documents: "Documents",
  pos: "POS",
  employees: "Employees",
  reports: "Reports",
  settings: "Settings",
}

export const modulePermissionSchema = z.object({
  add: z.boolean(),
  edit: z.boolean(),
  delete: z.boolean(),
})

export type ModulePermission = z.infer<typeof modulePermissionSchema>

export const employeePermissionsSchema = z.object({
  admin: z.boolean(),
  modules: z.record(z.string(), modulePermissionSchema),
})

export type EmployeePermissions = z.infer<typeof employeePermissionsSchema>

export const EMPTY_MODULE_PERMISSION: ModulePermission = {
  add: false,
  edit: false,
  delete: false,
}

export const FULL_MODULE_PERMISSION: ModulePermission = {
  add: true,
  edit: true,
  delete: true,
}

export function emptyModuleMap(): Record<ModuleId, ModulePermission> {
  return Object.fromEntries(
    MODULE_IDS.map((id) => [id, { ...EMPTY_MODULE_PERMISSION }])
  ) as Record<ModuleId, ModulePermission>
}

export function fullModuleMap(): Record<ModuleId, ModulePermission> {
  return Object.fromEntries(
    MODULE_IDS.map((id) => [id, { ...FULL_MODULE_PERMISSION }])
  ) as Record<ModuleId, ModulePermission>
}

export const NO_PERMISSIONS: EmployeePermissions = {
  admin: false,
  modules: emptyModuleMap(),
}

export const FULL_PERMISSIONS: EmployeePermissions = {
  admin: true,
  modules: fullModuleMap(),
}

/** Normalize stored / legacy permission shapes into the module map format. */
export function normalizePermissions(raw: unknown): EmployeePermissions {
  if (!raw || typeof raw !== "object") return { ...NO_PERMISSIONS, modules: emptyModuleMap() }

  const data = raw as Record<string, unknown>

  // Legacy flat shape: { view, edit, delete, admin }
  if (!("modules" in data) && ("view" in data || "edit" in data || "delete" in data)) {
    const admin = Boolean(data.admin)
    if (admin) return { ...FULL_PERMISSIONS, modules: fullModuleMap() }
    const grant = {
      add: Boolean(data.edit) || Boolean(data.view),
      edit: Boolean(data.edit),
      delete: Boolean(data.delete),
    }
    const modules = emptyModuleMap()
    for (const id of MODULE_IDS) {
      modules[id] = { ...grant }
    }
    return { admin: false, modules }
  }

  const admin = Boolean(data.admin)
  const modules = emptyModuleMap()
  const rawModules =
    data.modules && typeof data.modules === "object"
      ? (data.modules as Record<string, unknown>)
      : {}

  for (const id of MODULE_IDS) {
    const m = rawModules[id]
    if (m && typeof m === "object") {
      const row = m as Record<string, unknown>
      modules[id] = {
        add: Boolean(row.add),
        edit: Boolean(row.edit),
        delete: Boolean(row.delete),
      }
    }
  }

  if (admin) {
    return { admin: true, modules: fullModuleMap() }
  }

  return { admin: false, modules }
}

export function effectivePermissions(
  permissions: EmployeePermissions
): EmployeePermissions {
  const normalized = normalizePermissions(permissions)
  if (normalized.admin) return { admin: true, modules: fullModuleMap() }
  return normalized
}

export function getModulePermission(
  permissions: EmployeePermissions,
  moduleId: ModuleId
): ModulePermission {
  const effective = effectivePermissions(permissions)
  return effective.modules[moduleId] ?? { ...EMPTY_MODULE_PERMISSION }
}

export function permissionSummary(permissions: EmployeePermissions): string {
  const effective = effectivePermissions(permissions)
  if (effective.admin) return "Admin"
  const granted = MODULE_IDS.filter((id) => {
    const m = effective.modules[id]
    return m.add || m.edit || m.delete
  })
  if (granted.length === 0) return "No access"
  if (granted.length === MODULE_IDS.length) return "All modules"
  if (granted.length <= 2) {
    return granted.map((id) => MODULE_LABELS[id]).join(", ")
  }
  return `${granted.length} modules`
}

export function canView(permissions: EmployeePermissions): boolean {
  const effective = effectivePermissions(permissions)
  if (effective.admin) return true
  return MODULE_IDS.some((id) => {
    const m = effective.modules[id]
    return m.add || m.edit || m.delete
  })
}

export function canEdit(permissions: EmployeePermissions): boolean {
  const effective = effectivePermissions(permissions)
  if (effective.admin) return true
  return MODULE_IDS.some((id) => effective.modules[id].add || effective.modules[id].edit)
}

export function canDelete(permissions: EmployeePermissions): boolean {
  const effective = effectivePermissions(permissions)
  if (effective.admin) return true
  return MODULE_IDS.some((id) => effective.modules[id].delete)
}

export function canAdmin(permissions: EmployeePermissions): boolean {
  return effectivePermissions(permissions).admin
}

export function canModule(
  permissions: EmployeePermissions,
  moduleId: ModuleId,
  action: keyof ModulePermission
): boolean {
  return getModulePermission(permissions, moduleId)[action]
}

export function setModuleAction(
  permissions: EmployeePermissions,
  moduleId: ModuleId,
  action: keyof ModulePermission,
  value: boolean
): EmployeePermissions {
  const next = normalizePermissions(permissions)
  if (next.admin) return next
  return {
    admin: false,
    modules: {
      ...next.modules,
      [moduleId]: {
        ...next.modules[moduleId],
        [action]: value,
      },
    },
  }
}

export function setModuleAll(
  permissions: EmployeePermissions,
  moduleId: ModuleId,
  value: boolean
): EmployeePermissions {
  const next = normalizePermissions(permissions)
  if (next.admin) return next
  const row = value ? { ...FULL_MODULE_PERMISSION } : { ...EMPTY_MODULE_PERMISSION }
  return {
    admin: false,
    modules: {
      ...next.modules,
      [moduleId]: row,
    },
  }
}

export function setActionAll(
  permissions: EmployeePermissions,
  action: keyof ModulePermission,
  value: boolean
): EmployeePermissions {
  const next = normalizePermissions(permissions)
  if (next.admin) return next
  const modules = { ...next.modules }
  for (const id of MODULE_IDS) {
    modules[id] = { ...modules[id], [action]: value }
  }
  return { admin: false, modules }
}

export function setAllPermissions(
  permissions: EmployeePermissions,
  value: boolean
): EmployeePermissions {
  if (value) return { admin: false, modules: fullModuleMap() }
  return { admin: false, modules: emptyModuleMap() }
}

export function isActionFullySelected(
  permissions: EmployeePermissions,
  action: keyof ModulePermission
): boolean {
  const effective = effectivePermissions(permissions)
  if (effective.admin) return true
  return MODULE_IDS.every((id) => effective.modules[id][action])
}

export function isModuleFullySelected(
  permissions: EmployeePermissions,
  moduleId: ModuleId
): boolean {
  const m = getModulePermission(permissions, moduleId)
  return m.add && m.edit && m.delete
}

export const PERMISSION_PRESET_IDS = [
  "none",
  "viewer",
  "contributor",
  "manager",
  "admin",
] as const

export type PermissionPresetId = (typeof PERMISSION_PRESET_IDS)[number]

export const PERMISSION_PRESET_LABELS: Record<PermissionPresetId, string> = {
  none: "No access",
  viewer: "View only",
  contributor: "Contributor",
  manager: "Manager",
  admin: "Admin",
}

export const PERMISSION_PRESET_DESCRIPTIONS: Record<PermissionPresetId, string> = {
  none: "Cannot access any modules.",
  viewer: "Can view and edit existing records, but not add or delete.",
  contributor: "Can add and edit records across all modules.",
  manager: "Full add, edit, and delete access on all modules.",
  admin: "Unrestricted access to everything, including settings.",
}

function moduleMapWith(
  row: ModulePermission,
  moduleIds: readonly ModuleId[] = MODULE_IDS
): Record<ModuleId, ModulePermission> {
  const modules = emptyModuleMap()
  for (const id of moduleIds) {
    modules[id] = { ...row }
  }
  return modules
}

export function permissionPreset(id: PermissionPresetId): EmployeePermissions {
  switch (id) {
    case "none":
      return { admin: false, modules: emptyModuleMap() }
    case "viewer":
      return {
        admin: false,
        modules: moduleMapWith({ add: false, edit: true, delete: false }),
      }
    case "contributor":
      return {
        admin: false,
        modules: moduleMapWith({ add: true, edit: true, delete: false }),
      }
    case "manager":
      return { admin: false, modules: fullModuleMap() }
    case "admin":
      return { admin: true, modules: fullModuleMap() }
  }
}

export function permissionsEqual(
  a: EmployeePermissions,
  b: EmployeePermissions
): boolean {
  const left = normalizePermissions(a)
  const right = normalizePermissions(b)
  if (left.admin !== right.admin) return false
  return MODULE_IDS.every((id) => {
    const lm = left.modules[id]
    const rm = right.modules[id]
    return lm.add === rm.add && lm.edit === rm.edit && lm.delete === rm.delete
  })
}

export function countGrantedModules(permissions: EmployeePermissions): number {
  const effective = effectivePermissions(permissions)
  if (effective.admin) return MODULE_IDS.length
  return MODULE_IDS.filter((id) => {
    const m = effective.modules[id]
    return m.add || m.edit || m.delete
  }).length
}
