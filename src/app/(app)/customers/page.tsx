"use client"

import { useCallback, useMemo, useState, type FormEvent } from "react"
import { ColumnDef } from "@tanstack/react-table"
import {
  IconCopy,
  IconDotsVertical,
  IconEye,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { CustomerDetail } from "@/components/customers/customer-detail"
import { CustomerForm } from "@/components/customers/customer-form"
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
import { useCustomers } from "@/context/customers-context"
import {
  confirmDeleteAction,
  confirmDuplicateAction,
} from "@/lib/confirm-action"
import {
  computeBalance,
  customerFromFormData,
  EMPTY_CUSTOMER,
  formatMoney,
  mapImportedCustomer,
  statusLabel,
  type CustomerRow,
} from "@/lib/customers"

const customerTabs: DataTableTab[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
]

type CustomerSidebarState =
  | { mode: "view"; customer: CustomerRow }
  | { mode: "edit"; customer: CustomerRow }
  | { mode: "add" }
  | null

function customerTabFilter(row: CustomerRow, tab: string) {
  if (tab === "all") return true
  return row.status === tab
}

function getCustomerColumns(
  openCustomerSidebar: (row: CustomerRow, mode: "view" | "edit") => void,
  onDelete: (row: CustomerRow) => void,
  onDuplicate: (row: CustomerRow) => void
): ColumnDef<CustomerRow>[] {
  return [
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
      accessorKey: "id",
      header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
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
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <button
          type="button"
          className="text-foreground text-left font-medium hover:underline"
          onClick={() => openCustomerSidebar(row.original, "view")}
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
        <span className="text-muted-foreground text-sm leading-snug whitespace-normal">
          {row.original.description}
        </span>
      ),
      meta: { dataTableFilter: false, cellClassName: "whitespace-normal max-w-xs" },
    },
    {
      accessorKey: "openingBalance",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Opening balance" />
      ),
      cell: ({ row }) => (
        <span className="text-foreground tabular-nums">
          {formatMoney(row.original.openingBalance)}
        </span>
      ),
      meta: { dataTableFilter: false },
    },
    {
      accessorKey: "totalSales",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total sales" />
      ),
      cell: ({ row }) => (
        <span className="text-foreground tabular-nums">
          {formatMoney(row.original.totalSales)}
        </span>
      ),
      meta: { dataTableFilter: false },
    },
    {
      accessorKey: "totalPayments",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total payments" />
      ),
      cell: ({ row }) => (
        <span className="text-foreground tabular-nums">
          {formatMoney(row.original.totalPayments)}
        </span>
      ),
      meta: { dataTableFilter: false },
    },
    {
      id: "balance",
      accessorFn: (row) => Number(computeBalance(row)),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Balance" />
      ),
      cell: ({ row }) => {
        const balance = computeBalance(row.original)
        return (
          <span
            className={
              Number(balance) > 0
                ? "text-orange-600 tabular-nums dark:text-orange-400"
                : "text-muted-foreground tabular-nums"
            }
          >
            {formatMoney(balance)}
          </span>
        )
      },
      meta: { dataTableFilter: false },
    },
    {
      accessorKey: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Phone number" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular-nums text-xs">{row.original.phone}</span>
      ),
      meta: { dataTableFilter: false },
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
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
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <IconDotsVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => openCustomerSidebar(row.original, "view")}>
              <IconEye />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openCustomerSidebar(row.original, "edit")}>
              <IconPencil />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(row.original)}>
              <IconCopy />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(row.original)}>
              <IconTrash />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}

