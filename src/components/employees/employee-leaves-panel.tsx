"use client"

import { useCallback, useMemo, useState, type FormEvent } from "react"
import { ColumnDef } from "@tanstack/react-table"
import {
  IconCheck,
  IconDotsVertical,
  IconEye,
  IconPencil,
  IconTrash,
  IconX,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { DataTableColumnHeader } from "@/components/data-table-column-header"
import { DataTable, type DataTableTab } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useEmployees } from "@/context/employees-context"
import { useLeaves } from "@/context/employee-leaves-context"
import { confirmDeleteAction } from "@/lib/confirm-action"
import {
  EMPTY_LEAVE,
  LEAVE_STATUSES,
  LEAVE_TYPES,
  leaveFromFormData,
  leaveStatusClass,
  leaveStatusLabel,
  leaveTypeLabel,
  type LeaveRecord,
} from "@/lib/employee-leaves"

const leaveTabs: DataTableTab[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
]

type LeaveSidebarState =
  | { mode: "add" }
  | { mode: "view"; record: LeaveRecord }
  | { mode: "edit"; record: LeaveRecord }
  | null

function LeaveForm({
  formId,
  record,
  employees,
  onSubmit,
}: {
  formId: string
  record: LeaveRecord
  employees: { id: number; name: string }[]
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <form id={formId} className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor={`${formId}-employee`}>Employee</Label>
        <select
          id={`${formId}-employee`}
          name="employeeId"
          defaultValue={record.employeeId || ""}
          required
          className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs"
        >
          <option value="">Select employee</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${formId}-type`}>Leave type</Label>
        <select
          id={`${formId}-type`}
          name="type"
          defaultValue={record.type}
          className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs"
        >
          {LEAVE_TYPES.map((type) => (
            <option key={type} value={type}>
              {leaveTypeLabel(type)}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`${formId}-start`}>Start date</Label>
          <Input
            id={`${formId}-start`}
            name="startDate"
            type="date"
            defaultValue={record.startDate}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${formId}-end`}>End date</Label>
          <Input
            id={`${formId}-end`}
            name="endDate"
            type="date"
            defaultValue={record.endDate}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${formId}-reason`}>Reason</Label>
        <Input
          id={`${formId}-reason`}
          name="reason"
          defaultValue={record.reason}
          placeholder="Brief reason"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${formId}-status`}>Status</Label>
        <select
          id={`${formId}-status`}
          name="status"
          defaultValue={record.status}
          className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs"
        >
          {LEAVE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {leaveStatusLabel(status)}
            </option>
          ))}
        </select>
      </div>
    </form>
  )
}

