"use client"

import { useRouter } from "next/navigation"
import type { FormEvent } from "react"
import Link from "next/link"
import { toast } from "sonner"

import { EmployeeForm } from "@/components/employees/employee-form"
import { Button } from "@/components/ui/button"
import { useEmployees } from "@/context/employees-context"
import { EMPTY_EMPLOYEE, employeeFromFormData, type EmployeeRow } from "@/lib/employees"

export function EmployeeFormPage({
  mode,
  employee,
}: {
  mode: "add" | "edit"
  employee?: EmployeeRow
}) {
  const router = useRouter()
  const { addEmployee, updateEmployee } = useEmployees()
  const formId = mode === "add" ? "employee-add-form" : `employee-edit-${employee?.id}`
  const formEmployee = mode === "add" ? EMPTY_EMPLOYEE : employee ?? EMPTY_EMPLOYEE

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get("name") ?? "").trim()
    if (!name) {
      toast.error("Employee name is required.")
      return
    }

    const portalEnabled = fd.get("portalEnabled") === "on"
    const portalEmail = String(fd.get("portalEmail") ?? "").trim()
    if (portalEnabled && !portalEmail) {
      toast.error("Login email is required when portal access is enabled.")
      return
    }

    if (mode === "add") {
      const portalPassword = String(fd.get("portalPassword") ?? "").trim()
      if (portalEnabled && !portalPassword) {
        toast.error("Set a password for portal login.")
        return
      }
      const created = addEmployee(employeeFromFormData(fd, 0))
      toast.success("Employee created.")
      router.push(`/employees/${created.id}`)
      return
    }

    if (employee) {
      updateEmployee(
        employee.id,
        employeeFromFormData(fd, employee.id, employee)
      )
      toast.success("Employee saved.")
      router.push(`/employees/${employee.id}`)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h3 className="text-lg font-semibold">
          {mode === "add" ? "Add new employee" : `Edit ${employee?.name}`}
        </h3>
        <p className="text-muted-foreground mt-1 text-sm">
          {mode === "add"
            ? "Create a team member profile, set salary, and optionally enable portal login."
            : "Update profile details, salary, portal credentials, and permissions."}
        </p>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
        <EmployeeForm formId={formId} employee={formEmployee} onSubmit={handleSubmit} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" form={formId}>
          {mode === "add" ? "Create employee" : "Save changes"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={mode === "edit" && employee ? `/employees/${employee.id}` : "/employees"}>
            Cancel
          </Link>
        </Button>
      </div>
    </div>
  )
}
