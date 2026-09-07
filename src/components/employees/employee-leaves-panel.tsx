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
import { useTranslation } from "react-i18next"

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
  const { t } = useTranslation("employees")

  return (
    <form id={formId} className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor={`${formId}-employee`}>{t("leavesPage.employee")}</Label>
        <select
          id={`${formId}-employee`}
          name="employeeId"
          defaultValue={record.employeeId || ""}
          required
          className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs"
        >
          <option value="">{t("leavesPage.selectEmployee")}</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${formId}-type`}>{t("leavesPage.leaveType")}</Label>
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
          <Label htmlFor={`${formId}-start`}>{t("leavesPage.startDate")}</Label>
          <Input
            id={`${formId}-start`}
            name="startDate"
            type="date"
            defaultValue={record.startDate}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${formId}-end`}>{t("leavesPage.endDate")}</Label>
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
        <Label htmlFor={`${formId}-reason`}>{t("leavesPage.reason")}</Label>
        <Input
          id={`${formId}-reason`}
          name="reason"
          defaultValue={record.reason}
          placeholder={t("leavesPage.reasonPlaceholder")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${formId}-status`}>{t("columns.status")}</Label>
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
  const { t } = useTranslation("employees")
  const rows = [
    [t("leavesPage.employee"), employeeName],
    [t("leavesPage.leaveType"), leaveTypeLabel(record.type)],
    [t("leavesPage.startDate"), record.startDate],
    [t("leavesPage.endDate"), record.endDate],
    [t("leavesPage.duration"), t("leavesPage.daysCount", { count: record.days })],
    [t("leavesPage.reason"), record.reason || "—"],
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
  const { t } = useTranslation("employees")
  const { t: tc } = useTranslation("common")
  const { employees } = useEmployees()
  const { records, addRecord, updateRecord, removeRecord, setRecords } =
    useLeaves()
  const [sidebar, setSidebar] = useState<LeaveSidebarState>(null)

  const leaveTabs: DataTableTab[] = [
    { value: "all", label: tc("tabs.all") },
    { value: "pending", label: t("leavesPage.status.pending") },
    { value: "approved", label: t("leavesPage.status.approved") },
    { value: "rejected", label: t("leavesPage.status.rejected") },
  ]

  const employeeName = useCallback(
    (id: number) =>
      employees.find((employee) => employee.id === id)?.name ??
      t("leavesPage.employeeFallback", { id }),
    [employees, t]
  )

  const approve = useCallback(
    (record: LeaveRecord) => {
      updateRecord(record.id, { status: "approved" })
      toast.success(t("leavesPage.toastApproved"))
    },
    [updateRecord, t]
  )

  const reject = useCallback(
    (record: LeaveRecord) => {
      updateRecord(record.id, { status: "rejected" })
      toast.message(t("leavesPage.toastRejected"))
    },
    [updateRecord, t]
  )

  const handleDelete = useCallback(
    async (record: LeaveRecord) => {
      if (
        !(await confirmDeleteAction({
          itemName: t("leavesPage.leaveItemName", {
            name: employeeName(record.employeeId),
          }),
          entityLabel: t("entity.leaveRequest"),
        }))
      ) {
        return
      }
      removeRecord(record.id)
      if (sidebar?.mode !== "add" && sidebar?.record.id === record.id) {
        setSidebar(null)
      }
      toast.message(t("leavesPage.toastRemoved"))
    },
    [employeeName, removeRecord, sidebar, t]
  )

  const columns = useMemo<ColumnDef<LeaveRecord>[]>(
    () => [
      {
        id: "employee",
        accessorFn: (row) => employeeName(row.employeeId),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("leavesPage.employee")} />
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
          <DataTableColumnHeader column={column} title={t("leavesPage.type")} />
        ),
        cell: ({ row }) => leaveTypeLabel(row.original.type),
        meta: { dataTableFilter: false },
      },
      {
        id: "dates",
        header: t("leavesPage.dates"),
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
          <DataTableColumnHeader
            column={column}
            title={t("leavesPage.days")}
            align="center"
          />
        ),
        meta: { dataTableFilter: false, cellClassName: "text-center" },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("columns.status")} />
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
                <span className="sr-only">{t("leavesPage.actions")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() => setSidebar({ mode: "view", record: row.original })}
              >
                <IconEye />
                {tc("actions.view")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSidebar({ mode: "edit", record: row.original })}
              >
                <IconPencil />
                {tc("actions.edit")}
              </DropdownMenuItem>
              {row.original.status === "pending" ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => approve(row.original)}>
                    <IconCheck />
                    {tc("actions.approve")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => reject(row.original)}>
                    <IconX />
                    {t("leavesPage.reject")}
                  </DropdownMenuItem>
                </>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => handleDelete(row.original)}
              >
                <IconTrash />
                {tc("actions.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [approve, employeeName, handleDelete, reject, t, tc]
  )

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const fd = new FormData(event.currentTarget)
    const next = leaveFromFormData(
      fd,
      sidebar?.mode === "edit" ? sidebar.record.id : 0
    )
    if (!next.employeeId || !next.startDate || !next.endDate) {
      toast.error(t("leavesPage.toastRequired"))
      return
    }
    if (next.endDate < next.startDate) {
      toast.error(t("leavesPage.toastEndBeforeStart"))
      return
    }
    if (sidebar?.mode === "edit") {
      updateRecord(sidebar.record.id, next)
      toast.success(t("leavesPage.toastUpdated"))
    } else {
      addRecord(next)
      toast.success(t("leavesPage.toastAdded"))
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
                    ? t("leavesPage.newRequest")
                    : sidebar.mode === "edit"
                      ? t("leavesPage.editRequest")
                      : employeeName(sidebar.record.employeeId)}
                </SheetTitle>
                <SheetDescription>
                  {sidebar.mode === "view"
                    ? t("leavesPage.viewHint", {
                        type: leaveTypeLabel(sidebar.record.type),
                        count: sidebar.record.days,
                      })
                    : t("leavesPage.formHint")}
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
                          {t("leavesPage.reject")}
                        </Button>
                        <Button type="button" onClick={() => approve(sidebar.record)}>
                          {tc("actions.approve")}
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
                        {tc("actions.edit")}
                      </Button>
                    )}
                    <SheetClose asChild>
                      <Button type="button">{tc("actions.close")}</Button>
                    </SheetClose>
                  </>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Button type="button" variant="outline">
                        {tc("actions.cancel")}
                      </Button>
                    </SheetClose>
                    <Button type="submit" form={formId}>
                      {sidebar.mode === "add"
                        ? t("leavesPage.submitRequest")
                        : t("leavesPage.saveChanges")}
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
        addButtonLabel={t("leavesPage.newLeave")}
        searchPlaceholder={t("leavesPage.searchPlaceholder")}
        onAddClick={() => setSidebar({ mode: "add" })}
        onDataChange={setRecords}
        tabs={leaveTabs}
        defaultTab="all"
        tabFilter={(record, tab) => tab === "all" || record.status === tab}
        bulkActions={[
          {
            id: "delete",
            label: tc("actions.deleteSelected"),
            icon: <IconTrash className="size-4" />,
            variant: "destructive",
            onClick: async (selected) => {
              if (
                !(await confirmDeleteAction({
                  count: selected.length,
                  entityLabel: t("entity.leaveRequest"),
                }))
              ) {
                return
              }
              const ids = new Set(selected.map((record) => record.id))
              setRecords((previous) =>
                previous.filter((record) => !ids.has(record.id))
              )
              toast.message(
                t("leavesPage.toastRemovedCount", { count: selected.length })
              )
            },
          },
        ]}
      />
    </>
  )
}
