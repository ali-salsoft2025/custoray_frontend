"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { IconDotsVertical, IconEye, IconTrash } from "@tabler/icons-react"
import { toast } from "sonner"

import { ReturnDetail } from "@/components/returns/return-detail"
import { ReturnLineDetail } from "@/components/returns/return-line-detail"
import { ReturnViewTableOption } from "@/components/returns/return-view-toggle"
import { DataTableColumnHeader } from "@/components/data-table-column-header"
import { DataTable, type DataTableTab } from "@/components/data-table"
import { StatCard, StatCardsGrid, sumNumericField } from "@/components/stat-card"
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
import { useReturns } from "@/context/returns-context"
import {
  loadReturnViewMode,
  saveReturnViewMode,
  type BillItemViewMode,
} from "@/lib/app-preferences"
import { confirmDeleteAction } from "@/lib/confirm-action"
import { formatDate, formatMoney, type ReturnRow } from "@/lib/returns"
import {
  flattenReturnsToLines,
  type ReturnLineReportRow,
} from "@/lib/returns-report"

const returnTabs: DataTableTab[] = [
  { value: "all", label: "All" },
  { value: "sales", label: "Sales" },
  { value: "purchase", label: "Purchase" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
]

function returnBillTabFilter(row: ReturnRow, tab: string) {
  if (tab === "all") return true
  if (tab === "sales" || tab === "purchase") return row.type === tab
  return row.status === tab
}

function returnLineTabFilter(row: ReturnLineReportRow, tab: string) {
  if (tab === "all") return true
  if (tab === "sales" || tab === "purchase") return row.type === tab
  if (tab === "pending" || tab === "completed") return row.returnStatus === tab
  return true
}

function statusBadgeClass(status: ReturnRow["status"]) {
  if (status === "completed")
    return "border-emerald-500/30 px-1.5 text-emerald-700 dark:text-emerald-400"
  if (status === "pending")
    return "border-blue-500/30 px-1.5 text-blue-700 dark:text-blue-400"
  return "border-border px-1.5 text-muted-foreground"
}

function statusLabel(status: ReturnRow["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1)
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
      return (
        <span className="text-muted-foreground font-mono tabular-nums">
          {pageIndex * pageSize + row.index + 1}
        </span>
      )
    },
    enableSorting: false,
    meta: { dataTableFilter: false },
  }
}

