"use client"

import { useCallback, useMemo, useState, type FormEvent } from "react"
import { ColumnDef } from "@tanstack/react-table"
import {
  IconCopy,
  IconDotsVertical,
  IconEye,
  IconFilter,
  IconPencil,
  IconTrash,
  IconX,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"

import { PaymentDetail } from "@/components/payments/payment-detail"
import { PaymentForm } from "@/components/payments/payment-form"
import { DataTableColumnHeader } from "@/components/data-table-column-header"
import { DataTable, type DataTableTab } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  PAYMENT_METHODS,
  formatDate,
  formatMoney,
  mapImportedPayment,
  paymentFromFormData,
  paymentStatusTabFilter,
  statusBadgeClass,
  type PaymentRow,
} from "@/lib/payments"

const statusTabValues = ["all", "pending", "completed", "voided"] as const

type PaymentSidebarState =
  | { mode: "view"; payment: PaymentRow }
  | { mode: "edit"; payment: PaymentRow }
  | { mode: "add" }
  | null

type PaymentsPageContentProps = {
  paymentType: PaymentRow["type"]
}

function selectColumn<T>(t: TFunction<"payments">): ColumnDef<T> {
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
          aria-label={t("table.selectAll", { ns: "common" })}
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={t("table.selectRow", { ns: "common" })}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  }
}

