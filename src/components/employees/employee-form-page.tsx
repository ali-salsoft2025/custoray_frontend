"use client"

import { useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import {
  EmployeeForm,
  type EmployeeFormHandle,
} from "@/components/employees/employee-form"
import { Button } from "@/components/ui/button"
import { useEmployees } from "@/context/employees-context"
import {
  EMPTY_EMPLOYEE,
  employeeFromValues,
  type EmployeeFormValues,
  type EmployeeRow,
} from "@/lib/employees"

export function EmployeeFormPage({
  mode,
  employee,
}: {
  mode: "add" | "edit"
  employee?: EmployeeRow
}) {
  const router = useRouter()
  const formRef = useRef<EmployeeFormHandle>(null)
  const { addEmployee, updateEmployee } = useEmployees()
  const { t } = useTranslation("employees")
  const { t: tc } = useTranslation("common")
  const formId =
    mode === "add" ? "employee-add-form" : `employee-edit-${employee?.id}`
  const formEmployee = mode === "add" ? EMPTY_EMPLOYEE : employee ?? EMPTY_EMPLOYEE

  const handleSubmit = (values: EmployeeFormValues) => {
    if (mode === "add") {
      const created = addEmployee(employeeFromValues(values, 0))
      toast.success(t("list.toastCreated"))
      router.push(`/employees/${created.id}`)
      return
    }

    if (employee) {
      updateEmployee(
        employee.id,
        employeeFromValues(values, employee.id, employee)
      )
      toast.success(t("list.toastSaved"))
      router.push(`/employees/${employee.id}`)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h3 className="text-lg font-semibold">
          {mode === "add" ? t("profilePage.addTitle") : t("edit")}
        </h3>
        <p className="text-muted-foreground mt-1 text-sm">
          {mode === "add" ? t("profilePage.addHint") : t("profilePage.editHint")}
        </p>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
        <EmployeeForm
          ref={formRef}
          formId={formId}
          mode={mode}
          employee={formEmployee}
          onSubmit={handleSubmit}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => formRef.current?.goNextOrSubmit()}>
          {mode === "add" ? t("list.createEmployee") : t("payrollPage.saveChanges")}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link
            href={
              mode === "edit" && employee
                ? `/employees/${employee.id}`
                : "/employees"
            }
          >
            {tc("actions.cancel")}
          </Link>
        </Button>
      </div>
    </div>
  )
}
