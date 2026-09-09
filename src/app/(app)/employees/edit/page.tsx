"use client"

import { usePathname } from "next/navigation"

import { EmployeeFormPage } from "@/components/employees/employee-form-page"
import { useEmployees } from "@/context/employees-context"
import { pathMatch } from "@/lib/route-ids"

export default function EditEmployeePage() {
  const pathname = usePathname()
  const id = pathMatch(pathname, /^\/employees\/(\d+)\/edit$/)
  const { getEmployee } = useEmployees()
  const employee = getEmployee(Number(id))

  if (!employee) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">Employee not found.</p>
    )
  }

  return <EmployeeFormPage mode="edit" employee={employee} />
}
