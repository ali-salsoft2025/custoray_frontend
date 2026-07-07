"use client"

import { useCallback, useMemo, useState, type FormEvent } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { IconTrash } from "@tabler/icons-react"
import { toast } from "sonner"

import { DataTableColumnHeader } from "@/components/data-table-column-header"
import { DataTable } from "@/components/data-table"
import { StatCard, StatCardsGrid } from "@/components/stat-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useEmployees } from "@/context/employees-context"
import { usePayroll } from "@/context/employee-payroll-context"
import { confirmDeleteAction } from "@/lib/confirm-action"
import {
  PAYROLL_STATUSES,
  formatMoney,
  payrollFromFormData,
  payrollStatusClass,
  payrollStatusLabel,
  type PayrollRecord,
} from "@/lib/employee-payroll"

export function EmployeePayrollPanel() {
  const { employees } = useEmployees()
  const { records, addRecord, setRecords } = usePayroll()
  const [open, setOpen] = useState(false)

  const employeeName = useCallback(
    (id: number) => employees.find((e) => e.id === id)?.name ?? `Employee #${id}`,
    [employees]
  )

  const stats = useMemo(() => {
    const paid = records.filter((r) => r.status === "paid")
    const pending = records.filter((r) => r.status === "pending")
    const totalPaid = paid.reduce((sum, r) => sum + (Number(r.netPay) || 0), 0)
    return { paidCount: paid.length, pendingCount: pending.length, totalPaid }
  }, [records])

  const columns = useMemo<ColumnDef<PayrollRecord>[]>(
    () => [
      {
        accessorKey: "period",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Period" />
        ),
      },
      {
        id: "employee",
        accessorFn: (row) => employeeName(row.employeeId),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Employee" />
        ),
      },
      {
        accessorKey: "baseSalary",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Base" align="center" />
        ),
        cell: ({ row }) => formatMoney(row.original.baseSalary),
      },
      {
        accessorKey: "netPay",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Net pay" align="center" />
        ),
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">{formatMoney(row.original.netPay)}</span>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => (
          <Badge variant="outline" className={payrollStatusClass(row.original.status)}>
            {payrollStatusLabel(row.original.status)}
          </Badge>
        ),
      },
    ],
    [employeeName]
  )

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    addRecord(payrollFromFormData(fd, 0))
    toast.success("Payroll record added.")
    setOpen(false)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add payroll record</SheetTitle>
          </SheetHeader>
          <form id="payroll-add-form" className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="payroll-employee">Employee</Label>
              <select
                id="payroll-employee"
                name="employeeId"
                required
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              >
                <option value="">Select employee</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payroll-period">Period (YYYY-MM)</Label>
              <Input id="payroll-period" name="period" type="month" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="payroll-base">Base salary</Label>
                <Input id="payroll-base" name="baseSalary" defaultValue="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payroll-bonus">Bonuses</Label>
                <Input id="payroll-bonus" name="bonuses" defaultValue="0" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payroll-deduct">Deductions</Label>
              <Input id="payroll-deduct" name="deductions" defaultValue="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payroll-status">Status</Label>
              <select
                id="payroll-status"
                name="status"
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              >
                {PAYROLL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {payrollStatusLabel(s)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payroll-notes">Notes</Label>
              <Input id="payroll-notes" name="notes" placeholder="Optional" />
            </div>
          </form>
          <SheetFooter className="mt-4">
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
            <Button type="submit" form="payroll-add-form">
              Save record
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <StatCardsGrid className="mb-5">
        <StatCard label="Records" value={String(records.length)} hint="All payroll runs" />
        <StatCard label="Pending" value={String(stats.pendingCount)} hint="Awaiting payment" />
        <StatCard label="Paid runs" value={String(stats.paidCount)} hint="Completed" />
        <StatCard
          label="Total paid"
          value={formatMoney(stats.totalPaid.toFixed(2))}
          hint="Net pay sum"
        />
      </StatCardsGrid>

      <DataTable
        data={records}
        columns={columns}
        addButtonLabel="Add payroll"
        searchPlaceholder="Search payroll..."
        onAddClick={() => setOpen(true)}
        onDataChange={setRecords}
        bulkActions={[
          {
            id: "delete",
            label: "Delete selected",
            icon: <IconTrash className="size-4" />,
            variant: "destructive",
            onClick: async (selected) => {
              if (
                !(await confirmDeleteAction({
                  count: selected.length,
                  entityLabel: "payroll record",
                }))
              ) {
                return
              }
              const ids = new Set(selected.map((r) => r.id))
              setRecords((prev) => prev.filter((r) => !ids.has(r.id)))
              toast.message(`Removed ${selected.length} record(s).`)
            },
          },
        ]}
      />
    </>
  )
}
