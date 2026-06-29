"use client"

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import { ColumnDef } from "@tanstack/react-table"
import {
  IconCopy,
  IconDotsVertical,
  IconEye,
  IconFileInvoice,
  IconPencil,
  IconRotateClockwise,
  IconTrash,
  IconX,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { PurchaseDetail } from "@/components/purchases/purchase-detail"
import { PurchaseForm } from "@/components/purchases/purchase-form"
import { PurchaseLineDetail } from "@/components/purchases/purchase-line-detail"
import { PurchaseStatusBadge } from "@/components/purchases/purchase-status-badge"
import { PurchaseViewTableOption } from "@/components/purchases/purchase-view-toggle"
import { ReturnCreateSheet } from "@/components/returns/return-create-sheet"
import { DataTableColumnHeader } from "@/components/data-table-column-header"
import { DataTable, type DataTableTab } from "@/components/data-table"
import { StatCard, StatCardsGrid, sumNumericField } from "@/components/stat-card"
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
import { usePurchases } from "@/context/purchases-context"
import {
  loadPurchaseViewMode,
  savePurchaseViewMode,
  type BillItemViewMode,
} from "@/lib/app-preferences"
import {
  confirmCancelAction,
  confirmDeleteAction,
  confirmDuplicateAction,
} from "@/lib/confirm-action"
import { buildSampleCsv } from "@/lib/csv"
import {
  computeBalance,
  computePurchaseTotal,
  EMPTY_PURCHASE,
  formatDate,
  formatMoney,
  mapImportedPurchase,
  nextPurchaseNumber,
  purchaseFromFormData,
  type PurchaseRow,
} from "@/lib/purchases"
import {
  flattenPurchasesToLines,
  type PurchaseLineReportRow,
} from "@/lib/purchases-report"
import { buildReturnFromPurchase, type ReturnRow } from "@/lib/returns"
import { canCancelDocument, canReturnDocument } from "@/lib/return-eligibility"

const purchaseTabs: DataTableTab[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
]

type PurchaseSidebarState =
  | { mode: "view"; purchase: PurchaseRow }
  | { mode: "edit"; purchase: PurchaseRow }
  | { mode: "add" }
  | null

function purchaseTabFilter(row: PurchaseRow, tab: string) {
  if (tab === "all") return true
  return row.status === tab
}

function purchaseLineTabFilter(row: PurchaseLineReportRow, tab: string) {
  if (tab === "all") return true
  return row.purchaseStatus === tab
}

function getPurchaseColumns(
  openPurchaseSidebar: (row: PurchaseRow, mode: "view" | "edit") => void,
  onDelete: (row: PurchaseRow) => void,
  onDuplicate: (row: PurchaseRow) => void,
  onReturn: (row: PurchaseRow) => void,
  onCancel: (row: PurchaseRow) => void
): ColumnDef<PurchaseRow>[] {
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
    },
    {
      accessorKey: "purchaseNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="PO #" />
      ),
      cell: ({ row }) => (
        <button
          type="button"
          className="text-foreground text-left font-medium hover:underline"
          onClick={() => openPurchaseSidebar(row.original, "view")}
        >
          {row.original.purchaseNumber}
        </button>
      ),
      enableHiding: false,
      meta: { dataTableFilter: false },
    },
    {
      accessorKey: "vendorName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Vendor" />
      ),
      cell: ({ row }) => (
        <span className="text-foreground max-w-[10rem] truncate">
          {row.original.vendorName}
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
      accessorKey: "purchaseDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular-nums text-xs">
          {formatDate(row.original.purchaseDate)}
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
      cell: ({ row }) => <PurchaseStatusBadge status={row.original.status} />,
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
            <DropdownMenuItem onClick={() => openPurchaseSidebar(row.original, "view")}>
              <IconEye />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openPurchaseSidebar(row.original, "edit")}>
              <IconPencil />
              Edit
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