export default function CustomersPage() {
  const {
    customers,
    setCustomers,
    addCustomer,
    updateCustomer,
    removeCustomer,
    duplicateCustomer,
  } = useCustomers()
  const [sidebar, setSidebar] = useState<CustomerSidebarState>(null)

  const closeSidebar = () => setSidebar(null)

  const handleDelete = useCallback(
    async (customer: CustomerRow) => {
      if (
        !(await confirmDeleteAction({
          itemName: customer.name,
          entityLabel: "customer",
        }))
      ) {
        return
      }
      removeCustomer(customer.id)
      if (sidebar?.mode !== "add" && sidebar?.customer.id === customer.id) {
        closeSidebar()
      }
      toast.message(`Removed ${customer.name} (demo).`)
    },
    [removeCustomer, sidebar]
  )

  const handleDuplicate = useCallback(
    async (customer: CustomerRow) => {
      if (
        !(await confirmDuplicateAction({
          itemName: customer.name,
          entityLabel: "customer",
        }))
      ) {
        return
      }
      const copy = duplicateCustomer(customer.id)
      if (copy) toast.success(`Duplicated ${customer.name} (demo).`)
    },
    [duplicateCustomer]
  )

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const fd = new FormData(e.currentTarget)
      const name = String(fd.get("name") ?? "").trim()
      if (!name) {
        toast.error("Customer name is required.")
        return
      }

      if (sidebar?.mode === "add") {
        addCustomer(customerFromFormData(fd, 0))
        toast.success("Customer created (demo).")
        closeSidebar()
        return
      }

      if (sidebar?.mode === "edit" && sidebar.customer) {
        updateCustomer(
          sidebar.customer.id,
          customerFromFormData(fd, sidebar.customer.id)
        )
        toast.success("Customer saved (demo).")
        closeSidebar()
      }
    },
    [sidebar, addCustomer, updateCustomer]
  )

  const columns = useMemo(
    () =>
      getCustomerColumns(
        (row, mode) => setSidebar({ customer: row, mode }),
        handleDelete,
        handleDuplicate
      ),
    [handleDelete, handleDuplicate]
  )

  const sheetCustomer =
    sidebar && sidebar.mode !== "add" ? sidebar.customer : null
  const formCustomer =
    sidebar?.mode === "add" ? EMPTY_CUSTOMER : sheetCustomer ?? EMPTY_CUSTOMER
  const formId =
    sidebar?.mode === "add"
      ? "customer-add-form"
      : sheetCustomer
        ? `customer-edit-${sheetCustomer.id}`
        : "customer-edit"

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
            sidebar?.mode === "view" ? "sm:max-w-lg" : "sm:max-w-md"
          }`}
        >
          {sidebar ? (
            <>
              <SheetHeader className="border-border/60 space-y-1 border-b px-6 py-5 text-left">
                <SheetTitle className="text-lg leading-tight">
                  {sidebar.mode === "add"
                    ? "Add customer"
                    : sidebar.mode === "edit"
                      ? "Edit customer"
                      : sheetCustomer?.name}
                </SheetTitle>
                <SheetDescription>
                  {sidebar.mode === "add" ? (
                    "Fill in customer details and photo. Saving is demo only."
                  ) : sidebar.mode === "edit" && sheetCustomer ? (
                    <>
                      {sheetCustomer.name}
                      <span className="text-muted-foreground"> · ID {sheetCustomer.id}</span>
                    </>
                  ) : sheetCustomer ? (
                    <>
                      ID {sheetCustomer.id}
                      {sheetCustomer.phone ? ` · ${sheetCustomer.phone}` : ""}
                    </>
                  ) : null}
                </SheetDescription>
              </SheetHeader>
              <div
                key={
                  sidebar.mode === "add"
                    ? "add"
                    : `${sheetCustomer?.id}-${sidebar.mode}`
                }
                className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
              >
                {sidebar.mode === "view" && sheetCustomer ? (
                  <CustomerDetail customer={sheetCustomer} />
                ) : sidebar.mode === "edit" || sidebar.mode === "add" ? (
                  <CustomerForm
                    formId={formId}
                    customer={formCustomer}
                    onSubmit={handleSubmit}
                  />
                ) : null}
              </div>
              <SheetFooter className="border-border/60 gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end">
                {sidebar.mode === "view" ? (
                  <>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() =>
                        sheetCustomer &&
                        setSidebar({ mode: "edit", customer: sheetCustomer })
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
                      {sidebar.mode === "add" ? "Create customer" : "Save customer"}
                    </Button>
                  </>
                )}
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <DataTable
        data={customers}
        columns={columns}
        addButtonLabel="New Customer"
        searchPlaceholder="Search customers..."
        importRowMapper={mapImportedCustomer}
        importSampleFilename="customers-sample.csv"
        exportFilename="customers-export.csv"
        onDataChange={setCustomers}
        onAddClick={() => setSidebar({ mode: "add" })}
        defaultColumnVisibility={{ status: false, actions: false }}
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
                  entityLabel: "customer",
                }))
              ) {
                return
              }
              const ids = new Set(selected.map((c) => c.id))
              setCustomers((prev) => prev.filter((r) => !ids.has(r.id)))
              toast.message(
                `Removed ${selected.length} customer${selected.length === 1 ? "" : "s"} (demo).`
              )
            },
          },
        ]}
        tabs={customerTabs}
        defaultTab="all"
        tabFilter={customerTabFilter}
      />
    </>
  )
}
