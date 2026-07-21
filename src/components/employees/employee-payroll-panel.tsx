"use client"

import { useCallback, useMemo, useState, type FormEvent } from "react"
import { ColumnDef } from "@tanstack/react-table"
import {
  IconCalendarMonth,
  IconCheck,
  IconDotsVertical,
  IconEye,
  IconGift,
  IconPencil,
  IconPercentage,
  IconPlayerPlay,
  IconTrash,
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
import { usePayroll } from "@/context/employee-payroll-context"
import { confirmDeleteAction } from "@/lib/confirm-action"
import {
  EMPTY_PAYROLL,
  PAYROLL_STATUSES,
  computeNetPay,
  formatMoney,
  payrollFromFormData,
  payrollStatusClass,
  payrollStatusLabel,
  type PayrollRecord,
} from "@/lib/employee-payroll"
import type { EmployeeRow } from "@/lib/employees"

const payrollTabs: DataTableTab[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
]

type PayrollSidebarState =
  | { mode: "add" }
  | { mode: "view"; record: PayrollRecord }
  | { mode: "edit"; record: PayrollRecord }
  | null

function periodLabel(period: string) {
  const [year, month] = period.split("-").map(Number)
  if (!year || !month) return period
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)))
}

function PayrollForm({
  formId,
  record,
  employees,
  onSubmit,
}: {
  formId: string
  record: PayrollRecord
  employees: EmployeeRow[]
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const [employeeId, setEmployeeId] = useState(record.employeeId)
  const [baseSalary, setBaseSalary] = useState(record.baseSalary)
  const [bonuses, setBonuses] = useState(record.bonuses)
  const [commissions, setCommissions] = useState(record.commissions)
  const [deductions, setDeductions] = useState(record.deductions)
  const [status, setStatus] = useState(record.status)
  const netPay = computeNetPay(
    baseSalary,
    bonuses,
    deductions,
    commissions
  )

  return (
    <form id={formId} className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor={`${formId}-employee`}>Employee</Label>
        <select
          id={`${formId}-employee`}
          name="employeeId"
          required
          value={employeeId || ""}
          onChange={(event) => {
            const nextId = Number(event.target.value)
            setEmployeeId(nextId)
            const employee = employees.find((row) => row.id === nextId)
            if (employee) setBaseSalary(employee.baseSalary)
          }}
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
        <Label htmlFor={`${formId}-period`}>Payroll month</Label>
        <Input
          id={`${formId}-period`}
          name="period"
          type="month"
          defaultValue={record.period}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${formId}-base`}>Base salary</Label>
          <Input
            id={`${formId}-base`}
            name="baseSalary"
            inputMode="decimal"
            value={baseSalary}
            onChange={(event) => setBaseSalary(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${formId}-bonus`}>Bonuses</Label>
          <Input
            id={`${formId}-bonus`}
            name="bonuses"
            inputMode="decimal"
            value={bonuses}
            onChange={(event) => setBonuses(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${formId}-commissions`}>Commissions</Label>
        <Input
          id={`${formId}-commissions`}
          name="commissions"
          inputMode="decimal"
          value={commissions}
          onChange={(event) => setCommissions(event.target.value)}
          placeholder="0"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${formId}-deductions`}>Deductions</Label>
        <Input
          id={`${formId}-deductions`}
          name="deductions"
          inputMode="decimal"
          value={deductions}
          onChange={(event) => setDeductions(event.target.value)}
        />
      </div>

      <div className="bg-muted/40 rounded-lg px-4 py-3">
        <p className="text-muted-foreground text-xs">Calculated net pay</p>
        <p className="mt-1 text-xl font-semibold tabular-nums">
          {formatMoney(netPay)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${formId}-status`}>Status</Label>
          <select
            id={`${formId}-status`}
            name="status"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as PayrollRecord["status"])
            }
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs"
          >
            {PAYROLL_STATUSES.map((item) => (
              <option key={item} value={item}>
                {payrollStatusLabel(item)}
              </option>
            ))}
          </select>
        </div>
        {status === "paid" ? (
          <div className="space-y-2">
            <Label htmlFor={`${formId}-paid-date`}>Paid date</Label>
            <Input
              id={`${formId}-paid-date`}
              name="paidDate"
              type="date"
              defaultValue={
                record.paidDate || new Date().toISOString().slice(0, 10)
              }
              required
            />
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${formId}-notes`}>Notes</Label>
        <Input
          id={`${formId}-notes`}
          name="notes"
          defaultValue={record.notes}
          placeholder="Optional payroll note"
        />
      </div>
    </form>
  )
}

function PayrollDetail({
  record,
  employeeName,
}: {
  record: PayrollRecord
  employeeName: string
}) {
  const rows = [
    ["Employee", employeeName],
    ["Month", periodLabel(record.period)],
    ["Base salary", formatMoney(record.baseSalary)],
    ["Bonuses", formatMoney(record.bonuses)],
    ["Commissions", formatMoney(record.commissions)],
    ["Deductions", formatMoney(record.deductions)],
    ["Net pay", formatMoney(record.netPay)],
    ["Paid date", record.paidDate || "—"],
    ["Notes", record.notes || "—"],
  ]

  return (
    <div className="space-y-4">
      <Badge variant="outline" className={payrollStatusClass(record.status)}>
        {payrollStatusLabel(record.status)}
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

export function EmployeePayrollPanel() {
  const { employees } = useEmployees()
  const { records, addRecord, updateRecord, removeRecord, setRecords } =
    usePayroll()
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7))
  const [sidebar, setSidebar] = useState<PayrollSidebarState>(null)

  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.status === "active"),
    [employees]
  )
  const periodRecords = useMemo(
    () => records.filter((record) => record.period === period),
    [records, period]
  )

  const employeeName = useCallback(
    (id: number) =>
      employees.find((employee) => employee.id === id)?.name ??
      `Employee #${id}`,
    [employees]
  )

  const handleDelete = useCallback(
    async (record: PayrollRecord) => {
      if (
        !(await confirmDeleteAction({
          itemName: `${employeeName(record.employeeId)} · ${record.period}`,
          entityLabel: "payroll record",
        }))
      ) {
        return
      }
      removeRecord(record.id)
      if (sidebar?.mode !== "add" && sidebar?.record.id === record.id) {
        setSidebar(null)
      }
      toast.message("Payroll record removed.")
    },
    [employeeName, removeRecord, sidebar]
  )

  const markPending = useCallback(
    (record: PayrollRecord) => {
      updateRecord(record.id, { status: "pending", paidDate: "" })
      toast.success("Payroll submitted for payment.")
    },
    [updateRecord]
  )

  const markPaid = useCallback(
    (record: PayrollRecord) => {
      updateRecord(record.id, {
        status: "paid",
        paidDate: new Date().toISOString().slice(0, 10),
      })
      toast.success("Payroll marked as paid.")
    },
    [updateRecord]
  )

  const columns = useMemo<ColumnDef<PayrollRecord>[]>(
    () => [
      {
        id: "employee",
        accessorFn: (row) => employeeName(row.employeeId),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Employee" align="center" />
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
        meta: { dataTableFilter: false, cellClassName: "text-center" },
      },
      {
        accessorKey: "baseSalary",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Base" align="center" />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums">{formatMoney(row.original.baseSalary)}</span>
        ),
        meta: { dataTableFilter: false, cellClassName: "text-center" },
      },
      {
        accessorKey: "bonuses",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Bonus" align="center" />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums">{formatMoney(row.original.bonuses)}</span>
        ),
        meta: { dataTableFilter: false, cellClassName: "text-center" },
      },
      {
        accessorKey: "commissions",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Commission"
            align="center"
          />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatMoney(row.original.commissions)}
          </span>
        ),
        meta: { dataTableFilter: false, cellClassName: "text-center" },
      },
      {
        accessorKey: "deductions",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Deductions"
            align="center"
          />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatMoney(row.original.deductions)}
          </span>
        ),
        meta: { dataTableFilter: false, cellClassName: "text-center" },
      },
      {
        accessorKey: "netPay",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Net pay" align="center" />
        ),
        cell: ({ row }) => (
          <span className="font-semibold tabular-nums">
            {formatMoney(row.original.netPay)}
          </span>
        ),
        meta: { dataTableFilter: false, cellClassName: "text-center" },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" align="center" />
        ),
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={payrollStatusClass(row.original.status)}
          >
            {payrollStatusLabel(row.original.status)}
          </Badge>
        ),
        meta: { dataTableFilter: false, cellClassName: "text-center" },
      },
      {
        id: "actions",
        enableSorting: false,
        enableHiding: false,
        meta: { cellClassName: "text-center" },
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="size-8">
                <IconDotsVertical />
                <span className="sr-only">Payroll actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() => setSidebar({ mode: "view", record: row.original })}
              >
                <IconEye />
                View
              </DropdownMenuItem>
              {row.original.status !== "paid" ? (
                <>
                  <DropdownMenuItem
                    onClick={() =>
                      setSidebar({ mode: "edit", record: row.original })
                    }
                  >
                    <IconGift />
                    Add bonus
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      setSidebar({ mode: "edit", record: row.original })
                    }
                  >
                    <IconPercentage />
                    Add commission
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      setSidebar({ mode: "edit", record: row.original })
                    }
                  >
                    <IconPencil />
                    Edit payroll
                  </DropdownMenuItem>
                </>
              ) : null}
              {row.original.status === "draft" ? (
                <DropdownMenuItem onClick={() => markPending(row.original)}>
                  <IconPlayerPlay />
                  Submit
                </DropdownMenuItem>
              ) : null}
              {row.original.status === "pending" ? (
                <DropdownMenuItem onClick={() => markPaid(row.original)}>
                  <IconCheck />
                  Mark paid
                </DropdownMenuItem>
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
    [employeeName, handleDelete, markPaid, markPending]
  )

  const generateMonth = () => {
    const existingEmployeeIds = new Set(
      periodRecords.map((record) => record.employeeId)
    )
    const missing = activeEmployees.filter(
      (employee) => !existingEmployeeIds.has(employee.id)
    )
    if (missing.length === 0) {
      toast.message(`Payroll already exists for all active employees in ${periodLabel(period)}.`)
      return
    }
    for (const employee of missing) {
      addRecord({
        ...EMPTY_PAYROLL,
        employeeId: employee.id,
        period,
        baseSalary: employee.baseSalary,
        netPay: computeNetPay(employee.baseSalary, "0", "0", "0"),
      })
    }
    toast.success(
      `Created ${missing.length} draft payroll record${missing.length === 1 ? "" : "s"}.`
    )
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const fd = new FormData(event.currentTarget)
    const next = payrollFromFormData(
      fd,
      sidebar?.mode === "edit" ? sidebar.record.id : 0
    )
    const duplicate = records.some(
      (record) =>
        record.employeeId === next.employeeId &&
        record.period === next.period &&
        record.id !== next.id
    )
    if (duplicate) {
      toast.error("This employee already has payroll for the selected month.")
      return
    }
    if (next.employeeId === 0 || !next.period) {
      toast.error("Select an employee and payroll month.")
      return
    }
    if (sidebar?.mode === "edit") {
      updateRecord(sidebar.record.id, next)
      toast.success("Payroll record updated.")
    } else {
      addRecord(next)
      toast.success("Payroll record added.")
    }
    setPeriod(next.period)
    setSidebar(null)
  }

  const sheetRecord =
    sidebar?.mode === "edit" || sidebar?.mode === "view"
      ? sidebar.record
      : null
  const formRecord =
    sidebar?.mode === "add"
      ? { ...EMPTY_PAYROLL, period }
      : sheetRecord ?? { ...EMPTY_PAYROLL, period }
  const formId =
    sidebar?.mode === "edit"
      ? `payroll-edit-${sidebar.record.id}`
      : "payroll-add"

  return (
    <>
      <Sheet open={sidebar !== null} onOpenChange={(open) => !open && setSidebar(null)}>
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
                    ? "Add payroll record"
                    : sidebar.mode === "edit"
                      ? "Edit payroll record"
                      : employeeName(sidebar.record.employeeId)}
                </SheetTitle>
                <SheetDescription>
                  {sidebar.mode === "view"
                    ? periodLabel(sidebar.record.period)
                    : "Set monthly earnings, deductions, and payment status."}
                </SheetDescription>
              </SheetHeader>
              <div
                key={
                  sidebar.mode === "add"
                    ? `add-${period}`
                    : `${sidebar.record.id}-${sidebar.mode}`
                }
                className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
              >
                {sidebar.mode === "view" ? (
                  <PayrollDetail
                    record={sidebar.record}
                    employeeName={employeeName(sidebar.record.employeeId)}
                  />
                ) : (
                  <PayrollForm
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
                    {sidebar.record.status !== "paid" ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setSidebar({ mode: "edit", record: sidebar.record })
                        }
                      >
                        Edit
                      </Button>
                    ) : null}
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
                      {sidebar.mode === "add" ? "Add payroll" : "Save changes"}
                    </Button>
                  </>
                )}
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <DataTable
        data={periodRecords}
        columns={columns}
        addButtonLabel="New Payroll"
        searchPlaceholder={`Search ${periodLabel(period)} payroll...`}
        showImportButton={false}
        onAddClick={() => setSidebar({ mode: "add" })}
        toolbarExtra={
          <span className="text-muted-foreground whitespace-nowrap text-sm font-medium">
            {periodLabel(period)}
          </span>
        }
        toolbarActions={
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-full px-7 shadow-sm"
            onClick={generateMonth}
          >
            <IconCalendarMonth className="size-4" />
            <span className="hidden sm:inline">Generate</span>
          </Button>
        }
        tableOptionsExtra={
          <div className="space-y-2">
            <Label htmlFor="payroll-month-filter" className="text-xs">
              Payroll month
            </Label>
            <Input
              id="payroll-month-filter"
              type="month"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="h-9 w-full"
            />
            <p className="text-muted-foreground text-xs">
              Showing {periodLabel(period)}
            </p>
          </div>
        }
        exportFilename={`payroll-${period}.csv`}
        onDataChange={(nextPeriodRecords) => {
          const periodIds = new Set(periodRecords.map((record) => record.id))
          setRecords((previous) => [
            ...previous.filter((record) => !periodIds.has(record.id)),
            ...nextPeriodRecords,
          ])
        }}
        tabs={payrollTabs}
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
                  entityLabel: "payroll record",
                }))
              ) {
                return
              }
              const ids = new Set(selected.map((record) => record.id))
              setRecords((previous) =>
                previous.filter((record) => !ids.has(record.id))
              )
              toast.message(`Removed ${selected.length} payroll record(s).`)
            },
          },
        ]}
      />
    </>
  )
}