function getPurchaseLineColumns(
  openLineSidebar: (row: PurchaseLineReportRow) => void,
  onEditLine: (row: PurchaseLineReportRow) => void,
  onOpenPurchase: (purchaseId: number) => void,
  onDeleteLine: (row: PurchaseLineReportRow) => void,
  onReturnLine: (row: PurchaseLineReportRow) => void,
  onCancelLine: (row: PurchaseLineReportRow) => void,
  resolvePurchase: (line: PurchaseLineReportRow) => PurchaseRow | undefined
): ColumnDef<PurchaseLineReportRow>[] {
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
    },
    {
      accessorKey: "purchaseNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="PO #" />
      ),
      cell: ({ row }) => (
        <button
          type="button"
          className="text-foreground text-left font-medium hover:underline"
          onClick={() => openLineSidebar(row.original)}
        >
          {row.original.purchaseNumber}
        </button>
      ),
      enableHiding: false,
      meta: { dataTableFilter: false },
    },
    {
      accessorKey: "vendorName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Vendor" />
      ),
      cell: ({ row }) => (
        <span className="text-foreground max-w-[10rem] truncate">
          {row.original.vendorName}
        </span>
      ),
      meta: { dataTableFilter: false },
    },
    {
      accessorKey: "purchaseDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular-nums text-xs">
          {formatDate(row.original.purchaseDate)}
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
      accessorKey: "purchaseStatus",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <PurchaseStatusBadge status={row.original.purchaseStatus} />
      ),
      meta: { dataTableFilter: false },
    },
    {
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => {
        const parent = resolvePurchase(row.original)
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
            <DropdownMenuItem onClick={() => onOpenPurchase(row.original.purchaseId)}>
              <IconFileInvoice />
              Open purchase
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

export default function PurchasesPage() {
  const {
    purchases,
    setPurchases,
    addPurchase,
    updatePurchase,
    removePurchase,
    duplicatePurchase,
    getPurchase,
  } = usePurchases()
  const [viewMode, setViewMode] = useState<BillItemViewMode>("bill")
  const [sidebar, setSidebar] = useState<PurchaseSidebarState>(null)
  const [viewLine, setViewLine] = useState<PurchaseLineReportRow | null>(null)
  const [returnDraft, setReturnDraft] = useState<Omit<ReturnRow, "id"> | null>(null)

  useEffect(() => {
    setViewMode(loadPurchaseViewMode())
  }, [])

  const purchaseLines = useMemo(
    () => flattenPurchasesToLines(purchases),
    [purchases]
  )

  const purchaseStats = useMemo(() => {
    const completed = purchases.filter((purchase) => purchase.status === "completed")
    const pending = purchases.filter((purchase) => purchase.status === "pending")
    const total = sumNumericField(purchases, (purchase) => purchase.totalAmount)
    const completedTotal = sumNumericField(completed, (purchase) => purchase.totalAmount)
    return {
      count: purchases.length,
      total,
      completedCount: completed.length,
      completedTotal,
      pendingCount: pending.length,
    }
  }, [purchases])

  const closeSidebar = () => setSidebar(null)

  const handleViewModeChange = useCallback((mode: BillItemViewMode) => {
    setViewMode(mode)
    savePurchaseViewMode(mode)
    if (mode === "item") {
      closeSidebar()
    } else {
      setViewLine(null)
    }
  }, [])

  const openCreatePurchase = useCallback(() => {
    setViewLine(null)
    setSidebar({ mode: "add" })
  }, [])

  const handleImportPurchases = useCallback(
    (rows: Record<string, string>[]) => {
      let added = 0
      setPurchases((prev) => {
        let acc = [...prev]
        for (const row of rows) {
          const mapped = mapImportedPurchase(row, acc)
          if (mapped) {
            acc = [...acc, mapped]
            added++
          }
        }
        return acc
      })
      return added
    },
    [setPurchases]
  )

  const purchaseImportSampleCsv = useMemo(() => {
    const example = purchases[0] as Record<string, unknown> | undefined
    if (!example) return undefined
    return buildSampleCsv(Object.keys(example), example)
  }, [purchases])

  const openPurchaseBill = useCallback(
    (purchaseId: number) => {
      const purchase = getPurchase(purchaseId)
      if (!purchase) return
      setViewLine(null)
      setViewMode("bill")
      savePurchaseViewMode("bill")
      setSidebar({ mode: "view", purchase })
    },
    [getPurchase]
  )

  const handleDelete = useCallback(
    async (purchase: PurchaseRow) => {
      if (
        !(await confirmDeleteAction({
          itemName: purchase.purchaseNumber,
          entityLabel: "purchase order",
        }))
      ) {
        return
      }
      removePurchase(purchase.id)
      if (sidebar?.mode !== "add" && sidebar?.purchase.id === purchase.id) {
        closeSidebar()
      }
      toast.message(`Removed ${purchase.purchaseNumber} (demo).`)
    },
    [removePurchase, sidebar]
  )

  const handleDuplicate = useCallback(
    async (purchase: PurchaseRow) => {
      if (
        !(await confirmDuplicateAction({
          itemName: purchase.purchaseNumber,
          entityLabel: "purchase order",
        }))
      ) {
        return
      }
      const copy = duplicatePurchase(purchase.id)
      if (copy) toast.success(`Duplicated ${purchase.purchaseNumber} (demo).`)
    },
    [duplicatePurchase]
  )

  const handleDeleteLines = useCallback(
    async (selected: PurchaseLineReportRow[]) => {
      if (
        !(await confirmDeleteAction({
          count: selected.length,
          entityLabel: "purchase line item",
        }))
      ) {
        return
      }

      const selectedKeys = new Set(selected.map((line) => line.id))
      setPurchases((prev) =>
        prev
          .map((purchase) => {
            const remaining = (purchase.lines ?? []).filter(
              (line) => !selectedKeys.has(`${purchase.id}-${line.id}`)
            )
            if (remaining.length === (purchase.lines ?? []).length) return purchase
            if (remaining.length === 0) return null
            return {
              ...purchase,
              lines: remaining,
              totalAmount: computePurchaseTotal(remaining),
            }
          })
          .filter((purchase): purchase is PurchaseRow => purchase !== null)
      )

      if (viewLine && selectedKeys.has(viewLine.id)) {
        setViewLine(null)
      }

      toast.message(
        `Removed ${selected.length} line item${selected.length === 1 ? "" : "s"} (demo).`
      )
    },
    [setPurchases, viewLine]
  )

  const handleDeleteLine = useCallback(
    (line: PurchaseLineReportRow) => {
      void handleDeleteLines([line])
    },
    [handleDeleteLines]
  )

  const openReturnFromBill = useCallback((purchase: PurchaseRow) => {
    if (!canReturnDocument(purchase)) {
      toast.error("Only completed paid purchases can be returned.")
      return
    }
    setReturnDraft(buildReturnFromPurchase(purchase))
  }, [])

  const openReturnFromLine = useCallback(
    (line: PurchaseLineReportRow) => {
      const purchase = getPurchase(line.purchaseId)
      if (!purchase) {
        toast.error("Source purchase not found.")
        return
      }
      if (!canReturnDocument(purchase)) {
        toast.error("Only completed paid purchases can be returned.")
        return
      }
      setReturnDraft(buildReturnFromPurchase(purchase, { lineIds: [line.lineId] }))
    },
    [getPurchase]
  )

  const handleCancelBill = useCallback(
    async (purchase: PurchaseRow) => {
      if (!canCancelDocument(purchase)) return
      if (
        !(await confirmCancelAction({
          itemName: purchase.purchaseNumber,
          entityLabel: "purchase",
        }))
      ) {
        return
      }
      updatePurchase(purchase.id, { status: "cancelled" })
      if (sidebar?.mode !== "add" && sidebar?.purchase.id === purchase.id) {
        closeSidebar()
      }
      toast.success(`${purchase.purchaseNumber} cancelled.`)
    },
    [sidebar, updatePurchase, closeSidebar]
  )

  const handleCancelLine = useCallback(
    async (line: PurchaseLineReportRow) => {
      const purchase = getPurchase(line.purchaseId)
      if (!purchase || !canCancelDocument(purchase)) {
        toast.error("Only pending unpaid purchases can be cancelled.")
        return
      }
      if (
        !(await confirmCancelAction({
          itemName: purchase.purchaseNumber,
          entityLabel: "purchase",
        }))
      ) {
        return
      }
      updatePurchase(purchase.id, { status: "cancelled" })
      if (viewLine?.purchaseId === purchase.id) setViewLine(null)
      toast.success(`${purchase.purchaseNumber} cancelled.`)
    },
    [getPurchase, updatePurchase, viewLine]
  )

  const resolvePurchaseForLine = useCallback(
    (line: PurchaseLineReportRow) => getPurchase(line.purchaseId),
    [getPurchase]
  )

  const openEditPurchaseFromLine = useCallback(
    (line: PurchaseLineReportRow) => {
      const purchase = getPurchase(line.purchaseId)
      if (!purchase) return
      setViewLine(null)
      setSidebar({ mode: "edit", purchase })
    },
    [getPurchase]
  )

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const fd = new FormData(e.currentTarget)
      const vendorName = String(fd.get("vendorName") ?? "").trim()
      if (!vendorName) {
        toast.error("Vendor name is required.")
        return
      }

      const parsed = purchaseFromFormData(
        fd,
        sidebar?.mode === "edit" && sidebar.purchase ? sidebar.purchase.id : 0
      )
      if (parsed.lines.length === 0 || !parsed.lines.some((l) => l.productName.trim())) {
        toast.error("Add at least one line item with a product name.")
        return
      }

      if (sidebar?.mode === "add") {
        addPurchase(parsed)
        toast.success("Purchase order created (demo).")
        closeSidebar()
        return
      }

      if (sidebar?.mode === "edit" && sidebar.purchase) {
        updatePurchase(sidebar.purchase.id, parsed)
        toast.success("Purchase order saved (demo).")
        closeSidebar()
      }
    },
    [sidebar, addPurchase, updatePurchase]
  )

  const billColumns = useMemo(
    () =>
      getPurchaseColumns(
        (row, mode) => setSidebar({ purchase: row, mode }),
        handleDelete,
        handleDuplicate,
        openReturnFromBill,
        handleCancelBill
      ),
    [handleDelete, handleDuplicate, openReturnFromBill, handleCancelBill]
  )

  const lineColumns = useMemo(
    () =>
      getPurchaseLineColumns(
        (row) => setViewLine(row),
        openEditPurchaseFromLine,
        openPurchaseBill,
        handleDeleteLine,
        openReturnFromLine,
        handleCancelLine,
        resolvePurchaseForLine
      ),
    [
      openPurchaseBill,
      openEditPurchaseFromLine,
      handleDeleteLine,
      openReturnFromLine,
      handleCancelLine,
      resolvePurchaseForLine,
    ]
  )

  const purchaseTableOptions = useMemo(
    () => (
      <PurchaseViewTableOption
        value={viewMode}
        onValueChange={handleViewModeChange}
      />
    ),
    [viewMode, handleViewModeChange]
  )

  const sheetPurchase = sidebar && sidebar.mode !== "add" ? sidebar.purchase : null
  const formPurchase =
    sidebar?.mode === "add"
      ? { ...EMPTY_PURCHASE, purchaseNumber: nextPurchaseNumber(purchases) }
      : sheetPurchase ?? EMPTY_PURCHASE
  const formId =
    sidebar?.mode === "add"
      ? "purchase-add-form"
      : sheetPurchase
        ? `purchase-edit-${sheetPurchase.id}`
        : "purchase-edit"

  return (
    <>
      <ReturnCreateSheet
        open={returnDraft !== null}
        onOpenChange={(open) => {
          if (!open) setReturnDraft(null)
        }}
        draft={returnDraft}
        formId="purchase-return-form"
      />

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
                    ? "Create purchase order"
                    : sidebar.mode === "edit"
                      ? "Edit purchase order"
                      : sheetPurchase?.purchaseNumber}
                </SheetTitle>
                <SheetDescription>
                  {sidebar.mode === "add" ? (
                    "Add purchase header and line items. Saving is demo only."
                  ) : sidebar.mode === "edit" && sheetPurchase ? (
                    <>
                      {sheetPurchase.purchaseNumber}
                      <span className="text-muted-foreground"> · ID {sheetPurchase.id}</span>
                    </>
                  ) : sheetPurchase ? (
                    <>
                      {sheetPurchase.vendorName}
                      <span className="text-muted-foreground">
                        {" "}
                        · {formatDate(sheetPurchase.purchaseDate)}
                      </span>
                    </>
                  ) : null}
                </SheetDescription>
              </SheetHeader>
              <div
                key={
                  sidebar.mode === "add"
                    ? "add"
                    : `${sheetPurchase?.id}-${sidebar.mode}`
                }
                className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
              >
                {sidebar.mode === "view" && sheetPurchase ? (
                  <PurchaseDetail purchase={sheetPurchase} />
                ) : sidebar.mode === "edit" || sidebar.mode === "add" ? (
                  <PurchaseForm
                    formId={formId}
                    purchase={formPurchase}
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
                        sheetPurchase &&
                        setSidebar({ mode: "edit", purchase: sheetPurchase })
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
                      {sidebar.mode === "add" ? "Create purchase" : "Save purchase"}
                    </Button>
                  </>
                )}
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet
        open={viewLine !== null}
        onOpenChange={(open) => {
          if (!open) setViewLine(null)
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
        >
          {viewLine ? (
            <>
              <SheetHeader className="border-border/60 space-y-1 border-b px-6 py-5 text-left">
                <SheetTitle className="text-lg leading-tight">
                  {viewLine.productName}
                </SheetTitle>
                <SheetDescription>
                  {viewLine.purchaseNumber}
                  <span className="text-muted-foreground"> · {viewLine.vendorName}</span>
                </SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <PurchaseLineDetail line={viewLine} />
              </div>
              <SheetFooter className="border-border/60 gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => openPurchaseBill(viewLine.purchaseId)}
                >
                  Open purchase
                </Button>
                <SheetClose asChild>
                  <Button className="w-full sm:w-auto">Close</Button>
                </SheetClose>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <StatCardsGrid className="mb-5">
        <StatCard
          label="Purchase orders"
          value={String(purchaseStats.count)}
          hint="All PO records"
        />
        <StatCard
          label="Total value"
          value={formatMoney(purchaseStats.total.toFixed(2))}
          hint="All statuses"
        />
        <StatCard
          label="Completed"
          value={String(purchaseStats.completedCount)}
          hint={formatMoney(purchaseStats.completedTotal.toFixed(2))}
        />
        <StatCard
          label="Pending"
          value={String(purchaseStats.pendingCount)}
          hint="Awaiting payment"
        />
      </StatCardsGrid>

      {viewMode === "bill" ? (
          <DataTable
            data={purchases}
            columns={billColumns}
            addButtonLabel="Create purchase"
            searchPlaceholder="Search purchases..."
            importSampleFilename="purchases-sample.csv"
            importSampleCsvContent={purchaseImportSampleCsv}
            exportFilename="purchases-export.csv"
            onImportRows={handleImportPurchases}
            onAddClick={openCreatePurchase}
            tableOptionsExtra={purchaseTableOptions}
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
                      entityLabel: "purchase order",
                    }))
                  ) {
                    return
                  }
                  const ids = new Set(selected.map((s) => s.id))
                  setPurchases((prev) => prev.filter((r) => !ids.has(r.id)))
                  toast.message(
                    `Removed ${selected.length} purchase order${selected.length === 1 ? "" : "s"} (demo).`
                  )
                },
              },
            ]}
            tabs={purchaseTabs}
            defaultTab="all"
            tabFilter={purchaseTabFilter}
          />
        ) : (
          <DataTable
            data={purchaseLines}
            columns={lineColumns}
            addButtonLabel="Create purchase"
            searchPlaceholder="Search by item, vendor, PO #…"
            importSampleFilename="purchases-sample.csv"
            importSampleCsvContent={purchaseImportSampleCsv}
            onImportRows={handleImportPurchases}
            onAddClick={openCreatePurchase}
            exportFilename="purchase-lines-export.csv"
            tableOptionsExtra={purchaseTableOptions}
            bulkActions={[
              {
                id: "delete",
                label: "Delete selected",
                icon: <IconTrash className="size-4" />,
                variant: "destructive",
                onClick: handleDeleteLines,
              },
            ]}
            tabs={purchaseTabs}
            defaultTab="all"
            tabFilter={purchaseLineTabFilter}
          />
        )}
    </>
  )
}
