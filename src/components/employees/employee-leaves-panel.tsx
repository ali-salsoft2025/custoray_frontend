"use client"

import { useCallback, useMemo, useState, type FormEvent } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { IconTrash } from "@tabler/icons-react"
import { toast } from "sonner"

import { DataTableColumnHeader } from "@/components/data-table-column-header"
import { DataTable } from "@/components/data-table"
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
import { useLeaves } from "@/context/employee-leaves-context"
import { confirmDeleteAction } from "@/lib/confirm-action"
import {
  LEAVE_TYPES,
  leaveFromFormData,
  leaveStatusClass,
  leaveStatusLabel,
  leaveTypeLabel,
  type LeaveRecord,
} from "@/lib/employee-leaves"

export function EmployeeLeavesPanel() {
  const { employees } = useEmployees()
  const { records, addRecord, updateRecord, setRecords } = useLeaves()
  const [open, setOpen] = useState(false)

  const employeeName = useCallback(
    (id: number) => employees.find((e) => e.id === id)?.name ?? `Employee #${id}`,
    [employees]
  )

  const columns = useMemo<ColumnDef<LeaveRecord>[]>(
    () => [
      {
        id: "employee",
        accessorFn: (row) => employeeName(row.employeeId),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Employee" />
        ),
      },
      {
        accessorKey: "type",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Type" />
        ),
        cell: ({ row }) => leaveTypeLabel(row.original.type),
      },
      {
        id: "dates",
        header: "Dates",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">
            {row.original.startDate} → {row.original.endDate}
          </span>
        ),
      },
      {
        accessorKey: "days",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Days" align="center" />
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => (
          <Badge variant="outline" className={leaveStatusClass(row.original.status)}>
            {leaveStatusLabel(row.original.status)}
          </Badge>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) =>
          row.original.status === "pending" ? (
            <div className="flex gap-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  updateRecord(row.original.id, { status: "approved" })
                  toast.success("Leave approved.")
                }}
              >
                Approve
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  updateRecord(row.original.id, { status: "rejected" })
                  toast.message("Leave rejected.")
                }}
              >
                Reject
              </Button>
            </div>
          ) : null,
      },
    ],
    [employeeName, updateRecord]
  )

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    addRecord(leaveFromFormData(fd, 0))
    toast.success("Leave request added.")
    setOpen(false)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Request leave</SheetTitle>
          </SheetHeader>
          <form id="leave-add-form" className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="leave-employee">Employee</Label>
              <select
                id="leave-employee"
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
              <Label htmlFor="leave-type">Leave type</Label>
              <select
                id="leave-type"
                name="type"
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              >
                {LEAVE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {leaveTypeLabel(t)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="leave-start">Start date</Label>
                <Input id="leave-start" name="startDate" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leave-end">End date</Label>
                <Input id="leave-end" name="endDate" type="date" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="leave-reason">Reason</Label>
              <Input id="leave-reason" name="reason" placeholder="Brief reason" />
            </div>
            <input type="hidden" name="status" value="pending" />
          </form>
          <SheetFooter className="mt-4">
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
            <Button type="submit" form="leave-add-form">
              Submit request
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <DataTable
        data={records}
        columns={columns}
        addButtonLabel="New Leave"
        searchPlaceholder="Search leave..."
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
                  entityLabel: "leave request",
                }))
              ) {
                return
              }
              const ids = new Set(selected.map((r) => r.id))
              setRecords((prev) => prev.filter((r) => !ids.has(r.id)))
              toast.message(`Removed ${selected.length} request(s).`)
            },
          },
        ]}
      />
    </>
  )
}
