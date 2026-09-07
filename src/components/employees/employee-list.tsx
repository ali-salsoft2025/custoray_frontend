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
import { useTranslation } from "react-i18next"

import { EmployeeDetail } from "@/components/employees/employee-detail"
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
  type EmployeeFormValues,
  type EmployeeRow,
} from "@/lib/employees"

type EmployeeSidebarState =
  | { mode: "add" }
  | { mode: "view"; employee: EmployeeRow }
  | { mode: "edit"; employee: EmployeeRow }
  | null

function employeeTabFilter(row: EmployeeRow, tab: string) {
  if (tab === "all") return true
  if (tab === "portal") return row.portalEnabled
  return row.status === tab
}

export function EmployeeList() {
  const { canAdmin } = useAuth()
  const { t } = useTranslation("employees")
  const { t: tc } = useTranslation("common")
  const {
    employees,
    setEmployees,
    addEmployee,
    updateEmployee,
    removeEmployee,
    getEmployee,
  } = useEmployees()
  const [sidebar, setSidebar] = useState<EmployeeSidebarState>(null)
  const [formStep, setFormStep] = useState<1 | 2>(1)
  const [portalEnabled, setPortalEnabled] = useState(false)
  const formRef = useRef<EmployeeFormHandle>(null)
  const employeeTabs: DataTableTab[] = [
    { value: "all", label: tc("tabs.all") },
    { value: "active", label: tc("tabs.active") },
    { value: "inactive", label: tc("tabs.inactive") },
    { value: "portal", label: t("tabs.portalAccess") },
  ]

  const closeSidebar = () => {
    setSidebar(null)
    setFormStep(1)
  }

  const openSidebar = useCallback(
    (row: EmployeeRow, mode: "view" | "edit") => {
      setSidebar({ mode, employee: row })
      setFormStep(1)
    },
    []
  )

  const handleDelete = useCallback(
    async (employee: EmployeeRow) => {
      if (!canAdmin) return
      if (
        !(await confirmDeleteAction({
          itemName: employee.name,
          entityLabel: t("entity.employee"),
        }))
      ) {
        return
      }
      removeEmployee(employee.id)
      if (
        sidebar &&
        sidebar.mode !== "add" &&
        sidebar.employee.id === employee.id
      ) {
        closeSidebar()
      }
      toast.message(t("list.toastRemoved", { name: employee.name }))
    },
    [canAdmin, removeEmployee, sidebar, t]
  )

  const handleSubmit = useCallback(
    (values: EmployeeFormValues) => {
      if (!canAdmin) return
      if (sidebar?.mode === "add") {
        addEmployee(employeeFromValues(values, 0))
        toast.success(t("list.toastCreated"))
        closeSidebar()
        return
      }
      if (sidebar?.mode === "edit") {
        updateEmployee(
          sidebar.employee.id,
          employeeFromValues(values, sidebar.employee.id, sidebar.employee)
        )
        toast.success(t("list.toastSaved"))
        closeSidebar()
      }
    },
    [canAdmin, sidebar, addEmployee, updateEmployee, t]
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
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
              aria-label={tc("table.selectAll")}
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label={tc("table.selectRow")}
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("columns.name")} />
        ),
        cell: ({ row }) => (
          <button
            type="button"
            className="text-foreground text-left font-medium hover:underline"
            onClick={() => openSidebar(row.original, "view")}
          >
            {row.original.name}
          </button>
        ),
        enableHiding: false,
        meta: { dataTableFilter: false },
      },
      {
        accessorKey: "department",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("columns.department")} />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.department}
          </span>
        ),
        meta: { dataTableFilter: false },
      },
      {
        accessorKey: "baseSalary",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("columns.salary")} />
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
          <DataTableColumnHeader column={column} title={t("columns.portal")} />
        ),
        cell: ({ row }) =>
          row.original.portalEnabled ? (
            <span className="text-emerald-700 text-sm dark:text-emerald-400">
              {t("status.portalOn")}
            </span>
          ) : (
            <span className="text-muted-foreground text-sm">{t("status.portalOff")}</span>
          ),
        meta: { dataTableFilter: false },
      },
      {
        id: "permissions",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("columns.access")} />
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
          <DataTableColumnHeader column={column} title={t("columns.status")} />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {t(`status.${row.original.status}`)}
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
                <span className="sr-only">{tc("actions.openMenu")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() => openSidebar(row.original, "view")}
              >
                <IconEye />
                {tc("actions.view")}
              </DropdownMenuItem>
              {canAdmin ? (
                <>
                  <DropdownMenuItem
                    onClick={() => openSidebar(row.original, "edit")}
                  >
                    <IconPencil />
                    {tc("actions.edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/employees/${row.original.id}`}>
                      <IconEye />
                      {t("list.fullProfile")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => handleDelete(row.original)}
                  >
                    <IconTrash />
                    {tc("actions.delete")}
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem asChild>
                  <Link href={`/employees/${row.original.id}`}>
                    <IconEye />
                    {t("list.fullProfile")}
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [canAdmin, handleDelete, openSidebar, t, tc]
  )

  const sheetEmployeeId =
    sidebar && sidebar.mode !== "add" ? sidebar.employee.id : null
  const sheetEmployee =
    sheetEmployeeId != null
      ? (getEmployee(sheetEmployeeId) ??
        (sidebar && sidebar.mode !== "add" ? sidebar.employee : null))
      : null
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
          className={`flex w-full flex-col gap-0 overflow-hidden p-0 ${
            sidebar?.mode === "view" ? "sm:max-w-lg" : "sm:max-w-xl"
          }`}
        >
          {sidebar ? (
            <>
              <SheetHeader className="border-border/60 space-y-1 border-b px-6 py-5 text-left">
                <SheetTitle className="text-lg leading-tight">
                  {sidebar.mode === "add"
                    ? t("add")
                    : sidebar.mode === "edit"
                      ? t("edit")
                      : sheetEmployee?.name}
                </SheetTitle>
                <SheetDescription>
                  {sidebar.mode === "add" ? (
                    formStep === 1
                      ? t("list.step1")
                      : t("list.step2")
                  ) : sidebar.mode === "edit" && sheetEmployee ? (
                    <>
                      {sheetEmployee.name}
                      <span className="text-muted-foreground">
                        {" "}
                        · {sheetEmployee.department || t("list.noDepartment")}
                      </span>
                    </>
                  ) : sheetEmployee ? (
                    <>
                      ID {sheetEmployee.id}
                      {sheetEmployee.designation
                        ? ` · ${sheetEmployee.designation}`
                        : ""}
                    </>
                  ) : null}
                </SheetDescription>
              </SheetHeader>
              <div
                key={
                  sidebar.mode === "add"
                    ? "add"
                    : `${sheetEmployee?.id}-${sidebar.mode}`
                }
                className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
              >
                {sidebar.mode === "view" && sheetEmployee ? (
                  <EmployeeDetail employee={sheetEmployee} />
                ) : sidebar.mode === "edit" || sidebar.mode === "add" ? (
                  <EmployeeForm
                    ref={formRef}
                    formId={formId}
                    mode={sidebar.mode}
                    employee={formEmployee}
                    onSubmit={handleSubmit}
                    onStepChange={setFormStep}
                    onPortalEnabledChange={setPortalEnabled}
                  />
                ) : null}
              </div>
              <SheetFooter className="border-border/60 gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end">
                {sidebar.mode === "view" ? (
                  <>
                    {canAdmin ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() =>
                          sheetEmployee &&
                          setSidebar({ mode: "edit", employee: sheetEmployee })
                        }
                      >
                        {tc("actions.edit")}
                      </Button>
                    ) : null}
                    <SheetClose asChild>
                      <Button type="button" className="w-full sm:w-auto">
                        {tc("actions.close")}
                      </Button>
                    </SheetClose>
                  </>
                ) : sidebar.mode === "add" && formStep === 2 ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => formRef.current?.goBack()}
                    >
                      {tc("actions.back")}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => formRef.current?.goNextOrSubmit()}
                    >
                      {t("list.createEmployee")}
                    </Button>
                  </>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Button variant="outline" type="button">
                        {tc("actions.cancel")}
                      </Button>
                    </SheetClose>
                    <Button
                      type="button"
                      onClick={() => formRef.current?.goNextOrSubmit()}
                    >
                      {sidebar.mode === "add"
                        ? portalEnabled
                          ? tc("actions.continue")
                          : t("list.createEmployee")
                        : t("list.saveEmployee")}
                    </Button>
                  </>
                )}
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <DataTable
        data={employees}
        columns={columns}
        addButtonLabel={t("list.newEmployee")}
        searchPlaceholder={t("list.searchPlaceholder")}
        importRowMapper={mapImportedEmployee}
        importSampleFilename="employees-sample.csv"
        exportFilename="employees-export.csv"
        onDataChange={setEmployees}
        onAddClick={() => {
          if (!canAdmin) {
            toast.error(t("list.toastAdminOnly"))
            return
          }
          setSidebar({ mode: "add" })
          setFormStep(1)
        }}
        defaultColumnVisibility={{}}
        bulkActions={
          canAdmin
            ? [
                {
                  id: "delete",
                  label: tc("actions.deleteSelected"),
                  icon: <IconTrash className="size-4" />,
                  variant: "destructive",
                  onClick: async (selected) => {
                    if (
                      !(await confirmDeleteAction({
                        count: selected.length,
                        entityLabel: t("entity.employee"),
                      }))
                    ) {
                      return
                    }
                    const ids = new Set(selected.map((e) => e.id))
                    setEmployees((prev) => prev.filter((r) => !ids.has(r.id)))
                    toast.message(t("list.toastRemovedCount", { count: selected.length }))
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
