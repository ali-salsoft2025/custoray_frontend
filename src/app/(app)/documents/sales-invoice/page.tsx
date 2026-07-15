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

import { OrderDetail } from "@/components/orders/order-detail"
import { OrderForm } from "@/components/orders/order-form"
import { DataTableColumnHeader } from "@/components/data-table-column-header"
import { DataTable, type DataTableTab } from "@/components/data-table"
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
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useOrders } from "@/context/orders-context"
import {
  confirmDeleteAction,
  confirmDuplicateAction,
} from "@/lib/confirm-action"
import {
  computeBalance,
  EMPTY_ORDER,
  formatDate,
  formatMoney,
  mapImportedOrder,
  nextInvoiceNumber,
  orderFromFormData,
  statusBadgeClass,
  statusLabel,
  type OrderRow,
} from "@/lib/orders"

const invoiceTabs: DataTableTab[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
]

type InvoiceSidebarState =
  | { mode: "view"; order: OrderRow }
  | { mode: "edit"; order: OrderRow }
  | { mode: "add" }
  | null

function invoiceTabFilter(row: OrderRow, tab: string) {
  if (tab === "all") return true
  return row.status === tab
}

function getInvoiceColumns(
  openInvoiceSidebar: (row: OrderRow, mode: "view" | "edit") => void,
  onDelete: (row: OrderRow) => void,
  onDuplicate: (row: OrderRow) => void
): ColumnDef<OrderRow>[] {
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
      accessorKey: "invoiceNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Invoice #" />
      ),
      cell: ({ row }) => (
        <button
          type="button"
          className="text-foreground text-left font-medium hover:underline"
          onClick={() => openInvoiceSidebar(row.original, "view")}
        >
          {row.original.invoiceNumber}
        </button>
      ),
      enableHiding: false,
      meta: { dataTableFilter: false },
    },
    {
      accessorKey: "customerName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Customer" />
      ),
      cell: ({ row }) => (
        <span className="text-foreground max-w-[10rem] truncate">
          {row.original.customerName}
        </span>
      ),
      meta: { dataTableFilter: false },
    },
    {
      id: "items",
      accessorFn: (row) => row.lines.length,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Items" align="center" />
      ),
      cell: ({ row }) => (
        <div className="flex justify-center">
          <span className="text-muted-foreground tabular-nums">
            {row.original.lines.length}
          </span>
        </div>
      ),
      meta: { dataTableFilter: false },
    },
    {
      accessorKey: "orderDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular-nums text-xs">
          {formatDate(row.original.orderDate)}
        </span>
      ),
      meta: { dataTableFilter: false },
    },
    {
      accessorKey: "totalAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total amount" align="center" />
      ),
      cell: ({ row }) => (
        <div className="flex justify-center">
          <span className="text-foreground tabular-nums">
            {formatMoney(row.original.totalAmount)}
          </span>
        </div>
      ),
      meta: { dataTableFilter: false },
    },
    {
      accessorKey: "paidAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Paid amount" align="center" />
      ),
      cell: ({ row }) => (
        <div className="flex justify-center">
          <span className="text-foreground tabular-nums">
            {formatMoney(row.original.paidAmount)}
          </span>
        </div>
      ),
      meta: { dataTableFilter: false },
    },
    {
      id: "balance",
      accessorFn: (row) => Number(computeBalance(row)),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Balance" align="center" />
      ),
      cell: ({ row }) => {
        const balance = computeBalance(row.original)
        return (
          <div className="flex justify-center">
            <span
              className={
                Number(balance) > 0
                  ? "text-amber-700 tabular-nums dark:text-amber-400"
                  : "text-muted-foreground tabular-nums"
              }
            >
              {formatMoney(balance)}
            </span>
          </div>
        )
      },
      meta: { dataTableFilter: false },
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <Badge variant="outline" className={statusBadgeClass(row.original.status)}>
          {statusLabel(row.original.status)}
        </Badge>
      ),
      meta: { dataTableFilter: false },
    },
    {
      id: "actions",
      enableSorting: false,
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
            <DropdownMenuItem onClick={() => openInvoiceSidebar(row.original, "view")}>
              <IconEye />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openInvoiceSidebar(row.original, "edit")}>
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

