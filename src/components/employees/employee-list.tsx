"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import {
  IconDotsVertical,
  IconEye,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react"
import { toast } from "sonner"

import {
  EmployeeForm,
  type EmployeeFormHandle,
} from "@/components/employees/employee-form"
import { DataTableColumnHeader } from "@/components/data-table-column-header"
import { DataTable, type DataTableTab } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { confirmDeleteAction } from "@/lib/confirm-action"
import { permissionSummary } from "@/lib/employee-permissions"
import { formatMoney } from "@/lib/employee-payroll"
import {
  EMPTY_EMPLOYEE,
  employeeFromValues,
  mapImportedEmployee,
  statusLabel,
  type EmployeeFormValues,
  type EmployeeRow,
} from "@/lib/employees"

const employeeTabs: DataTableTab[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "portal", label: "Portal access" },
]

type EmployeeSidebarState =
  | { mode: "add" }
  | { mode: "edit"; employee: EmployeeRow }
  | null

function employeeTabFilter(row: EmployeeRow, tab: string) {
  if (tab === "all") return true
  if (tab === "portal") return row.portalEnabled
  return row.status === tab
}

export function EmployeeList() {
  const { canAdmin } = useAuth()
  const {
    employees,
    setEmployees,
    addEmployee,
    updateEmployee,
    removeEmployee,
  } = useEmployees()
  const [sidebar, setSidebar] = useState<EmployeeSidebarState>(null)
  const [formStep, setFormStep] = useState<1 | 2>(1)
  const [portalEnabled, setPortalEnabled] = useState(false)
  const formRef = useRef<EmployeeFormHandle>(null)

  const closeSidebar = () => {
    setSidebar(null)
    setFormStep(1)
  }

  const handleDelete = useCallback(
    async (employee: EmployeeRow) => {
      if (!canAdmin) return
      if (
        !(await confirmDeleteAction({
          itemName: employee.name,
          entityLabel: "employee",
        }))
      ) {
        return
      }
      removeEmployee(employee.id)
      if (sidebar?.mode === "edit" && sidebar.employee.id === employee.id) {
        closeSidebar()
      }
      toast.message(`Removed ${employee.name}.`)
    },
    [canAdmin, removeEmployee, sidebar]
  )

  const handleSubmit = useCallback(
    (values: EmployeeFormValues) => {
      if (!canAdmin) return
      if (sidebar?.mode === "add") {
        addEmployee(employeeFromValues(values, 0))
        toast.success("Employee created.")
        closeSidebar()
        return
      }
      if (sidebar?.mode === "edit") {
        updateEmployee(
          sidebar.employee.id,
          employeeFromValues(values, sidebar.employee.id, sidebar.employee)
        )
        toast.success("Employee saved.")
        closeSidebar()
      }
    },
    [canAdmin, sidebar, addEmployee, updateEmployee]
  )

  const columns = useMemo<ColumnDef<EmployeeRow>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => (
          <Link
            href={`/employees/${row.original.id}`}
            className="text-foreground font-medium hover:underline"
          >
            {row.original.name}
          </Link>
        ),
        enableHiding: false,
        meta: { dataTableFilter: false },
      },
      {
        accessorKey: "department",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Department" />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.department}</span>
        ),
        meta: { dataTableFilter: false },
      },
      {
        accessorKey: "baseSalary",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Salary" />
        ),
        cell: ({ row }) => (
          <span className="text-foreground tabular-nums">
            {formatMoney(row.original.baseSalary)}
          </span>
        ),
        meta: { dataTableFilter: false },
      },
      {
        id: "portal",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Portal" />
        ),
        cell: ({ row }) =>
          row.original.portalEnabled ? (
            <span className="text-emerald-700 text-sm dark:text-emerald-400">
              Active
            </span>
          ) : (
            <span className="text-muted-foreground text-sm">Off</span>
          ),
        meta: { dataTableFilter: false },
      },
      {
        id: "permissions",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Access" />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {permissionSummary(row.original.permissions)}
          </span>
        ),
        meta: { dataTableFilter: false },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {statusLabel(row.original.status)}
          </span>
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
              <Button variant="ghost" className="size-8" size="icon">
                <IconDotsVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem asChild>
                <Link href={`/employees/${row.original.id}`}>
                  <IconEye />
                  View profile
                </Link>
              </DropdownMenuItem>
              {canAdmin ? (
                <>
                  <DropdownMenuItem
                    onClick={() =>
                      setSidebar({ mode: "edit", employee: row.original })
                    }
                  >
                    <IconPencil />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => handleDelete(row.original)}
                  >
                    <IconTrash />
                    Delete
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [canAdmin, handleDelete]
  )

  const sheetEmployee =
    sidebar?.mode === "edit" ? sidebar.employee : null
  const formEmployee =
    sidebar?.mode === "add" ? EMPTY_EMPLOYEE : sheetEmployee ?? EMPTY_EMPLOYEE
  const formId =
    sidebar?.mode === "add"
      ? "employee-add-form"
      : sheetEmployee
        ? `employee-edit-${sheetEmployee.id}`
        : "employee-edit"

  return (
    <>
      <Sheet
        open={sidebar !== null}
        onOpenChange={(open) => {
          if (!open) closeSidebar()
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
        >
          {sidebar ? (
            <>
              <SheetHeader className="border-border/60 space-y-1 border-b px-6 py-5 text-left">
                <SheetTitle className="text-lg leading-tight">
                  {sidebar.mode === "add" ? "Add employee" : "Edit employee"}
                </SheetTitle>
                <SheetDescription>
                  {sidebar.mode === "add" ? (
                    formStep === 1
                      ? "Step 1 — basic info and portal access."
                      : "Step 2 — login credentials and module permissions."
                  ) : sheetEmployee ? (
                    <>
                      {sheetEmployee.name}
                      <span className="text-muted-foreground">
                        {" "}
                        · {sheetEmployee.department || "No department"}
                      </span>
                    </>
                  ) : null}
                </SheetDescription>
              </SheetHeader>
              <div
                key={
                  sidebar.mode === "add"
                    ? "add"
                    : `${sheetEmployee?.id}-edit`
                }
                className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
              >
                <EmployeeForm
                  ref={formRef}
                  formId={formId}
                  mode={sidebar.mode}
                  employee={formEmployee}
                  onSubmit={handleSubmit}
                  onStepChange={setFormStep}
                  onPortalEnabledChange={setPortalEnabled}
                />
              </div>
              <SheetFooter className="border-border/60 gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end">
                {sidebar.mode === "add" && formStep === 2 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => formRef.current?.goBack()}
                  >
                    Back
                  </Button>
                ) : (
                  <SheetClose asChild>
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  </SheetClose>
                )}
                <Button
                  type="button"
                  onClick={() => formRef.current?.goNextOrSubmit()}
                >
                  {sidebar.mode === "add"
                    ? formStep === 2
                      ? "Create employee"
                      : portalEnabled
                        ? "Continue"
                        : "Create employee"
                    : "Save employee"}
                </Button>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <DataTable
        data={employees}
        columns={columns}
        addButtonLabel="New Employee"
        searchPlaceholder="Search employees..."
        importRowMapper={mapImportedEmployee}
        importSampleFilename="employees-sample.csv"
        exportFilename="employees-export.csv"
        onDataChange={setEmployees}
        onAddClick={() => {
          if (!canAdmin) {
            toast.error("Only admins can add employees.")
            return
          }
          setSidebar({ mode: "add" })
        }}
        defaultColumnVisibility={{ actions: false }}
        bulkActions={
          canAdmin
            ? [
                {
                  id: "delete",
                  label: "Delete selected",
                  icon: <IconTrash className="size-4" />,
                  variant: "destructive",
                  onClick: async (selected) => {
                    if (
                      !(await confirmDeleteAction({
                        count: selected.length,
                        entityLabel: "employee",
                      }))
                    ) {
                      return
                    }
                    const ids = new Set(selected.map((e) => e.id))
                    setEmployees((prev) => prev.filter((r) => !ids.has(r.id)))
                    toast.message(`Removed ${selected.length} employee(s).`)
                  },
                },
              ]
            : []
        }
        tabs={employeeTabs}
        defaultTab="all"
        tabFilter={employeeTabFilter}
      />
    </>
  )
}
