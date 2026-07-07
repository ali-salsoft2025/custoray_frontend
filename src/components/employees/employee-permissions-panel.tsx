"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { IconExternalLink } from "@tabler/icons-react"
import { toast } from "sonner"

import { CustomerAvatar } from "@/components/customers/customer-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useEmployees } from "@/context/employees-context"
import {
  FULL_PERMISSIONS,
  permissionSummary,
  type EmployeePermissions,
} from "@/lib/employee-permissions"
import { statusBadgeClass, statusLabel } from "@/lib/employees"

function PermissionToggle({
  id,
  label,
  checked,
  disabled,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onChange(value === true)}
      />
      <Label htmlFor={id} className="text-xs font-normal">
        {label}
      </Label>
    </div>
  )
}

export function EmployeePermissionsPanel() {
  const searchParams = useSearchParams()
  const highlightId = Number(searchParams.get("employee"))
  const { employees, updateEmployee } = useEmployees()

  const updatePermissions = (
    employeeId: number,
    patch: Partial<EmployeePermissions>
  ) => {
    const employee = employees.find((e) => e.id === employeeId)
    if (!employee) return
    const next = { ...employee.permissions, ...patch }
    if (next.admin) {
      updateEmployee(employeeId, { permissions: FULL_PERMISSIONS })
    } else {
      updateEmployee(employeeId, { permissions: next })
    }
    toast.success("Permissions updated.")
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Portal permissions</h3>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          Control what each employee can do after signing in. Admin includes all
          access plus employee management.
        </p>
      </div>

      <div className="space-y-3">
        {employees.map((employee) => {
          const p = employee.permissions
          const highlighted = highlightId === employee.id
          return (
            <div
              key={employee.id}
              className={`rounded-xl border bg-card p-4 shadow-sm ${
                highlighted ? "ring-2 ring-primary/40" : "border-border/60"
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <CustomerAvatar name={employee.name} size="md" />
                  <div>
                    <p className="font-semibold">{employee.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {employee.designation} · {employee.department}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={statusBadgeClass(employee.status)}>
                        {statusLabel(employee.status)}
                      </Badge>
                      <Badge variant="outline">
                        {employee.portalEnabled ? "Portal on" : "Portal off"}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {permissionSummary(p)}
                      </span>
                    </div>
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link href={`/employees/${employee.id}/edit`}>
                    <IconExternalLink className="size-4" />
                    Edit profile
                  </Link>
                </Button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/40 pt-4 sm:grid-cols-4">
                <PermissionToggle
                  id={`admin-${employee.id}`}
                  label="Admin"
                  checked={p.admin}
                  onChange={(checked) =>
                    updatePermissions(employee.id, {
                      admin: checked,
                      view: checked || p.view,
                      edit: checked || p.edit,
                      delete: checked || p.delete,
                    })
                  }
                />
                <PermissionToggle
                  id={`view-${employee.id}`}
                  label="View"
                  checked={p.view || p.admin}
                  disabled={p.admin}
                  onChange={(checked) => updatePermissions(employee.id, { view: checked })}
                />
                <PermissionToggle
                  id={`edit-${employee.id}`}
                  label="Edit"
                  checked={p.edit || p.admin}
                  disabled={p.admin}
                  onChange={(checked) => updatePermissions(employee.id, { edit: checked })}
                />
                <PermissionToggle
                  id={`delete-${employee.id}`}
                  label="Delete"
                  checked={p.delete || p.admin}
                  disabled={p.admin}
                  onChange={(checked) => updatePermissions(employee.id, { delete: checked })}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
