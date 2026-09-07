"use client"

import { useCallback, useMemo, useState, type FormEvent } from "react"
import { ColumnDef } from "@tanstack/react-table"
import {
  IconDotsVertical,
  IconEye,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

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
import { useDepartments } from "@/context/employee-departments-context"
import { useEmployees } from "@/context/employees-context"
import { confirmDeleteAction } from "@/lib/confirm-action"
import {
  EMPTY_DEPARTMENT,
  departmentFromFormData,
  mapImportedDepartment,
  type DepartmentRow,
} from "@/lib/employee-departments"

type DepartmentSidebarState =
  | { mode: "add" }
  | { mode: "view"; department: DepartmentRow }
  | { mode: "edit"; department: DepartmentRow }
  | null

function departmentTabFilter(row: DepartmentRow, tab: string) {
  if (tab === "all") return true
  return row.status === tab
}

function DepartmentForm({
  formId,
  department,
  onSubmit,
}: {
  formId: string
  department: DepartmentRow
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
}) {
  const { t } = useTranslation("employees")
  const { t: tc } = useTranslation("common")
  return (
    <form id={formId} className="flex flex-col gap-4 text-sm" onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${formId}-name`}>{t("departmentsPage.name")}</Label>
        <Input
          id={`${formId}-name`}
          name="name"
          required
          defaultValue={department.name}
          placeholder={t("departmentsPage.namePlaceholder")}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${formId}-description`}>{t("departmentsPage.description")}</Label>
        <Input
          id={`${formId}-description`}
          name="description"
          defaultValue={
            department.description === "—" ? "" : department.description
          }
          placeholder={t("departmentsPage.descriptionPlaceholder")}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${formId}-status`}>{t("columns.status")}</Label>
        <select
          id={`${formId}-status`}
          name="status"
          defaultValue={department.status}
          className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        >
          <option value="active">{tc("status.active")}</option>
          <option value="inactive">{tc("status.inactive")}</option>
        </select>
      </div>
    </form>
  )
}

function DepartmentDetail({
  department,
  headcount,
}: {
  department: DepartmentRow
  headcount: number
}) {
  const { t } = useTranslation("employees")
  return (
    <dl className="space-y-3 text-sm">
      <div className="grid grid-cols-[7rem_1fr] gap-2">
        <dt className="text-muted-foreground">{t("departmentsPage.name")}</dt>
        <dd className="font-medium">{department.name}</dd>
      </div>
      <div className="grid grid-cols-[7rem_1fr] gap-2">
        <dt className="text-muted-foreground">{t("departmentsPage.description")}</dt>
        <dd className="text-foreground whitespace-normal">
          {department.description}
        </dd>
      </div>
      <div className="grid grid-cols-[7rem_1fr] gap-2">
        <dt className="text-muted-foreground">{t("columns.status")}</dt>
        <dd className="font-medium">
          {department.status === "active"
            ? t("status.active")
            : t("status.inactive")}
        </dd>
      </div>
      <div className="grid grid-cols-[7rem_1fr] gap-2">
        <dt className="text-muted-foreground">{t("departmentsPage.employees")}</dt>
        <dd className="font-medium tabular-nums">
          {t("departmentsPage.activeCount", { count: headcount })}
        </dd>
      </div>
    </dl>
  )
}

export function EmployeeDepartmentsPanel() {
  const { t } = useTranslation("employees")
  const { t: tc } = useTranslation("common")
  const {
    departments,
    setDepartments,
    addDepartment,
    updateDepartment,
    removeDepartment,
  } = useDepartments()
  const { employees } = useEmployees()
  const [sidebar, setSidebar] = useState<DepartmentSidebarState>(null)
  const departmentTabs: DataTableTab[] = [
    { value: "all", label: tc("tabs.all") },
    { value: "active", label: tc("tabs.active") },
    { value: "inactive", label: tc("tabs.inactive") },
  ]

  const headcountByName = useCallback(
    (name: string) =>
      employees.filter((e) => e.department === name && e.status === "active")
        .length,
    [employees]
  )

  const closeSidebar = () => setSidebar(null)

  const handleDelete = useCallback(
    async (dept: DepartmentRow) => {
      if (
        !(await confirmDeleteAction({
          itemName: dept.name,
          entityLabel: t("entity.department"),
        }))
      ) {
        return
      }
      removeDepartment(dept.id)
      if (
        sidebar &&
        sidebar.mode !== "add" &&
        sidebar.department.id === dept.id
      ) {
        closeSidebar()
      }
      toast.message(t("departmentsPage.toastRemoved", { name: dept.name }))
    },
    [removeDepartment, sidebar, t]
  )

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const fd = new FormData(e.currentTarget)
      const name = String(fd.get("name") ?? "").trim()
      if (!name) {
        toast.error(t("departmentsPage.toastNameRequired"))
        return
      }

      if (sidebar?.mode === "add") {
        addDepartment(departmentFromFormData(fd, 0))
        toast.success(t("departmentsPage.toastCreated"))
        closeSidebar()
        return
      }

      if (sidebar?.mode === "edit") {
        updateDepartment(
          sidebar.department.id,
          departmentFromFormData(fd, sidebar.department.id)
        )
        toast.success(t("departmentsPage.toastSaved"))
        closeSidebar()
      }
    },
    [sidebar, addDepartment, updateDepartment, t]
  )

  const columns = useMemo<ColumnDef<DepartmentRow>[]>(
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
        accessorKey: "id",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("departmentsPage.id")} />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground font-mono tabular-nums">
            {row.original.id}
          </span>
        ),
        meta: { dataTableFilter: false },
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("departmentsPage.department")} />
        ),
        cell: ({ row }) => (
          <button
            type="button"
            className="text-foreground text-left font-medium hover:underline"
            onClick={() =>
              setSidebar({ mode: "view", department: row.original })
            }
          >
            {row.original.name}
          </button>
        ),
        enableHiding: false,
        meta: { dataTableFilter: false },
      },
      {
        accessorKey: "description",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("departmentsPage.description")} />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground max-w-xs text-sm leading-snug whitespace-normal">
            {row.original.description}
          </span>
        ),
        meta: {
          dataTableFilter: false,
          cellClassName: "whitespace-normal max-w-xs",
        },
      },
      {
        id: "employees",
        accessorFn: (row) => headcountByName(row.name),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("departmentsPage.employees")} />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums">
            {headcountByName(row.original.name)}
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
          <span
            className={
              row.original.status === "active"
                ? "text-emerald-700 text-sm dark:text-emerald-400"
                : "text-muted-foreground text-sm"
            }
          >
            {row.original.status === "active" ? t("status.active") : t("status.inactive")}
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
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={() =>
                  setSidebar({ mode: "view", department: row.original })
                }
              >
                <IconEye />
                {tc("actions.view")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  setSidebar({ mode: "edit", department: row.original })
                }
              >
                <IconPencil />
                {tc("actions.edit")}
              </DropdownMenuItem>
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
    [handleDelete, headcountByName, t, tc]
  )

  const sheetDepartment =
    sidebar && sidebar.mode !== "add" ? sidebar.department : null
  const formDepartment =
    sidebar?.mode === "add"
      ? EMPTY_DEPARTMENT
      : sheetDepartment ?? EMPTY_DEPARTMENT
  const formId =
    sidebar?.mode === "add"
      ? "department-add-form"
      : sheetDepartment
        ? `department-edit-${sheetDepartment.id}`
        : "department-edit"

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
          className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
        >
          {sidebar ? (
            <>
              <SheetHeader className="border-border/60 space-y-1 border-b px-6 py-5 text-left">
                <SheetTitle className="text-lg leading-tight">
                  {sidebar.mode === "add"
                    ? t("departmentsPage.addTitle")
                    : sidebar.mode === "edit"
                      ? t("departmentsPage.editTitle")
                      : sheetDepartment?.name}
                </SheetTitle>
                <SheetDescription>
                  {sidebar.mode === "add" ? (
                    t("departmentsPage.addHint")
                  ) : sidebar.mode === "edit" && sheetDepartment ? (
                    <>
                      {sheetDepartment.name}
                      <span className="text-muted-foreground">
                        {" "}
                        {t("departmentsPage.idLabel", { id: sheetDepartment.id })}
                      </span>
                    </>
                  ) : sheetDepartment ? (
                    <>
                      {t("departmentsPage.idLabel", { id: sheetDepartment.id })}
                      <span className="text-muted-foreground">
                        {" "}
                        · {t("departmentsPage.activeEmployees", {
                          count: headcountByName(sheetDepartment.name),
                        })}
                      </span>
                    </>
                  ) : null}
                </SheetDescription>
              </SheetHeader>
              <div
                key={
                  sidebar.mode === "add"
                    ? "add"
                    : `${sheetDepartment?.id}-${sidebar.mode}`
                }
                className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
              >
                {sidebar.mode === "view" && sheetDepartment ? (
                  <DepartmentDetail
                    department={sheetDepartment}
                    headcount={headcountByName(sheetDepartment.name)}
                  />
                ) : (
                  <DepartmentForm
                    formId={formId}
                    department={formDepartment}
                    onSubmit={handleSubmit}
                  />
                )}
              </div>
              <SheetFooter className="border-border/60 gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end">
                {sidebar.mode === "view" ? (
                  <>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() =>
                        sheetDepartment &&
                        setSidebar({
                          mode: "edit",
                          department: sheetDepartment,
                        })
                      }
                    >
                      {tc("actions.edit")}
                    </Button>
                    <SheetClose asChild>
                      <Button className="w-full sm:w-auto">{tc("actions.close")}</Button>
                    </SheetClose>
                  </>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Button variant="outline" type="button">
                        {tc("actions.cancel")}
                      </Button>
                    </SheetClose>
                    <Button type="submit" form={formId}>
                      {sidebar.mode === "add"
                        ? t("departmentsPage.createDepartment")
                        : t("departmentsPage.saveDepartment")}
                    </Button>
                  </>
                )}
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <DataTable
        data={departments}
        columns={columns}
        addButtonLabel={t("departmentsPage.newDepartment")}
        searchPlaceholder={t("departmentsPage.searchPlaceholder")}
        importRowMapper={mapImportedDepartment}
        importSampleFilename="departments-sample.csv"
        exportFilename="departments-export.csv"
        onDataChange={setDepartments}
        onAddClick={() => setSidebar({ mode: "add" })}
        defaultColumnVisibility={{ actions: false }}
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
                  entityLabel: t("entity.department"),
                }))
              ) {
                return
              }
              const ids = new Set(selected.map((d) => d.id))
              setDepartments((prev) => prev.filter((r) => !ids.has(r.id)))
              toast.message(
                t("departmentsPage.toastRemovedCount", { count: selected.length })
              )
            },
          },
        ]}
        tabs={departmentTabs}
        defaultTab="all"
        tabFilter={departmentTabFilter}
      />
    </>
  )
}
