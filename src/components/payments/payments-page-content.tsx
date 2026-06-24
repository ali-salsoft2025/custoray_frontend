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

import { PaymentDetail } from "@/components/payments/payment-detail"
import { PaymentForm } from "@/components/payments/payment-form"
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
import { usePayments } from "@/context/payments-context"
import {
  confirmDeleteAction,
  confirmDuplicateAction,
} from "@/lib/confirm-action"
import {
  EMPTY_PAYMENT,
  formatDate,
  formatMoney,
  mapImportedPayment,
  paymentFromFormData,
  paymentStatusTabFilter,
  statusBadgeClass,
  statusLabel,
  type PaymentRow,
} from "@/lib/payments"

const statusTabs: DataTableTab[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "voided", label: "Voided" },
]

type PaymentSidebarState =
  | { mode: "view"; payment: PaymentRow }
  | { mode: "edit"; payment: PaymentRow }
  | { mode: "add" }
  | null

type PaymentsPageContentProps = {
  paymentType: PaymentRow["type"]
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

function getPaymentColumns(
  partyLabel: string,
  openPaymentSidebar: (row: PaymentRow, mode: "view" | "edit") => void,
  onDelete: (row: PaymentRow) => void,
  onDuplicate: (row: PaymentRow) => void
): ColumnDef<PaymentRow>[] {
  return [
    selectColumn<PaymentRow>(),
    srNoColumn<PaymentRow>(),
    {
      accessorKey: "paymentNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Payment #" />
      ),
      cell: ({ row }) => (
        <button
          type="button"
          className="text-foreground text-left font-medium hover:underline"
          onClick={() => openPaymentSidebar(row.original, "view")}
        >
          {row.original.paymentNumber}
        </button>
      ),
      enableHiding: false,
      meta: { dataTableFilter: false },
    },
    {
      accessorKey: "partyName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={partyLabel} />
      ),
      cell: ({ row }) => (
        <span className="text-foreground max-w-[12rem] truncate font-medium">
          {row.original.partyName}
        </span>
      ),
      meta: { dataTableFilter: false },
    },
    {
      accessorKey: "referenceNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Reference" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular-nums text-xs">
          {row.original.referenceNumber}
        </span>
      ),
      meta: { dataTableFilter: false },
    },
    {
      accessorKey: "paymentDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular-nums text-xs">
          {formatDate(row.original.paymentDate)}
        </span>
      ),
      meta: { dataTableFilter: false },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" align="center" />
      ),
      cell: ({ row }) => (
        <div className="flex justify-center">
          <span className="text-foreground tabular-nums">
            {formatMoney(row.original.amount)}
          </span>
        </div>
      ),
      meta: { dataTableFilter: false },
    },
    {
      accessorKey: "paymentMethod",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Method" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">{row.original.paymentMethod}</span>
      ),
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
            <DropdownMenuItem onClick={() => openPaymentSidebar(row.original, "view")}>
              <IconEye />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openPaymentSidebar(row.original, "edit")}>
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

