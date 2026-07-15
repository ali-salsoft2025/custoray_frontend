"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { IconExternalLink } from "@tabler/icons-react"
import { toast } from "sonner"

import { EmployeePermissionsMatrix } from "@/components/employees/employee-permissions-matrix"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useEmployees } from "@/context/employees-context"
import {
  normalizePermissions,
  permissionSummary,
  type EmployeePermissions,
} from "@/lib/employee-permissions"
import { statusBadgeClass, statusLabel } from "@/lib/employees"

export function EmployeePermissionsPanel() {
  const searchParams = useSearchParams()
  const highlightId = Number(searchParams.get("employee"))
  const { employees, updateEmployee } = useEmployees()

  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    if (employees.length === 0) {
      setSelectedId(null)
      return
    }
    if (
      Number.isFinite(highlightId) &&
      employees.some((e) => e.id === highlightId)
    ) {
      setSelectedId(highlightId)
      return
    }
    setSelectedId((prev) =>
      prev != null && employees.some((e) => e.id === prev)
        ? prev
        : employees[0].id
    )
  }, [employees, highlightId])

  const selected = useMemo(
    () => employees.find((e) => e.id === selectedId) ?? null,
    [employees, selectedId]
  )

  const savePermissions = (permissions: EmployeePermissions) => {
    if (!selected) return
    updateEmployee(selected.id, {
      permissions: normalizePermissions(permissions),
    })
    toast.success("Permissions updated.")
  }

  if (!selected) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No employees yet. Add a team member first.
      </p>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Label htmlFor="perm-employee">Employee</Label>
          <select
            id="perm-employee"
            value={selected.id}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            className="border-input bg-background h-9 min-w-[16rem] rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          >
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href={`/employees/${selected.id}`}>
            <IconExternalLink className="size-4" />
            View profile
          </Link>
        </Button>
      </div>

      <div className="rounded-md border border-border/60 bg-card p-4">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <p className="font-semibold">{selected.name}</p>
          <Badge variant="outline" className={statusBadgeClass(selected.status)}>
            {statusLabel(selected.status)}
          </Badge>
          <Badge variant="outline">
            {selected.portalEnabled ? "Portal on" : "Portal off"}
          </Badge>
          <span className="text-muted-foreground text-xs">
            {permissionSummary(selected.permissions)}
          </span>
        </div>

        <EmployeePermissionsMatrix
          key={selected.id}
          value={normalizePermissions(selected.permissions)}
          onChange={savePermissions}
        />
      </div>
    </div>
  )
}
