"use client"

import { useCallback, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { StatCard, StatCardsGrid } from "@/components/stat-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/context/auth-context"
import { useEmployees } from "@/context/employees-context"
import { confirmDeleteAction } from "@/lib/confirm-action"
import { permissionSummary } from "@/lib/employee-permissions"
import { formatMoney } from "@/lib/employee-payroll"
import {
  mapImportedEmployee,
  statusBadgeClass,
  statusLabel,
  type EmployeeRow,
} from "@/lib/employees"

const employeeTabs: DataTableTab[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "portal", label: "Portal access" },
]

function employeeTabFilter(row: EmployeeRow, tab: string) {
  if (tab === "all") return true
  if (tab === "portal") return row.portalEnabled
  return row.status === tab
}

export function EmployeeList() {
  const router = useRouter()
  const { canAdmin } = useAuth()
  const { employees, setEmployees, removeEmployee } = useEmployees()

  const employeeStats = useMemo(() => {
    const active = employees.filter((e) => e.status === "active")
    const portal = employees.filter((e) => e.portalEnabled)
    const admins = employees.filter((e) => e.permissions.admin)
    return {
      count: employees.length,
      activeCount: active.length,
      portalCount: portal.length,
      adminCount: admins.length,
    }
  }, [employees])

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
      toast.message(`Removed ${employee.name}.`)
    },
    [canAdmin, removeEmployee]
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
      },
      {
        accessorKey: "department",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Department" />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.department}</span>
        ),
      },
      {
        accessorKey: "baseSalary",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Salary" align="center" />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums">{formatMoney(row.original.baseSalary)}</span>
        ),
      },
      {
        id: "portal",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Portal" />
        ),
        cell: ({ row }) =>
          row.original.portalEnabled ? (
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
              Active
            </Badge>
          ) : (
            <Badge variant="outline">Off</Badge>
          ),
      },
      {
        id: "permissions",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Access" />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">
            {permissionSummary(row.original.permissions)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => (
          <Badge variant="outline" className={statusBadgeClass(row.original.status)}>
            {statusLabel(row.original.status)}
          </Badge>
        ),
      },
      {
        id: "actions",
        enableSorting: false,
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
                  <DropdownMenuItem asChild>
                    <Link href={`/employees/${row.original.id}/edit`}>
                      <IconPencil />
                      Edit
                    </Link>
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

  return (
    <>
      <StatCardsGrid className="mb-5">
        <StatCard label="Employees" value={String(employeeStats.count)} hint={`${employeeStats.activeCount} active`} />
        <StatCard label="Portal access" value={String(employeeStats.portalCount)} hint="Can sign in" />
        <StatCard label="Admins" value={String(employeeStats.adminCount)} hint="Full access" />
        <StatCard label="Inactive" value={String(employeeStats.count - employeeStats.activeCount)} hint="Offboarded" />
      </StatCardsGrid>

      <DataTable
        data={employees}
        columns={columns}
        addButtonLabel="Add employee"
        searchPlaceholder="Search employees..."
        importRowMapper={mapImportedEmployee}
        importSampleFilename="employees-sample.csv"
        exportFilename="employees-export.csv"
        onDataChange={setEmployees}
        onAddClick={() => router.push("/employees/new")}
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
