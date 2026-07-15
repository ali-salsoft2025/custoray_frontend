"use client"

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import {
  IconCopy,
  IconDotsVertical,
  IconEye,
  IconPencil,
  IconReceipt,
  IconRotateClockwise,
  IconTrash,
  IconX,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { OrderDetail } from "@/components/orders/order-detail"
import { OrderForm } from "@/components/orders/order-form"
import { SaleLineDetail } from "@/components/sales/sale-line-detail"
import { SalesViewTableOption } from "@/components/sales/sales-view-toggle"
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
import { InfiniteScrollSelect } from "@/components/ui/infinite-scroll-select"
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
import { useOrders } from "@/context/orders-context"
import { useReturns } from "@/context/returns-context"
import {
  confirmCancelAction,
  confirmDeleteAction,
  confirmDuplicateAction,
  confirmReturnAction,
} from "@/lib/confirm-action"
import {
  loadSalesViewMode,
  saveSalesViewMode,
  type BillItemViewMode,
} from "@/lib/app-preferences"
import { buildSampleCsv } from "@/lib/csv"
import {
  computeBalance,
  computeOrderTotal,
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
import { buildReturnFromOrder } from "@/lib/returns"
import { canCancelDocument, canReturnDocument } from "@/lib/return-eligibility"
import {
  flattenOrdersToSaleLines,
  type SaleLineRow,
} from "@/lib/sales-report"

const salesTabs: DataTableTab[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
]

function salesBillTabFilter(row: OrderRow, tab: string) {
  if (tab === "all") return true
  return row.status === tab
}

function salesLineTabFilter(row: SaleLineRow, tab: string) {
  if (tab === "all") return true
  return row.orderStatus === tab
}

type SaleFormSidebarState =
  | { step: "choose" }
  | { step: "form"; mode: "add" }
  | { step: "form"; mode: "edit"; order: OrderRow }
  | null

function orderWithNewLine(order: OrderRow): OrderRow {
  const lines = order.lines ?? []
  const maxId = lines.reduce((max, line) => Math.max(max, line.id), 0)
  return {
    ...order,
    lines: [
      ...lines,
      {
        id: maxId + 1,
        productName: "",
        quantity: 1,
        unitPrice: "0",
        lineTotal: "0.00",
      },
    ],
  }
}

function selectColumn<T>(): ColumnDef<T> {
  return {
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
  }
}

function srNoColumn<T>(): ColumnDef<T> {
  return {
    id: "srNo",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Sr No" />,
    cell: ({ row, table }) => {
      const { pageIndex, pageSize } = table.getState().pagination
      const srNo = pageIndex * pageSize + row.index + 1
      return (
        <span className="text-muted-foreground font-mono tabular-nums">{srNo}</span>
      )
    },
    enableSorting: false,
    meta: { dataTableFilter: false },
  }
}

function getSalesBillColumns(
  openBillSidebar: (row: OrderRow) => void,
  onEditBill: (row: OrderRow) => void,
  onOpenInvoice: (orderId: number) => void,
  onDuplicate: (row: OrderRow) => void,
  onDelete: (row: OrderRow) => void,
  onReturn: (row: OrderRow) => void,
  onCancel: (row: OrderRow) => void
): ColumnDef<OrderRow>[] {
  return [
    selectColumn<OrderRow>(),
    srNoColumn<OrderRow>(),
    {
      accessorKey: "invoiceNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Invoice #" />
      ),
      cell: ({ row }) => (
        <button
          type="button"
          className="text-foreground text-left font-medium hover:underline"
          onClick={() => openBillSidebar(row.original)}
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
      accessorFn: (row) => (row.lines ?? []).length,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Items" align="center" />
      ),
      cell: ({ row }) => (
        <div className="flex justify-center">
          <span className="text-muted-foreground tabular-nums">
            {(row.original.lines ?? []).length}
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
            <DropdownMenuItem onClick={() => openBillSidebar(row.original)}>
              <IconEye />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditBill(row.original)}>
              <IconPencil />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenInvoice(row.original.id)}>
              <IconReceipt />
              Open invoice
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(row.original)}>
              <IconCopy />
              Duplicate
            </DropdownMenuItem>
            {canReturnDocument(row.original) ? (
              <DropdownMenuItem onClick={() => onReturn(row.original)}>
                <IconRotateClockwise />
                Return
              </DropdownMenuItem>
            ) : null}
            {canCancelDocument(row.original) ? (
              <DropdownMenuItem onClick={() => onCancel(row.original)}>
                <IconX />
                Cancel
              </DropdownMenuItem>
            ) : null}
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

function getSalesLineColumns(
  openLineSidebar: (row: SaleLineRow) => void,
  onEditLine: (row: SaleLineRow) => void,
  onOpenInvoice: (orderId: number) => void,
  onDeleteLine: (row: SaleLineRow) => void,
  onReturnLine: (row: SaleLineRow) => void,
  onCancelLine: (row: SaleLineRow) => void,
  resolveOrder: (line: SaleLineRow) => OrderRow | undefined
): ColumnDef<SaleLineRow>[] {
  return [
    selectColumn<SaleLineRow>(),
    srNoColumn<SaleLineRow>(),
    {
      accessorKey: "invoiceNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Invoice #" />
      ),
      cell: ({ row }) => (
        <button
          type="button"
          className="text-foreground text-left font-medium hover:underline"
          onClick={() => openLineSidebar(row.original)}
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
      accessorKey: "productName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Item" />
      ),
      cell: ({ row }) => (
        <button
          type="button"
          className="text-foreground max-w-[14rem] truncate text-left font-medium hover:underline"
          onClick={() => openLineSidebar(row.original)}
        >
          {row.original.productName}
        </button>
      ),
      enableHiding: false,
      meta: { dataTableFilter: false },
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Qty" align="center" />
      ),
      cell: ({ row }) => (
        <div className="flex justify-center">
          <span className="text-foreground tabular-nums">{row.original.quantity}</span>
        </div>
      ),
      meta: { dataTableFilter: false },
    },
    {
      accessorKey: "unitPrice",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Unit price" align="center" />
      ),
      cell: ({ row }) => (
        <div className="flex justify-center">
          <span className="text-muted-foreground tabular-nums">
            {formatMoney(row.original.unitPrice)}
          </span>
        </div>
      ),
      meta: { dataTableFilter: false },
    },
    {
      accessorKey: "lineTotal",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Line total" align="center" />
      ),
      cell: ({ row }) => (
        <div className="flex justify-center">
          <span className="text-foreground tabular-nums">
            {formatMoney(row.original.lineTotal)}
          </span>
        </div>
      ),
      meta: { dataTableFilter: false },
    },
    {
      accessorKey: "orderStatus",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <Badge variant="outline" className={statusBadgeClass(row.original.orderStatus)}>
          {statusLabel(row.original.orderStatus)}
        </Badge>
      ),
      meta: { dataTableFilter: false },
    },
    {
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => {
        const parent = resolveOrder(row.original)
        return (
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
            <DropdownMenuItem onClick={() => openLineSidebar(row.original)}>
              <IconEye />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditLine(row.original)}>
              <IconPencil />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenInvoice(row.original.orderId)}>
              <IconReceipt />
              Open invoice
            </DropdownMenuItem>
            {parent && canReturnDocument(parent) ? (
              <DropdownMenuItem onClick={() => onReturnLine(row.original)}>
                <IconRotateClockwise />
                Return
              </DropdownMenuItem>
            ) : null}
            {parent && canCancelDocument(parent) ? (
              <DropdownMenuItem onClick={() => onCancelLine(row.original)}>
                <IconX />
                Cancel
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDeleteLine(row.original)}
            >
              <IconTrash />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        )
      },
    },
  ]
}

