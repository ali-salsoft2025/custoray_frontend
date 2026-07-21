"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { IconPencil } from "@tabler/icons-react"
import { toast } from "sonner"

import { EmployeeDetail } from "@/components/employees/employee-detail"
import {
  EmployeeForm,
  type EmployeeFormHandle,
} from "@/components/employees/employee-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useAuth } from "@/context/auth-context"
import { useEmployees } from "@/context/employees-context"
import { useLeaves } from "@/context/employee-leaves-context"
import { usePayroll } from "@/context/employee-payroll-context"
import {
  formatMoney,
  payrollStatusClass,
  payrollStatusLabel,
} from "@/lib/employee-payroll"
import {
  leaveStatusClass,
  leaveStatusLabel,
  leaveTypeLabel,
} from "@/lib/employee-leaves"
import {
  employeeFromValues,
  type EmployeeFormValues,
} from "@/lib/employees"

export function EmployeeProfilePage({ employeeId }: { employeeId: number }) {
  const { canAdmin } = useAuth()
  const { getEmployee, updateEmployee } = useEmployees()
  const { getRecordsForEmployee: getPayroll } = usePayroll()
  const { getRecordsForEmployee: getLeaves } = useLeaves()
  const [editOpen, setEditOpen] = useState(false)
  const formRef = useRef<EmployeeFormHandle>(null)

  const employee = getEmployee(employeeId)
  if (!employee) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Employee not found.</p>
        <Button type="button" variant="outline" className="mt-4" asChild>
          <Link href="/employees">Back to team</Link>
        </Button>
      </div>
    )
  }

  const payroll = getPayroll(employeeId).slice(0, 3)
  const leaves = getLeaves(employeeId).slice(0, 3)

  const handleSubmit = (values: EmployeeFormValues) => {
    if (!canAdmin) return
    updateEmployee(
      employee.id,
      employeeFromValues(values, employee.id, employee)
    )
    toast.success("Employee saved.")
    setEditOpen(false)
  }

  return (
    <>
      <Sheet
        open={editOpen}
        onOpenChange={setEditOpen}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
        >
          <SheetHeader className="border-border/60 space-y-1 border-b px-6 py-5 text-left">
            <SheetTitle className="text-lg leading-tight">
              Edit employee
            </SheetTitle>
            <SheetDescription>
              {employee.name}
              <span className="text-muted-foreground">
                {" "}
                · {employee.department || "No department"}
              </span>
            </SheetDescription>
          </SheetHeader>
          <div
            key={`profile-edit-${employee.id}`}
            className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
          >
            <EmployeeForm
              ref={formRef}
              formId={`employee-profile-edit-${employee.id}`}
              mode="edit"
              employee={employee}
              onSubmit={handleSubmit}
            />
          </div>
          <SheetFooter className="border-border/60 gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end">
            <SheetClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </SheetClose>
            <Button
              type="button"
              onClick={() => formRef.current?.goNextOrSubmit()}
            >
              Save employee
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="font-semibold">Profile</h3>
              {canAdmin ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditOpen(true)}
                >
                  <IconPencil className="size-4" />
                  Edit
                </Button>
              ) : null}
            </div>
            <EmployeeDetail employee={employee} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href={`/employees/permissions?employee=${employeeId}`}>
                Manage permissions
              </Link>
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href="/employees/payroll">View payroll</Link>
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href="/employees/leaves">View leave</Link>
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Recent payroll</h3>
              <Link
                href="/employees/payroll"
                className="text-primary text-xs font-medium hover:underline"
              >
                See all
              </Link>
            </div>
            {payroll.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No payroll records yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {payroll.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/40 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{row.period}</p>
                      <p className="text-muted-foreground text-xs">
                        {formatMoney(row.netPay)} net
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={payrollStatusClass(row.status)}
                    >
                      {payrollStatusLabel(row.status)}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Recent leave</h3>
              <Link
                href="/employees/leaves"
                className="text-primary text-xs font-medium hover:underline"
              >
                See all
              </Link>
            </div>
            {leaves.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No leave requests yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {leaves.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/40 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{leaveTypeLabel(row.type)}</p>
                      <p className="text-muted-foreground text-xs">
                        {row.startDate} → {row.endDate} · {row.days} day(s)
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={leaveStatusClass(row.status)}
                    >
                      {leaveStatusLabel(row.status)}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