function LeaveDetail({
  record,
  employeeName,
}: {
  record: LeaveRecord
  employeeName: string
}) {
  const rows = [
    ["Employee", employeeName],
    ["Leave type", leaveTypeLabel(record.type)],
    ["Start date", record.startDate],
    ["End date", record.endDate],
    ["Duration", `${record.days} day${record.days === 1 ? "" : "s"}`],
    ["Reason", record.reason || "—"],
  ]
  return (
    <div className="space-y-4">
      <Badge variant="outline" className={leaveStatusClass(record.status)}>
        {leaveStatusLabel(record.status)}
      </Badge>
      <dl className="space-y-3">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[7rem_1fr] gap-3 text-sm">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function EmployeeLeavesPanel() {
  const { employees } = useEmployees()
  const { records, addRecord, updateRecord, removeRecord, setRecords } =
    useLeaves()
  const [sidebar, setSidebar] = useState<LeaveSidebarState>(null)

  const employeeName = useCallback(
    (id: number) =>
      employees.find((employee) => employee.id === id)?.name ??
      `Employee #${id}`,
    [employees]
  )

  const approve = useCallback(
    (record: LeaveRecord) => {
      updateRecord(record.id, { status: "approved" })
      toast.success("Leave approved.")
    },
    [updateRecord]
  )

  const reject = useCallback(
    (record: LeaveRecord) => {
      updateRecord(record.id, { status: "rejected" })
      toast.message("Leave rejected.")
    },
    [updateRecord]
  )

  const handleDelete = useCallback(
    async (record: LeaveRecord) => {
      if (
        !(await confirmDeleteAction({
          itemName: `${employeeName(record.employeeId)} leave`,
          entityLabel: "leave request",
        }))
      ) {
        return
      }
      removeRecord(record.id)
      if (sidebar?.mode !== "add" && sidebar?.record.id === record.id) {
        setSidebar(null)
      }
      toast.message("Leave request removed.")
    },
    [employeeName, removeRecord, sidebar]
  )

  const columns = useMemo<ColumnDef<LeaveRecord>[]>(
    () => [
      {
        id: "employee",
        accessorFn: (row) => employeeName(row.employeeId),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Employee" />
        ),
        cell: ({ row }) => (
          <button
            type="button"
            className="font-medium hover:underline"
            onClick={() => setSidebar({ mode: "view", record: row.original })}
          >
            {employeeName(row.original.employeeId)}
          </button>
        ),
        meta: { dataTableFilter: false },
      },
      {
        accessorKey: "type",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Type" />
        ),
        cell: ({ row }) => leaveTypeLabel(row.original.type),
        meta: { dataTableFilter: false },
      },
      {
        id: "dates",
        header: "Dates",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">
            {row.original.startDate} → {row.original.endDate}
          </span>
        ),
        meta: { dataTableFilter: false },
      },
      {
        accessorKey: "days",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Days" align="center" />
        ),
        meta: { dataTableFilter: false, cellClassName: "text-center" },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={leaveStatusClass(row.original.status)}
          >
            {leaveStatusLabel(row.original.status)}
          </Badge>
        ),
        meta: { dataTableFilter: false },
      },
      {
        id: "actions",
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="size-8">
                <IconDotsVertical />
                <span className="sr-only">Leave actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() => setSidebar({ mode: "view", record: row.original })}
              >
                <IconEye />
                View
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSidebar({ mode: "edit", record: row.original })}
              >
                <IconPencil />
                Edit
              </DropdownMenuItem>
              {row.original.status === "pending" ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => approve(row.original)}>
                    <IconCheck />
                    Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => reject(row.original)}>
                    <IconX />
                    Reject
                  </DropdownMenuItem>
                </>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => handleDelete(row.original)}
              >
                <IconTrash />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [approve, employeeName, handleDelete, reject]
  )

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const fd = new FormData(event.currentTarget)
    const next = leaveFromFormData(
      fd,
      sidebar?.mode === "edit" ? sidebar.record.id : 0
    )
    if (!next.employeeId || !next.startDate || !next.endDate) {
      toast.error("Employee and leave dates are required.")
      return
    }
    if (next.endDate < next.startDate) {
      toast.error("End date cannot be before start date.")
      return
    }
    if (sidebar?.mode === "edit") {
      updateRecord(sidebar.record.id, next)
      toast.success("Leave request updated.")
    } else {
      addRecord(next)
      toast.success("Leave request added.")
    }
    setSidebar(null)
  }

  const sheetRecord =
    sidebar?.mode === "view" || sidebar?.mode === "edit"
      ? sidebar.record
      : null
  const formRecord =
    sidebar?.mode === "add" ? EMPTY_LEAVE : sheetRecord ?? EMPTY_LEAVE
  const formId =
    sidebar?.mode === "edit"
      ? `leave-edit-${sidebar.record.id}`
      : "leave-add"

  return (
    <>
      <Sheet
        open={sidebar !== null}
        onOpenChange={(open) => !open && setSidebar(null)}
      >
        <SheetContent
          side="right"
          className={`flex w-full flex-col gap-0 overflow-hidden p-0 ${
            sidebar?.mode === "view" ? "sm:max-w-lg" : "sm:max-w-md"
          }`}
        >
          {sidebar ? (
            <>
              <SheetHeader className="border-b px-6 py-5 text-left">
                <SheetTitle>
                  {sidebar.mode === "add"
                    ? "New leave request"
                    : sidebar.mode === "edit"
                      ? "Edit leave request"
                      : employeeName(sidebar.record.employeeId)}
                </SheetTitle>
                <SheetDescription>
                  {sidebar.mode === "view"
                    ? `${leaveTypeLabel(sidebar.record.type)} · ${sidebar.record.days} day${sidebar.record.days === 1 ? "" : "s"}`
                    : "Enter leave dates, reason, and approval status."}
                </SheetDescription>
              </SheetHeader>
              <div
                key={
                  sidebar.mode === "add"
                    ? "leave-add"
                    : `${sidebar.record.id}-${sidebar.mode}`
                }
                className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
              >
                {sidebar.mode === "view" ? (
                  <LeaveDetail
                    record={sidebar.record}
                    employeeName={employeeName(sidebar.record.employeeId)}
                  />
                ) : (
                  <LeaveForm
                    formId={formId}
                    record={formRecord}
                    employees={employees}
                    onSubmit={handleSubmit}
                  />
                )}
              </div>
              <SheetFooter className="border-t px-6 py-4">
                {sidebar.mode === "view" ? (
                  <>
                    {sidebar.record.status === "pending" ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => reject(sidebar.record)}
                        >
                          Reject
                        </Button>
                        <Button type="button" onClick={() => approve(sidebar.record)}>
                          Approve
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setSidebar({ mode: "edit", record: sidebar.record })
                        }
                      >
                        Edit
                      </Button>
                    )}
                    <SheetClose asChild>
                      <Button type="button">Close</Button>
                    </SheetClose>
                  </>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </SheetClose>
                    <Button type="submit" form={formId}>
                      {sidebar.mode === "add" ? "Submit request" : "Save changes"}
                    </Button>
                  </>
                )}
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <DataTable
        data={records}
        columns={columns}
        addButtonLabel="New Leave"
        searchPlaceholder="Search leave..."
        onAddClick={() => setSidebar({ mode: "add" })}
        onDataChange={setRecords}
        tabs={leaveTabs}
        defaultTab="all"
        tabFilter={(record, tab) => tab === "all" || record.status === tab}
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
              const ids = new Set(selected.map((record) => record.id))
              setRecords((previous) =>
                previous.filter((record) => !ids.has(record.id))
              )
              toast.message(`Removed ${selected.length} leave request(s).`)
            },
          },
        ]}
      />
    </>
  )
}