export default function SalesReportPage() {
  const router = useRouter()
  const { orders, setOrders, getOrder, addOrder, updateOrder, removeOrder, duplicateOrder } =
    useOrders()
  const { addReturn } = useReturns()
  const [viewMode, setViewMode] = useState<BillItemViewMode>("item")
  const [viewSaleLine, setViewSaleLine] = useState<SaleLineRow | null>(null)
  const [viewOrder, setViewOrder] = useState<OrderRow | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState("")
  const [saleFormSidebar, setSaleFormSidebar] = useState<SaleFormSidebarState>(null)

  useEffect(() => {
    setViewMode(loadSalesViewMode())
  }, [])

  const saleLines = useMemo(() => flattenOrdersToSaleLines(orders), [orders])

  const handleViewModeChange = useCallback((mode: BillItemViewMode) => {
    setViewMode(mode)
    saveSalesViewMode(mode)
    if (mode === "item") {
      setViewOrder(null)
    } else {
      setViewSaleLine(null)
    }
  }, [])

  const salesTableOptions = useMemo(
    () => (
      <SalesViewTableOption value={viewMode} onValueChange={handleViewModeChange} />
    ),
    [viewMode, handleViewModeChange]
  )

  const openLineSidebar = useCallback((row: SaleLineRow) => {
    setViewSaleLine(row)
  }, [])

  const openBillSidebar = useCallback((row: OrderRow) => {
    setViewOrder(row)
  }, [])

  const onOpenInvoice = useCallback(
    (orderId: number) => {
      if (getOrder(orderId)) {
        router.push("/documents/sales-invoice")
      }
    },
    [getOrder, router]
  )

  const openInvoiceFromLine = useCallback(
    (orderId: number) => {
      const order = getOrder(orderId)
      if (!order) return
      setViewSaleLine(null)
      setViewMode("bill")
      saveSalesViewMode("bill")
      setViewOrder(order)
    },
    [getOrder]
  )

  const openEditBill = useCallback((order: OrderRow) => {
    setViewOrder(null)
    setViewSaleLine(null)
    setSaleFormSidebar({ step: "form", mode: "edit", order })
  }, [])

  const openEditLine = useCallback(
    (line: SaleLineRow) => {
      const order = getOrder(line.orderId)
      if (!order) return
      setViewSaleLine(null)
      setSaleFormSidebar({ step: "form", mode: "edit", order })
    },
    [getOrder]
  )

  const handleDeleteBill = useCallback(
    async (order: OrderRow) => {
      if (
        !(await confirmDeleteAction({
          itemName: order.invoiceNumber,
          entityLabel: "sale",
        }))
      ) {
        return
      }
      removeOrder(order.id)
      if (viewOrder?.id === order.id) setViewOrder(null)
      if (
        saleFormSidebar?.step === "form" &&
        saleFormSidebar.mode === "edit" &&
        saleFormSidebar.order.id === order.id
      ) {
        setSaleFormSidebar(null)
      }
      toast.message(`Removed ${order.invoiceNumber} (demo).`)
    },
    [removeOrder, saleFormSidebar, viewOrder]
  )

  const handleDuplicateBill = useCallback(
    async (order: OrderRow) => {
      if (
        !(await confirmDuplicateAction({
          itemName: order.invoiceNumber,
          entityLabel: "sale",
        }))
      ) {
        return
      }
      const copy = duplicateOrder(order.id)
      if (copy) toast.success(`Duplicated ${order.invoiceNumber} (demo).`)
    },
    [duplicateOrder]
  )

  const handleDeleteSaleLines = useCallback(
    async (selected: SaleLineRow[]) => {
      if (
        !(await confirmDeleteAction({
          count: selected.length,
          entityLabel: "sale line item",
        }))
      ) {
        return
      }

      const selectedKeys = new Set(selected.map((line) => line.id))
      setOrders((prev) =>
        prev
          .map((order) => {
            const remaining = (order.lines ?? []).filter(
              (line) => !selectedKeys.has(`${order.id}-${line.id}`)
            )
            if (remaining.length === (order.lines ?? []).length) return order
            if (remaining.length === 0) return null
            return {
              ...order,
              lines: remaining,
              totalAmount: computeOrderTotal(remaining),
            }
          })
          .filter((order): order is OrderRow => order !== null)
      )

      if (viewSaleLine && selectedKeys.has(viewSaleLine.id)) {
        setViewSaleLine(null)
      }

      toast.message(
        `Removed ${selected.length} line item${selected.length === 1 ? "" : "s"} (demo).`
      )
    },
    [setOrders, viewSaleLine]
  )

  const handleDeleteSaleLine = useCallback(
    (line: SaleLineRow) => {
      void handleDeleteSaleLines([line])
    },
    [handleDeleteSaleLines]
  )

  const handleReturnBill = useCallback(
    async (order: OrderRow) => {
      if (!canReturnDocument(order)) {
        toast.error("Only completed paid sales can be returned.")
        return
      }
      const draft = buildReturnFromOrder(order)
      if (
        !(await confirmReturnAction({
          scope: "invoice",
          itemName: order.invoiceNumber,
          totalAmount: draft.totalAmount,
          refundDue: draft.refundDue,
        }))
      ) {
        return
      }
      const created = addReturn({ ...draft, status: "completed" }, {
        getOrder,
        onApplySales: updateOrder,
      })
      toast.success(`Return ${created.returnNumber} recorded for ${order.invoiceNumber}.`)
      if (viewOrder?.id === order.id) {
        setViewOrder(getOrder(order.id) ?? null)
      }
    },
    [addReturn, getOrder, updateOrder, viewOrder]
  )

  const handleReturnLine = useCallback(
    async (line: SaleLineRow) => {
      const order = getOrder(line.orderId)
      if (!order) {
        toast.error("Source invoice not found.")
        return
      }
      if (!canReturnDocument(order)) {
        toast.error("Only completed paid sales can be returned.")
        return
      }
      const draft = buildReturnFromOrder(order, { lineIds: [line.lineId] })
      if (
        !(await confirmReturnAction({
          scope: "item",
          itemName: line.productName,
          referenceNumber: order.invoiceNumber,
          totalAmount: draft.totalAmount,
          refundDue: draft.refundDue,
        }))
      ) {
        return
      }
      const created = addReturn({ ...draft, status: "completed" }, {
        getOrder,
        onApplySales: updateOrder,
      })
      toast.success(`Return ${created.returnNumber} recorded for ${line.productName}.`)
      if (viewSaleLine?.lineId === line.lineId) {
        setViewSaleLine(null)
      }
    },
    [addReturn, getOrder, updateOrder, viewSaleLine]
  )

  const handleCancelBill = useCallback(
    async (order: OrderRow) => {
      if (!canCancelDocument(order)) return
      if (
        !(await confirmCancelAction({
          itemName: order.invoiceNumber,
          entityLabel: "sale",
        }))
      ) {
        return
      }
      updateOrder(order.id, { status: "cancelled" })
      if (viewOrder?.id === order.id) setViewOrder(null)
      toast.success(`${order.invoiceNumber} cancelled.`)
    },
    [updateOrder, viewOrder]
  )

  const handleCancelLine = useCallback(
    async (line: SaleLineRow) => {
      const order = getOrder(line.orderId)
      if (!order || !canCancelDocument(order)) {
        toast.error("Only pending unpaid sales can be cancelled.")
        return
      }
      if (
        !(await confirmCancelAction({
          itemName: order.invoiceNumber,
          entityLabel: "sale",
        }))
      ) {
        return
      }
      updateOrder(order.id, { status: "cancelled" })
      if (viewSaleLine?.orderId === order.id) setViewSaleLine(null)
      toast.success(`${order.invoiceNumber} cancelled.`)
    },
    [getOrder, updateOrder, viewSaleLine]
  )

  const resolveOrderForLine = useCallback(
    (line: SaleLineRow) => getOrder(line.orderId),
    [getOrder]
  )

  const handleBulkDeleteBills = useCallback(
    async (selected: OrderRow[]) => {
      if (
        !(await confirmDeleteAction({
          count: selected.length,
          entityLabel: "sale",
        }))
      ) {
        return
      }
      const ids = new Set(selected.map((row) => row.id))
      setOrders((prev) => prev.filter((row) => !ids.has(row.id)))
      if (viewOrder && ids.has(viewOrder.id)) setViewOrder(null)
      toast.message(
        `Removed ${selected.length} sale${selected.length === 1 ? "" : "s"} (demo).`
      )
    },
    [setOrders, viewOrder]
  )

  const billColumns = useMemo(
    () =>
      getSalesBillColumns(
        openBillSidebar,
        openEditBill,
        onOpenInvoice,
        handleDuplicateBill,
        handleDeleteBill,
        handleReturnBill,
        handleCancelBill
      ),
    [
      openBillSidebar,
      openEditBill,
      onOpenInvoice,
      handleDuplicateBill,
      handleDeleteBill,
      handleReturnBill,
      handleCancelBill,
    ]
  )

  const lineColumns = useMemo(
    () =>
      getSalesLineColumns(
        openLineSidebar,
        openEditLine,
        onOpenInvoice,
        handleDeleteSaleLine,
        handleReturnLine,
        handleCancelLine,
        resolveOrderForLine
      ),
    [
      openLineSidebar,
      openEditLine,
      onOpenInvoice,
      handleDeleteSaleLine,
      handleReturnLine,
      handleCancelLine,
      resolveOrderForLine,
    ]
  )

  const invoiceOptions = useMemo(
    () =>
      orders.map((order) => ({
        value: String(order.id),
        label: order.invoiceNumber,
        description: order.customerName,
        trailing: formatDate(order.orderDate),
      })),
    [orders]
  )

  const openAddSaleSidebar = useCallback(() => {
    setSelectedOrderId("")
    setSaleFormSidebar({ step: "choose" })
  }, [])

  const openNewInvoiceSale = useCallback(() => {
    setSaleFormSidebar({ step: "form", mode: "add" })
  }, [])

  const openExistingInvoiceSale = useCallback(() => {
    const order = getOrder(Number(selectedOrderId))
    if (!order) {
      toast.error("Select an invoice first.")
      return
    }
    setSaleFormSidebar({ step: "form", mode: "edit", order: orderWithNewLine(order) })
  }, [getOrder, selectedOrderId])

  const closeSaleFormSidebar = useCallback(() => {
    setSaleFormSidebar(null)
    setSelectedOrderId("")
  }, [])

  const handleImportSales = useCallback(
    (rows: Record<string, string>[]) => {
      let added = 0
      setOrders((prev) => {
        let acc = [...prev]
        for (const row of rows) {
          const mapped = mapImportedOrder(row, acc)
          if (mapped) {
            acc = [...acc, mapped]
            added++
          }
        }
        return acc
      })
      return added
    },
    [setOrders]
  )

  const salesImportSampleCsv = useMemo(() => {
    const example = orders[0] as Record<string, unknown> | undefined
    if (!example) return undefined
    return buildSampleCsv(
      [
        "invoiceNumber",
        "customerName",
        "orderDate",
        "productName",
        "quantity",
        "unitPrice",
        "totalAmount",
        "paidAmount",
        "status",
      ],
      {
        invoiceNumber: example.invoiceNumber ?? "INV-1006",
        customerName: example.customerName ?? "Sample customer",
        orderDate: example.orderDate ?? "2026-01-15",
        productName: "Sample product",
        quantity: "2",
        unitPrice: "500.00",
        totalAmount: example.totalAmount ?? "1000.00",
        paidAmount: example.paidAmount ?? "0.00",
        status: example.status ?? "pending",
      }
    )
  }, [orders])

  const handleSaleFormSubmit = useCallback(
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
        saleFormSidebar?.step === "form" && saleFormSidebar.mode === "edit"
          ? saleFormSidebar.order.id
          : 0
      )
      if (parsed.lines.length === 0 || !parsed.lines.some((line) => line.productName.trim())) {
        toast.error("Add at least one line item with a product name.")
        return
      }

      if (saleFormSidebar?.step === "form" && saleFormSidebar.mode === "add") {
        addOrder(parsed)
        toast.success("Sale recorded on new invoice (demo).")
        closeSaleFormSidebar()
        return
      }

      if (
        saleFormSidebar?.step === "form" &&
        saleFormSidebar.mode === "edit"
      ) {
        updateOrder(saleFormSidebar.order.id, parsed)
        toast.success("Sale added to invoice (demo).")
        closeSaleFormSidebar()
      }
    },
    [saleFormSidebar, addOrder, updateOrder, closeSaleFormSidebar]
  )

  const formOrder =
    saleFormSidebar?.step === "form" && saleFormSidebar.mode === "add"
      ? { ...EMPTY_ORDER, invoiceNumber: nextInvoiceNumber(orders) }
      : saleFormSidebar?.step === "form" && saleFormSidebar.mode === "edit"
        ? saleFormSidebar.order
        : EMPTY_ORDER
  const saleFormId =
    saleFormSidebar?.step === "form" && saleFormSidebar.mode === "add"
      ? "sale-add-form"
      : saleFormSidebar?.step === "form" && saleFormSidebar.mode === "edit"
        ? `sale-edit-${saleFormSidebar.order.id}`
        : "sale-edit"

  return (
    <>
      <Sheet
        open={saleFormSidebar !== null}
        onOpenChange={(open) => {
          if (!open) closeSaleFormSidebar()
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
        >
          {saleFormSidebar ? (
            <>
              <SheetHeader className="border-border/60 space-y-1 border-b px-6 py-5 text-left">
                <SheetTitle className="text-lg leading-tight">
                  {saleFormSidebar.step === "choose"
                    ? "Add sale"
                    : saleFormSidebar.mode === "add"
                      ? "New invoice"
                      : "Add to invoice"}
                </SheetTitle>
                <SheetDescription>
                  {saleFormSidebar.step === "choose" ? (
                    "Record a sale on a new invoice or add line items to an existing one."
                  ) : saleFormSidebar.mode === "add" ? (
                    "Create a new invoice and record line items."
                  ) : (
                    `${saleFormSidebar.order.invoiceNumber} · ${saleFormSidebar.order.customerName}`
                  )}
                </SheetDescription>
              </SheetHeader>
              <div
                key={
                  saleFormSidebar.step === "choose"
                    ? "choose"
                    : saleFormSidebar.mode === "add"
                      ? "add"
                      : `edit-${saleFormSidebar.order.id}`
                }
                className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
              >
                {saleFormSidebar.step === "choose" ? (
                  <div className="flex flex-col gap-4 text-sm">
                    <Button type="button" variant="outline" onClick={openNewInvoiceSale}>
                      New invoice
                    </Button>
                    <div className="border-border/60 flex flex-col gap-2 border-t pt-4">
                      <Label htmlFor="add-sale-invoice">Existing invoice</Label>
                      <InfiniteScrollSelect
                        id="add-sale-invoice"
                        value={selectedOrderId}
                        onValueChange={setSelectedOrderId}
                        options={invoiceOptions}
                        placeholder="Select invoice"
                        searchPlaceholder="Search invoices…"
                        emptyMessage="No invoices found."
                        pageSize={10}
                      />
                      <Button
                        type="button"
                        className="mt-1"
                        disabled={!selectedOrderId}
                        onClick={openExistingInvoiceSale}
                      >
                        Add to selected invoice
                      </Button>
                    </div>
                  </div>
                ) : (
                  <OrderForm
                    formId={saleFormId}
                    order={formOrder}
                    onSubmit={handleSaleFormSubmit}
                  />
                )}
              </div>
              <SheetFooter className="border-border/60 gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end">
                {saleFormSidebar.step === "choose" ? (
                  <SheetClose asChild>
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  </SheetClose>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => {
                        setSelectedOrderId("")
                        setSaleFormSidebar({ step: "choose" })
                      }}
                    >
                      Back
                    </Button>
                    <SheetClose asChild>
                      <Button variant="outline" type="button">
                        Cancel
                      </Button>
                    </SheetClose>
                    <Button type="submit" form={saleFormId}>
                      {saleFormSidebar.mode === "add" ? "Create invoice" : "Save invoice"}
                    </Button>
                  </>
                )}
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet
        open={viewSaleLine !== null}
        onOpenChange={(open) => {
          if (!open) setViewSaleLine(null)
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
        >
          {viewSaleLine ? (
            <>
              <SheetHeader className="border-border/60 space-y-1 border-b px-6 py-5 text-left">
                <SheetTitle className="text-lg leading-tight">
                  {viewSaleLine.productName}
                </SheetTitle>
                <SheetDescription>
                  {viewSaleLine.invoiceNumber}
                  <span className="text-muted-foreground">
                    {" "}
                    · {viewSaleLine.customerName}
                  </span>
                </SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <SaleLineDetail saleLine={viewSaleLine} />
              </div>
              <SheetFooter className="border-border/60 gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => openInvoiceFromLine(viewSaleLine.orderId)}
                >
                  Open invoice
                </Button>
                <SheetClose asChild>
                  <Button className="w-full sm:w-auto">Close</Button>
                </SheetClose>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet
        open={viewOrder !== null}
        onOpenChange={(open) => {
          if (!open) setViewOrder(null)
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
        >
          {viewOrder ? (
            <>
              <SheetHeader className="border-border/60 space-y-1 border-b px-6 py-5 text-left">
                <SheetTitle className="text-lg leading-tight">
                  {viewOrder.invoiceNumber}
                </SheetTitle>
                <SheetDescription>
                  {viewOrder.customerName}
                  <span className="text-muted-foreground">
                    {" "}
                    · {formatDate(viewOrder.orderDate)}
                  </span>
                </SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <OrderDetail order={viewOrder} />
              </div>
              <SheetFooter className="border-border/60 gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => onOpenInvoice(viewOrder.id)}
                >
                  Open invoice
                </Button>
                <SheetClose asChild>
                  <Button className="w-full sm:w-auto">Close</Button>
                </SheetClose>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {viewMode === "bill" ? (
        <DataTable
          data={orders}
          columns={billColumns}
          searchPlaceholder="Search sales by invoice, customer…"
          exportFilename="sales-bills-export.csv"
          addButtonLabel="New Sale"
          onAddClick={openAddSaleSidebar}
          importSampleFilename="sales-sample.csv"
          importSampleCsvContent={salesImportSampleCsv}
          onImportRows={handleImportSales}
          tableOptionsExtra={salesTableOptions}
          bulkActions={[
            {
              id: "delete",
              label: "Delete selected",
              icon: <IconTrash className="size-4" />,
              variant: "destructive",
              onClick: handleBulkDeleteBills,
            },
          ]}
          tabs={salesTabs}
          defaultTab="all"
          tabFilter={salesBillTabFilter}
        />
      ) : (
        <DataTable
          data={saleLines}
          columns={lineColumns}
          searchPlaceholder="Search sales by item, customer, invoice…"
          exportFilename="sales-items-export.csv"
          addButtonLabel="New Sale"
          onAddClick={openAddSaleSidebar}
          importSampleFilename="sales-sample.csv"
          importSampleCsvContent={salesImportSampleCsv}
          onImportRows={handleImportSales}
          tableOptionsExtra={salesTableOptions}
          bulkActions={[
            {
              id: "delete",
              label: "Delete selected",
              icon: <IconTrash className="size-4" />,
              variant: "destructive",
              onClick: handleDeleteSaleLines,
            },
          ]}
          tabs={salesTabs}
          defaultTab="all"
          tabFilter={salesLineTabFilter}
        />
      )}
    </>
  )
}