export default function SalesInvoicePage() {
  const { orders, setOrders, addOrder, updateOrder, removeOrder, duplicateOrder } =
    useOrders()
  const [sidebar, setSidebar] = useState<InvoiceSidebarState>(null)

  const closeSidebar = () => setSidebar(null)

  const handleDelete = useCallback(
    async (order: OrderRow) => {
      if (
        !(await confirmDeleteAction({
          itemName: order.invoiceNumber,
          entityLabel: "sales invoice",
        }))
      ) {
        return
      }
      removeOrder(order.id)
      if (sidebar?.mode !== "add" && sidebar?.order.id === order.id) {
        closeSidebar()
      }
      toast.message(`Removed ${order.invoiceNumber} (demo).`)
    },
    [removeOrder, sidebar]
  )

  const handleDuplicate = useCallback(
    async (order: OrderRow) => {
      if (
        !(await confirmDuplicateAction({
          itemName: order.invoiceNumber,
          entityLabel: "sales invoice",
        }))
      ) {
        return
      }
      const copy = duplicateOrder(order.id)
      if (copy) toast.success(`Duplicated ${order.invoiceNumber} (demo).`)
    },
    [duplicateOrder]
  )

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const fd = new FormData(e.currentTarget)
      const customerName = String(fd.get("customerName") ?? "").trim()
      if (!customerName) {
        toast.error("Customer name is required.")
        return
      }

      const parsed = orderFromFormData(
        fd,
        sidebar?.mode === "edit" && sidebar.order ? sidebar.order.id : 0
      )
      if (parsed.lines.length === 0 || !parsed.lines.some((l) => l.productName.trim())) {
        toast.error("Add at least one line item with a product name.")
        return
      }

      if (sidebar?.mode === "add") {
        addOrder(parsed)
        toast.success("Sales invoice created (demo).")
        closeSidebar()
        return
      }

      if (sidebar?.mode === "edit" && sidebar.order) {
        updateOrder(sidebar.order.id, parsed)
        toast.success("Sales invoice saved (demo).")
        closeSidebar()
      }
    },
    [sidebar, addOrder, updateOrder]
  )

  const columns = useMemo(
    () =>
      getInvoiceColumns(
        (row, mode) => setSidebar({ order: row, mode }),
        handleDelete,
        handleDuplicate
      ),
    [handleDelete, handleDuplicate]
  )

  const sheetOrder = sidebar && sidebar.mode !== "add" ? sidebar.order : null
  const formOrder =
    sidebar?.mode === "add"
      ? { ...EMPTY_ORDER, invoiceNumber: nextInvoiceNumber(orders) }
      : sheetOrder ?? EMPTY_ORDER
  const formId =
    sidebar?.mode === "add"
      ? "sales-invoice-add-form"
      : sheetOrder
        ? `sales-invoice-edit-${sheetOrder.id}`
        : "sales-invoice-edit"

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
          className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
        >
          {sidebar ? (
            <>
              <SheetHeader className="border-border/60 space-y-1 border-b px-6 py-5 text-left">
                <SheetTitle className="text-lg leading-tight">
                  {sidebar.mode === "add"
                    ? "Create sales invoice"
                    : sidebar.mode === "edit"
                      ? "Edit sales invoice"
                      : sheetOrder?.invoiceNumber}
                </SheetTitle>
                <SheetDescription>
                  {sidebar.mode === "add" ? (
                    "Add customer, line items, and payment details. Saving is demo only."
                  ) : sidebar.mode === "edit" && sheetOrder ? (
                    <>
                      {sheetOrder.invoiceNumber}
                      <span className="text-muted-foreground"> · ID {sheetOrder.id}</span>
                    </>
                  ) : sheetOrder ? (
                    <>
                      {sheetOrder.customerName}
                      <span className="text-muted-foreground">
                        {" "}
                        · {formatDate(sheetOrder.orderDate)}
                      </span>
                    </>
                  ) : null}
                </SheetDescription>
              </SheetHeader>
              <div
                key={
                  sidebar.mode === "add"
                    ? "add"
                    : `${sheetOrder?.id}-${sidebar.mode}`
                }
                className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
              >
                {sidebar.mode === "view" && sheetOrder ? (
                  <OrderDetail order={sheetOrder} />
                ) : sidebar.mode === "edit" || sidebar.mode === "add" ? (
                  <OrderForm formId={formId} order={formOrder} onSubmit={handleSubmit} />
                ) : null}
              </div>
              <SheetFooter className="border-border/60 gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end">
                {sidebar.mode === "view" ? (
                  <>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() =>
                        sheetOrder && setSidebar({ mode: "edit", order: sheetOrder })
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
                      {sidebar.mode === "add" ? "Create invoice" : "Save invoice"}
                    </Button>
                  </>
                )}
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <DataTable
        data={orders}
        columns={columns}
        addButtonLabel="New Sales Invoice"
        searchPlaceholder="Search sales invoices..."
        importRowMapper={mapImportedOrder}
        importSampleFilename="sales-invoices-sample.csv"
        exportFilename="sales-invoices-export.csv"
        onDataChange={setOrders}
        onAddClick={() => setSidebar({ mode: "add" })}
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
                  entityLabel: "sales invoice",
                }))
              ) {
                return
              }
              const ids = new Set(selected.map((s) => s.id))
              setOrders((prev) => prev.filter((r) => !ids.has(r.id)))
              toast.message(
                `Removed ${selected.length} sales invoice${selected.length === 1 ? "" : "s"} (demo).`
              )
            },
          },
        ]}
        tabs={invoiceTabs}
        defaultTab="all"
        tabFilter={invoiceTabFilter}
      />
    </>
  )
}
