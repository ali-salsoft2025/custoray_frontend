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

import { PurchaseDetail } from "@/components/purchases/purchase-detail"
import { PurchaseForm } from "@/components/purchases/purchase-form"
import { PurchaseStatusBadge } from "@/components/purchases/purchase-status-badge"
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
import { usePurchases } from "@/context/purchases-context"
import {
  confirmDeleteAction,
  confirmDuplicateAction,
} from "@/lib/confirm-action"
import {
  computeBalance,
  EMPTY_PURCHASE,
  formatDate,
  formatMoney,
  mapImportedPurchase,
  nextPurchaseNumber,
  purchaseFromFormData,
  type PurchaseRow,
} from "@/lib/purchases"

const invoiceTabs: DataTableTab[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
]

type PurchaseInvoiceSidebarState =
  | { mode: "view"; purchase: PurchaseRow }
  | { mode: "edit"; purchase: PurchaseRow }
  | { mode: "add" }
  | null

function purchaseInvoiceTabFilter(row: PurchaseRow, tab: string) {
  if (tab === "all") return true
  return row.status === tab
}

function getPurchaseInvoiceColumns(
  openSidebar: (row: PurchaseRow, mode: "view" | "edit") => void,
  onDelete: (row: PurchaseRow) => void,
  onDuplicate: (row: PurchaseRow) => void
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
      accessorKey: "purchaseNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Invoice #" />
      ),
      cell: ({ row }) => (
        <button
          type="button"
          className="text-foreground text-left font-medium hover:underline"
          onClick={() => openSidebar(row.original, "view")}
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
            <DropdownMenuItem onClick={() => openSidebar(row.original, "view")}>
              <IconEye />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openSidebar(row.original, "edit")}>
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

export default function PurchaseInvoicePage() {
  const {
    purchases,
    setPurchases,
    addPurchase,
    updatePurchase,
    removePurchase,
    duplicatePurchase,
  } = usePurchases()
  const [sidebar, setSidebar] = useState<PurchaseInvoiceSidebarState>(null)

  const closeSidebar = () => setSidebar(null)

  const handleDelete = useCallback(
    async (purchase: PurchaseRow) => {
      if (
        !(await confirmDeleteAction({
          itemName: purchase.purchaseNumber,
          entityLabel: "purchase invoice",
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
          entityLabel: "purchase invoice",
        }))
      ) {
        return
      }
      const copy = duplicatePurchase(purchase.id)
      if (copy) toast.success(`Duplicated ${purchase.purchaseNumber} (demo).`)
    },
    [duplicatePurchase]
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
        toast.success("Purchase invoice created (demo).")
        closeSidebar()
        return
      }

      if (sidebar?.mode === "edit" && sidebar.purchase) {
        updatePurchase(sidebar.purchase.id, parsed)
        toast.success("Purchase invoice saved (demo).")
        closeSidebar()
      }
    },
    [sidebar, addPurchase, updatePurchase]
  )

  const columns = useMemo(
    () =>
      getPurchaseInvoiceColumns(
        (row, mode) => setSidebar({ purchase: row, mode }),
        handleDelete,
        handleDuplicate
      ),
    [handleDelete, handleDuplicate]
  )

  const sheetPurchase = sidebar && sidebar.mode !== "add" ? sidebar.purchase : null
  const formPurchase =
    sidebar?.mode === "add"
      ? { ...EMPTY_PURCHASE, purchaseNumber: nextPurchaseNumber(purchases) }
      : sheetPurchase ?? EMPTY_PURCHASE
  const formId =
    sidebar?.mode === "add"
      ? "purchase-invoice-add-form"
      : sheetPurchase
        ? `purchase-invoice-edit-${sheetPurchase.id}`
        : "purchase-invoice-edit"

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
                    ? "Create purchase invoice"
                    : sidebar.mode === "edit"
                      ? "Edit purchase invoice"
                      : sheetPurchase?.purchaseNumber}
                </SheetTitle>
                <SheetDescription>
                  {sidebar.mode === "add" ? (
                    "Add vendor, line items, and payment details. Saving is demo only."
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
        data={purchases}
        columns={columns}
        addButtonLabel="Create purchase invoice"
        searchPlaceholder="Search purchase invoices..."
        importRowMapper={mapImportedPurchase}
        importSampleFilename="purchase-invoices-sample.csv"
        exportFilename="purchase-invoices-export.csv"
        onDataChange={setPurchases}
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
                  entityLabel: "purchase invoice",
                }))
              ) {
                return
              }
              const ids = new Set(selected.map((s) => s.id))
              setPurchases((prev) => prev.filter((r) => !ids.has(r.id)))
              toast.message(
                `Removed ${selected.length} purchase invoice${selected.length === 1 ? "" : "s"} (demo).`
              )
            },
          },
        ]}
        tabs={invoiceTabs}
        defaultTab="all"
        tabFilter={purchaseInvoiceTabFilter}
      />
    </>
  )
}
