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

const departmentTabs: DataTableTab[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
]

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
  return (
    <form id={formId} className="flex flex-col gap-4 text-sm" onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${formId}-name`}>Name</Label>
        <Input
          id={`${formId}-name`}
          name="name"
          required
          defaultValue={department.name}
          placeholder="e.g. Sales"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${formId}-description`}>Description</Label>
        <Input
          id={`${formId}-description`}
          name="description"
          defaultValue={
            department.description === "—" ? "" : department.description
          }
          placeholder="What this team does"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${formId}-status`}>Status</Label>
        <select
          id={`${formId}-status`}
          name="status"
          defaultValue={department.status}
          className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
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
  return (
    <dl className="space-y-3 text-sm">
      <div className="grid grid-cols-[7rem_1fr] gap-2">
        <dt className="text-muted-foreground">Name</dt>
        <dd className="font-medium">{department.name}</dd>
      </div>
      <div className="grid grid-cols-[7rem_1fr] gap-2">
        <dt className="text-muted-foreground">Description</dt>
        <dd className="text-foreground whitespace-normal">
          {department.description}
        </dd>
      </div>
      <div className="grid grid-cols-[7rem_1fr] gap-2">
        <dt className="text-muted-foreground">Status</dt>
        <dd className="font-medium capitalize">{department.status}</dd>
      </div>
      <div className="grid grid-cols-[7rem_1fr] gap-2">
        <dt className="text-muted-foreground">Employees</dt>
        <dd className="font-medium tabular-nums">{headcount} active</dd>
      </div>
    </dl>
  )
}

export function EmployeeDepartmentsPanel() {
  const {
    departments,
    setDepartments,
    addDepartment,
    updateDepartment,
    removeDepartment,
  } = useDepartments()
  const { employees } = useEmployees()
  const [sidebar, setSidebar] = useState<DepartmentSidebarState>(null)

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
          entityLabel: "department",
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
      toast.message(`Removed ${dept.name}.`)
    },
    [removeDepartment, sidebar]
  )

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const fd = new FormData(e.currentTarget)
      const name = String(fd.get("name") ?? "").trim()
      if (!name) {
        toast.error("Department name is required.")
        return
      }

      if (sidebar?.mode === "add") {
        addDepartment(departmentFromFormData(fd, 0))
        toast.success("Department created.")
        closeSidebar()
        return
      }

      if (sidebar?.mode === "edit") {
        updateDepartment(
          sidebar.department.id,
          departmentFromFormData(fd, sidebar.department.id)
        )
        toast.success("Department saved.")
        closeSidebar()
      }
    },
    [sidebar, addDepartment, updateDepartment]
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
        accessorKey: "id",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="ID" />
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
          <DataTableColumnHeader column={column} title="Department" />
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
          <DataTableColumnHeader column={column} title="Description" />
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
          <DataTableColumnHeader column={column} title="Employees" />
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
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => (
          <span
            className={
              row.original.status === "active"
                ? "text-emerald-700 text-sm dark:text-emerald-400"
                : "text-muted-foreground text-sm"
            }
          >
            {row.original.status === "active" ? "Active" : "Inactive"}
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
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={() =>
                  setSidebar({ mode: "view", department: row.original })
                }
              >
                <IconEye />
                View
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  setSidebar({ mode: "edit", department: row.original })
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
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [handleDelete, headcountByName]
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
                    ? "Add department"
                    : sidebar.mode === "edit"
                      ? "Edit department"
                      : sheetDepartment?.name}
                </SheetTitle>
                <SheetDescription>
                  {sidebar.mode === "add" ? (
                    "Create a department for organizing your team."
                  ) : sidebar.mode === "edit" && sheetDepartment ? (
                    <>
                      {sheetDepartment.name}
                      <span className="text-muted-foreground">
                        {" "}
                        · ID {sheetDepartment.id}
                      </span>
                    </>
                  ) : sheetDepartment ? (
                    <>
                      ID {sheetDepartment.id}
                      <span className="text-muted-foreground">
                        {" "}
                        · {headcountByName(sheetDepartment.name)} active
                        employee(s)
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
                      Edit
                    </Button>
                    <SheetClose asChild>
                      <Button className="w-full sm:w-auto">Close</Button>
                    </SheetClose>
                  </>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Button variant="outline" type="button">
                        Cancel
                      </Button>
                    </SheetClose>
                    <Button type="submit" form={formId}>
                      {sidebar.mode === "add"
                        ? "Create department"
                        : "Save department"}
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
        addButtonLabel="New Department"
        searchPlaceholder="Search departments..."
        importRowMapper={mapImportedDepartment}
        importSampleFilename="departments-sample.csv"
        exportFilename="departments-export.csv"
        onDataChange={setDepartments}
        onAddClick={() => setSidebar({ mode: "add" })}
        defaultColumnVisibility={{ actions: false }}
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
                  entityLabel: "department",
                }))
              ) {
                return
              }
              const ids = new Set(selected.map((d) => d.id))
              setDepartments((prev) => prev.filter((r) => !ids.has(r.id)))
              toast.message(
                `Removed ${selected.length} department${selected.length === 1 ? "" : "s"}.`
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
