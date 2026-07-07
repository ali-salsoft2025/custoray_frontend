import { z } from "zod"

export const employeePermissionsSchema = z.object({
  view: z.boolean(),
  edit: z.boolean(),
  delete: z.boolean(),
  admin: z.boolean(),
})

export type EmployeePermissions = z.infer<typeof employeePermissionsSchema>

export const FULL_PERMISSIONS: EmployeePermissions = {
  view: true,
  edit: true,
  delete: true,
  admin: true,
}

export const NO_PERMISSIONS: EmployeePermissions = {
  view: false,
  edit: false,
  delete: false,
  admin: false,
}

export function effectivePermissions(
  permissions: EmployeePermissions
): EmployeePermissions {
  if (permissions.admin) return FULL_PERMISSIONS
  return permissions
}

export function permissionSummary(permissions: EmployeePermissions): string {
  const effective = effectivePermissions(permissions)
  if (effective.admin) return "Admin"
  const parts: string[] = []
  if (effective.view) parts.push("View")
  if (effective.edit) parts.push("Edit")
  if (effective.delete) parts.push("Delete")
  return parts.length > 0 ? parts.join(", ") : "No access"
}

export function canView(permissions: EmployeePermissions): boolean {
  return effectivePermissions(permissions).view
}

export function canEdit(permissions: EmployeePermissions): boolean {
  return effectivePermissions(permissions).edit
}

export function canDelete(permissions: EmployeePermissions): boolean {
  return effectivePermissions(permissions).delete
}

export function canAdmin(permissions: EmployeePermissions): boolean {
  return effectivePermissions(permissions).admin
}

export function parsePermissionsFromFormData(
  fd: FormData
): EmployeePermissions {
  const admin = fd.get("perm_admin") === "on"
  if (admin) return FULL_PERMISSIONS
  return {
    view: fd.get("perm_view") === "on",
    edit: fd.get("perm_edit") === "on",
    delete: fd.get("perm_delete") === "on",
    admin: false,
  }
}