function srNoColumn<T>(t: TFunction<"payments">): ColumnDef<T> {
  return {
    id: "srNo",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t("columns.srNo")} />
    ),
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
  t: TFunction<"payments">,
  partyLabel: string,
  openPaymentSidebar: (row: PaymentRow, mode: "view" | "edit") => void,
  onDelete: (row: PaymentRow) => void,
  onDuplicate: (row: PaymentRow) => void
): ColumnDef<PaymentRow>[] {
  return [
    selectColumn<PaymentRow>(t),
    srNoColumn<PaymentRow>(t),
    {
      accessorKey: "paymentNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("columns.paymentNumber")} />
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
        <DataTableColumnHeader column={column} title={t("columns.reference")} />
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
        <DataTableColumnHeader column={column} title={t("columns.date")} />
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
        <DataTableColumnHeader column={column} title={t("columns.amount")} align="center" />
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
        <DataTableColumnHeader column={column} title={t("columns.method")} />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">{row.original.paymentMethod}</span>
      ),
      meta: { dataTableFilter: false },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("columns.status")} />
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className={statusBadgeClass(row.original.status)}>
          {t(`status.${row.original.status}`, { ns: "common" })}
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
              <span className="sr-only">{t("actions.openMenu")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => openPaymentSidebar(row.original, "view")}>
              <IconEye />
              {t("actions.view")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openPaymentSidebar(row.original, "edit")}>
              <IconPencil />
              {t("actions.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(row.original)}>
              <IconCopy />
              {t("actions.duplicate")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(row.original)}>
              <IconTrash />
              {t("actions.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}

export function PaymentsPageContent({ paymentType }: PaymentsPageContentProps) {
  const { t } = useTranslation("payments")
  const isCustomer = paymentType === "customer"
  const partyLabel = isCustomer ? t("columns.customer") : t("columns.vendor")
  const addButtonLabel = isCustomer ? t("receive") : t("make")
  const searchPlaceholder = isCustomer
    ? t("searchCustomer")
    : t("searchVendor")
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
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [methodFilter, setMethodFilter] = useState("all")
  const [partyFilter, setPartyFilter] = useState("all")

  const typePayments = useMemo(
    () => payments.filter((row) => row.type === paymentType),
    [payments, paymentType]
  )
  const parties = useMemo(
    () =>
      [...new Set(typePayments.map((row) => row.partyName))]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [typePayments]
  )
  const filteredPayments = useMemo(
    () =>
      typePayments.filter((row) => {
        if (dateFrom && row.paymentDate < dateFrom) return false
        if (dateTo && row.paymentDate > dateTo) return false
        if (methodFilter !== "all" && row.paymentMethod !== methodFilter) {
          return false
        }
        if (partyFilter !== "all" && row.partyName !== partyFilter) return false
        return true
      }),
    [typePayments, dateFrom, dateTo, methodFilter, partyFilter]
  )
  const activeFilterCount =
    Number(Boolean(dateFrom)) +
    Number(Boolean(dateTo)) +
    Number(methodFilter !== "all") +
    Number(partyFilter !== "all")

  const closeSidebar = () => setSidebar(null)

  const handleDelete = useCallback(
    async (payment: PaymentRow) => {
      if (
        !(await confirmDeleteAction({
          itemName: payment.paymentNumber,
          entityLabel: t("entity.payment"),
        }))
      ) {
        return
      }
      removePayment(payment.id)
      if (sidebar?.mode !== "add" && sidebar?.payment.id === payment.id) {
        closeSidebar()
      }
      toast.message(t("toasts.removedNamed", { name: payment.paymentNumber }))
    },
    [removePayment, sidebar]
  )

  const handleDuplicate = useCallback(
    async (payment: PaymentRow) => {
      if (
        !(await confirmDuplicateAction({
          itemName: payment.paymentNumber,
          entityLabel: t("entity.payment"),
        }))
      ) {
        return
      }
      const copy = duplicatePayment(payment.id)
      if (copy) toast.success(t("toasts.duplicatedNamed", { name: copy.paymentNumber }))
    },
    [duplicatePayment]
  )

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const fd = new FormData(e.currentTarget)
      const partyName = String(fd.get("partyName") ?? "").trim()
      if (!partyName) {
        toast.error(isCustomer ? t("toasts.selectCustomer") : t("toasts.selectVendor"))
        return
      }

      const amount = Number(String(fd.get("amount") ?? "0"))
      if (!Number.isFinite(amount) || amount <= 0) {
        toast.error(t("toasts.invalidAmount"))
        return
      }

      fd.set("type", paymentType)

      if (sidebar?.mode === "add") {
        addPayment(paymentFromFormData(fd, 0))
        toast.success(isCustomer ? t("toasts.received") : t("toasts.recorded"))
        closeSidebar()
        return
      }

      if (sidebar?.mode === "edit" && sidebar.payment) {
        updatePayment(sidebar.payment.id, paymentFromFormData(fd, sidebar.payment.id))
        toast.success(t("toasts.saved"))
        closeSidebar()
      }
    },
    [sidebar, addPayment, updatePayment, isCustomer, paymentType]
  )

  const columns = useMemo(
    () =>
      getPaymentColumns(
        t,
        partyLabel,
        (row, mode) => setSidebar({ payment: row, mode }),
        handleDelete,
        handleDuplicate
      ),
    [t, partyLabel, handleDelete, handleDuplicate]
  )

  const statusTabs: DataTableTab[] = statusTabValues.map((value) => ({
    value,
    label: t(`tabs.${value}`),
  }))

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
                      ? t("sheet.edit")
                      : sheetPayment?.paymentNumber}
                </SheetTitle>
                <SheetDescription>
                  {sidebar.mode === "add" ? (
                    isCustomer
                      ? t("sheet.addCustomerDescription")
                      : t("sheet.addVendorDescription")
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
                      {t("actions.edit")}
                    </Button>
                    <SheetClose asChild>
                      <Button className="w-full sm:w-auto">
                        {t("actions.close", { ns: "common" })}
                      </Button>
                    </SheetClose>
                  </>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Button variant="outline" type="button">
                        {t("actions.cancel", { ns: "common" })}
                      </Button>
                    </SheetClose>
                    <Button type="submit" form={formId}>
                      {sidebar.mode === "add" ? addButtonLabel : t("sheet.save")}
                    </Button>
                  </>
                )}
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <div className="mb-5 rounded-xl border border-border/60 bg-card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <IconFilter className="text-muted-foreground size-4" />
            <div>
              <p className="text-sm font-semibold">{t("filters.title")}</p>
              <p className="text-muted-foreground text-xs">
                {isCustomer
                  ? t("filters.descriptionCustomer")
                  : t("filters.descriptionVendor")}
              </p>
            </div>
          </div>
          {activeFilterCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setDateFrom("")
                setDateTo("")
                setMethodFilter("all")
                setPartyFilter("all")
              }}
            >
              <IconX className="size-4" />
              {t("filters.clear", { count: activeFilterCount })}
            </Button>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor={`${paymentType}-payment-from`} className="text-xs">
              {t("filters.fromDate")}
            </Label>
            <Input
              id={`${paymentType}-payment-from`}
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(event) => setDateFrom(event.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${paymentType}-payment-to`} className="text-xs">
              {t("filters.toDate")}
            </Label>
            <Input
              id={`${paymentType}-payment-to`}
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => setDateTo(event.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${paymentType}-payment-method`} className="text-xs">
              {t("filters.method")}
            </Label>
            <select
              id={`${paymentType}-payment-method`}
              value={methodFilter}
              onChange={(event) => setMethodFilter(event.target.value)}
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs"
            >
              <option value="all">{t("filters.allMethods")}</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${paymentType}-payment-party`} className="text-xs">
              {partyLabel}
            </Label>
            <select
              id={`${paymentType}-payment-party`}
              value={partyFilter}
              onChange={(event) => setPartyFilter(event.target.value)}
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs"
            >
              <option value="all">
                {isCustomer ? t("filters.allCustomers") : t("filters.allVendors")}
              </option>
              {parties.map((party) => (
                <option key={party} value={party}>
                  {party}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-muted-foreground mt-3 text-xs">
          {t("filters.showing", {
            filtered: filteredPayments.length,
            total: typePayments.length,
          })}
        </p>
      </div>

      <DataTable
        data={filteredPayments}
        columns={columns}
        addButtonLabel={addButtonLabel}
        searchPlaceholder={searchPlaceholder}
        importSampleFilename={importSampleFilename}
        exportFilename={exportFilename}
        onImportRows={handleImportRows}
        onAddClick={() => setSidebar({ mode: "add" })}
        bulkActions={[
          {
            id: "delete",
            label: t("actions.deleteSelected"),
            icon: <IconTrash className="size-4" />,
            variant: "destructive",
            onClick: async (selected) => {
              if (
                !(await confirmDeleteAction({
                  count: selected.length,
                  entityLabel: t("entity.payment"),
                }))
              ) {
                return
              }
              const ids = new Set(selected.map((row) => row.id))
              setPayments((prev) => prev.filter((row) => !ids.has(row.id)))
              toast.message(t("toasts.removedCount", { count: selected.length }))
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