export function PaymentsPageContent({ paymentType }: PaymentsPageContentProps) {
  const isCustomer = paymentType === "customer"
  const partyLabel = isCustomer ? "Customer" : "Vendor"
  const addButtonLabel = isCustomer ? "Receive payment" : "Make payment"
  const searchPlaceholder = isCustomer
    ? "Search customer payments..."
    : "Search vendor payments..."
  const exportFilename = isCustomer
    ? "customer-payments-export.csv"
    : "vendor-payments-export.csv"
  const importSampleFilename = isCustomer
    ? "customer-payments-sample.csv"
    : "vendor-payments-sample.csv"

  const {
    payments,
    setPayments,
    addPayment,
    updatePayment,
    removePayment,
    duplicatePayment,
  } = usePayments()
  const [sidebar, setSidebar] = useState<PaymentSidebarState>(null)

  const typePayments = useMemo(
    () => payments.filter((row) => row.type === paymentType),
    [payments, paymentType]
  )

  const closeSidebar = () => setSidebar(null)

  const mergeTypePayments = useCallback(
    (nextTypeRows: PaymentRow[]) => {
      const other = payments.filter((row) => row.type !== paymentType)
      setPayments([...other, ...nextTypeRows])
    },
    [payments, paymentType, setPayments]
  )

  const handleDelete = useCallback(
    async (payment: PaymentRow) => {
      if (
        !(await confirmDeleteAction({
          itemName: payment.paymentNumber,
          entityLabel: "payment",
        }))
      ) {
        return
      }
      removePayment(payment.id)
      if (sidebar?.mode !== "add" && sidebar?.payment.id === payment.id) {
        closeSidebar()
      }
      toast.message(`Removed ${payment.paymentNumber} (demo).`)
    },
    [removePayment, sidebar]
  )

  const handleDuplicate = useCallback(
    async (payment: PaymentRow) => {
      if (
        !(await confirmDuplicateAction({
          itemName: payment.paymentNumber,
          entityLabel: "payment",
        }))
      ) {
        return
      }
      const copy = duplicatePayment(payment.id)
      if (copy) toast.success(`Duplicated as ${copy.paymentNumber} (demo).`)
    },
    [duplicatePayment]
  )

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const fd = new FormData(e.currentTarget)
      const partyName = String(fd.get("partyName") ?? "").trim()
      if (!partyName) {
        toast.error(isCustomer ? "Select a customer." : "Select a vendor.")
        return
      }

      const amount = Number(String(fd.get("amount") ?? "0"))
      if (!Number.isFinite(amount) || amount <= 0) {
        toast.error("Enter a valid payment amount.")
        return
      }

      fd.set("type", paymentType)

      if (sidebar?.mode === "add") {
        addPayment(paymentFromFormData(fd, 0))
        toast.success(isCustomer ? "Payment received (demo)." : "Payment recorded (demo).")
        closeSidebar()
        return
      }

      if (sidebar?.mode === "edit" && sidebar.payment) {
        updatePayment(sidebar.payment.id, paymentFromFormData(fd, sidebar.payment.id))
        toast.success("Payment saved (demo).")
        closeSidebar()
      }
    },
    [sidebar, addPayment, updatePayment, isCustomer, paymentType]
  )

  const columns = useMemo(
    () =>
      getPaymentColumns(
        partyLabel,
        (row, mode) => setSidebar({ payment: row, mode }),
        handleDelete,
        handleDuplicate
      ),
    [partyLabel, handleDelete, handleDuplicate]
  )

  const sheetPayment = sidebar && sidebar.mode !== "add" ? sidebar.payment : null
  const formPayment =
    sidebar?.mode === "add"
      ? { ...EMPTY_PAYMENT, type: paymentType }
      : sheetPayment ?? { ...EMPTY_PAYMENT, type: paymentType }
  const formId =
    sidebar?.mode === "add"
      ? `${paymentType}-payment-add-form`
      : sheetPayment
        ? `${paymentType}-payment-edit-${sheetPayment.id}`
        : `${paymentType}-payment-edit`

  const handleImportRows = useCallback(
    (rows: Record<string, string>[]) => {
      let added = 0
      setPayments((prev) => {
        let acc = [...prev]
        for (const row of rows) {
          const mapped = mapImportedPayment(
            { ...row, type: paymentType },
            acc
          )
          if (mapped && mapped.type === paymentType) {
            acc = [...acc, mapped]
            added++
          }
        }
        return acc
      })
      return added
    },
    [paymentType, setPayments]
  )

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
                    ? addButtonLabel
                    : sidebar.mode === "edit"
                      ? "Edit payment"
                      : sheetPayment?.paymentNumber}
                </SheetTitle>
                <SheetDescription>
                  {sidebar.mode === "add" ? (
                    isCustomer
                      ? "Record a payment received from a customer. Saving is demo only."
                      : "Record a payment made to a vendor. Saving is demo only."
                  ) : sidebar.mode === "edit" && sheetPayment ? (
                    <>
                      {sheetPayment.partyName}
                      <span className="text-muted-foreground">
                        {" "}
                        · {formatDate(sheetPayment.paymentDate)}
                      </span>
                    </>
                  ) : sheetPayment ? (
                    <>
                      {sheetPayment.partyName}
                      <span className="text-muted-foreground">
                        {" "}
                        · {formatDate(sheetPayment.paymentDate)}
                      </span>
                    </>
                  ) : null}
                </SheetDescription>
              </SheetHeader>
              <div
                key={
                  sidebar.mode === "add"
                    ? `${paymentType}-add`
                    : `${sheetPayment?.id}-${sidebar.mode}`
                }
                className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
              >
                {sidebar.mode === "view" && sheetPayment ? (
                  <PaymentDetail payment={sheetPayment} />
                ) : sidebar.mode === "edit" || sidebar.mode === "add" ? (
                  <PaymentForm
                    formId={formId}
                    payment={formPayment}
                    onSubmit={handleSubmit}
                    lockType={paymentType}
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
                        sheetPayment &&
                        setSidebar({ mode: "edit", payment: sheetPayment })
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
                      {sidebar.mode === "add" ? addButtonLabel : "Save payment"}
                    </Button>
                  </>
                )}
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <DataTable
        data={typePayments}
        columns={columns}
        addButtonLabel={addButtonLabel}
        searchPlaceholder={searchPlaceholder}
        importSampleFilename={importSampleFilename}
        exportFilename={exportFilename}
        onDataChange={mergeTypePayments}
        onImportRows={handleImportRows}
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
                  entityLabel: "payment",
                }))
              ) {
                return
              }
              const ids = new Set(selected.map((row) => row.id))
              setPayments((prev) => prev.filter((row) => !ids.has(row.id)))
              toast.message(
                `Removed ${selected.length} payment${selected.length === 1 ? "" : "s"} (demo).`
              )
            },
          },
        ]}
        tabs={statusTabs}
        defaultTab="all"
        tabFilter={paymentStatusTabFilter}
      />
    </>
  )
}