function getReturnBillColumns(
  openView: (row: ReturnRow) => void,
  onDelete: (row: ReturnRow) => void
): ColumnDef<ReturnRow>[] {
  return [
    selectColumn<ReturnRow>(),
    srNoColumn<ReturnRow>(),
    {
      accessorKey: "returnNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Return #" />
      ),
      cell: ({ row }) => (
        <button
          type="button"
          className="text-foreground text-left font-medium hover:underline"
          onClick={() => openView(row.original)}
        >
          {row.original.returnNumber}
        </button>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "type",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      cell: ({ row }) => (
        <span className="capitalize">{row.original.type}</span>
      ),
    },
    {
      accessorKey: "referenceNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Reference" />
      ),
    },
    {
      accessorKey: "partyName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Party" />
      ),
      cell: ({ row }) => (
        <span className="max-w-[10rem] truncate">{row.original.partyName}</span>
      ),
    },
    {
      accessorKey: "returnDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {formatDate(row.original.returnDate)}
        </span>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Return amt" align="center" />
      ),
      cell: ({ row }) => (
        <div className="flex justify-center tabular-nums">
          {formatMoney(row.original.totalAmount)}
        </div>
      ),
    },
    {
      accessorKey: "refundDue",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Refund due" align="center" />
      ),
      cell: ({ row }) => (
        <div className="flex justify-center">
          {Number(row.original.refundDue) > 0 ? (
            <span className="text-emerald-700 tabular-nums dark:text-emerald-400">
              {formatMoney(row.original.refundDue)}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "balanceDue",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Balance due" align="center" />
      ),
      cell: ({ row }) => (
        <div className="flex justify-center">
          {Number(row.original.balanceDue) > 0 ? (
            <span className="text-amber-700 tabular-nums dark:text-amber-400">
              {formatMoney(row.original.balanceDue)}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
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
            <Button variant="ghost" className="text-muted-foreground flex size-8" size="icon">
              <IconDotsVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => openView(row.original)}>
              <IconEye />
              View
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

function getReturnLineColumns(
  openLineView: (row: ReturnLineReportRow) => void,
  onDeleteReturn: (returnId: number) => void
): ColumnDef<ReturnLineReportRow>[] {
  return [
    selectColumn<ReturnLineReportRow>(),
    srNoColumn<ReturnLineReportRow>(),
    {
      accessorKey: "returnNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Return #" />
      ),
      cell: ({ row }) => (
        <button
          type="button"
          className="text-foreground text-left font-medium hover:underline"
          onClick={() => openLineView(row.original)}
        >
          {row.original.returnNumber}
        </button>
      ),
    },
    {
      accessorKey: "type",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      cell: ({ row }) => <span className="capitalize">{row.original.type}</span>,
    },
    {
      accessorKey: "referenceNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Reference" />
      ),
    },
    {
      accessorKey: "productName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Item" />,
      cell: ({ row }) => (
        <span className="max-w-[14rem] truncate">{row.original.productName}</span>
      ),
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Qty" align="center" />
      ),
      cell: ({ row }) => (
        <div className="flex justify-center tabular-nums">{row.original.quantity}</div>
      ),
    },
    {
      accessorKey: "lineTotal",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Line total" align="center" />
      ),
      cell: ({ row }) => (
        <div className="flex justify-center tabular-nums">
          {formatMoney(row.original.lineTotal)}
        </div>
      ),
    },
    {
      accessorKey: "refundDue",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Refund due" align="center" />
      ),
      cell: ({ row }) => (
        <div className="flex justify-center">
          {Number(row.original.refundDue) > 0 ? (
            <span className="text-emerald-700 tabular-nums dark:text-emerald-400">
              {formatMoney(row.original.refundDue)}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="text-muted-foreground flex size-8" size="icon">
              <IconDotsVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => openLineView(row.original)}>
              <IconEye />
              View
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDeleteReturn(row.original.returnId)}
            >
              <IconTrash />
              Delete return
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}

export default function ReturnsPage() {
  const { returns, removeReturn } = useReturns()
  const [viewMode, setViewMode] = useState<BillItemViewMode>("item")
  const [viewReturn, setViewReturn] = useState<ReturnRow | null>(null)
  const [viewLine, setViewLine] = useState<ReturnLineReportRow | null>(null)

  useEffect(() => {
    setViewMode(loadReturnViewMode())
  }, [])

  const returnLines = useMemo(() => flattenReturnsToLines(returns), [returns])

  const returnStats = useMemo(() => {
    const salesReturns = returns.filter((row) => row.type === "sales")
    const pending = returns.filter((row) => row.status === "pending")
    const total = sumNumericField(returns, (row) => row.totalAmount)
    return {
      count: returns.length,
      total,
      salesCount: salesReturns.length,
      pendingCount: pending.length,
    }
  }, [returns])

  const handleViewModeChange = useCallback((mode: BillItemViewMode) => {
    setViewMode(mode)
    saveReturnViewMode(mode)
    if (mode === "item") setViewReturn(null)
    else setViewLine(null)
  }, [])

  const handleDelete = useCallback(
    async (row: ReturnRow) => {
      if (
        !(await confirmDeleteAction({
          itemName: row.returnNumber,
          entityLabel: "return",
        }))
      ) {
        return
      }
      removeReturn(row.id)
      if (viewReturn?.id === row.id) setViewReturn(null)
      toast.message(`Removed ${row.returnNumber} (demo).`)
    },
    [removeReturn, viewReturn]
  )

  const handleDeleteById = useCallback(
    async (returnId: number) => {
      const row = returns.find((r) => r.id === returnId)
      if (row) await handleDelete(row)
    },
    [returns, handleDelete]
  )

  const tableOptions = useMemo(
    () => <ReturnViewTableOption value={viewMode} onValueChange={handleViewModeChange} />,
    [viewMode, handleViewModeChange]
  )

  const billColumns = useMemo(
    () => getReturnBillColumns((row) => setViewReturn(row), handleDelete),
    [handleDelete]
  )

  const lineColumns = useMemo(
    () =>
      getReturnLineColumns((row) => setViewLine(row), (id) => {
        void handleDeleteById(id)
      }),
    [handleDeleteById]
  )

  return (
    <>
      <Sheet open={viewReturn !== null} onOpenChange={(o) => !o && setViewReturn(null)}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          {viewReturn ? (
            <>
              <SheetHeader className="border-border/60 border-b px-6 py-5 text-left">
                <SheetTitle>{viewReturn.returnNumber}</SheetTitle>
                <SheetDescription>
                  {viewReturn.referenceNumber} · {viewReturn.partyName}
                </SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <ReturnDetail returnDoc={viewReturn} />
              </div>
              <SheetFooter className="border-border/60 border-t px-6 py-4">
                <SheetClose asChild>
                  <Button>Close</Button>
                </SheetClose>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet open={viewLine !== null} onOpenChange={(o) => !o && setViewLine(null)}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
          {viewLine ? (
            <>
              <SheetHeader className="border-border/60 border-b px-6 py-5 text-left">
                <SheetTitle>{viewLine.productName}</SheetTitle>
                <SheetDescription>{viewLine.returnNumber}</SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <ReturnLineDetail line={viewLine} />
              </div>
              <SheetFooter className="border-border/60 border-t px-6 py-4">
                <SheetClose asChild>
                  <Button>Close</Button>
                </SheetClose>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <StatCardsGrid className="mb-5">
        <StatCard label="Returns" value={String(returnStats.count)} hint="All return records" />
        <StatCard
          label="Return value"
          value={formatMoney(returnStats.total.toFixed(2))}
          hint="Total returned amount"
        />
        <StatCard
          label="Sales returns"
          value={String(returnStats.salesCount)}
          hint={`${returnStats.count - returnStats.salesCount} purchase`}
        />
        <StatCard
          label="Pending"
          value={String(returnStats.pendingCount)}
          hint="Awaiting completion"
        />
      </StatCardsGrid>

      {viewMode === "bill" ? (
        <DataTable
          data={returns}
          columns={billColumns}
          searchPlaceholder="Search returns…"
          exportFilename="returns-export.csv"
          showAddButton={false}
          tableOptionsExtra={tableOptions}
          tabs={returnTabs}
          defaultTab="all"
          tabFilter={returnBillTabFilter}
        />
      ) : (
        <DataTable
          data={returnLines}
          columns={lineColumns}
          searchPlaceholder="Search returned items…"
          exportFilename="return-lines-export.csv"
          showAddButton={false}
          tableOptionsExtra={tableOptions}
          tabs={returnTabs}
          defaultTab="all"
          tabFilter={returnLineTabFilter}
        />
      )}
    </>
  )
}
