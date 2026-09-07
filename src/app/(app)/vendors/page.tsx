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
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"

import { VendorDetail } from "@/components/vendors/vendor-detail"
import { VendorForm } from "@/components/vendors/vendor-form"
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
import { useVendors } from "@/context/vendors-context"
import {
  confirmDeleteAction,
  confirmDuplicateAction,
} from "@/lib/confirm-action"
import {
  computeBalance,
  EMPTY_VENDOR,
  formatMoney,
  mapImportedVendor,
  statusBadgeClass,
  vendorFromFormData,
  type VendorRow,
} from "@/lib/vendors"

type VendorSidebarState =
  | { mode: "view"; vendor: VendorRow }
  | { mode: "edit"; vendor: VendorRow }
  | { mode: "add" }
  | null

function vendorTabFilter(row: VendorRow, tab: string) {
  if (tab === "all") return true
  return row.status === tab
}

function getVendorColumns(
  t: TFunction<"vendors">,
  openVendorSidebar: (row: VendorRow, mode: "view" | "edit") => void,
  onDelete: (row: VendorRow) => void,
  onDuplicate: (row: VendorRow) => void
): ColumnDef<VendorRow>[] {
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
    },
    {
      accessorKey: "id",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("columns.id")} />
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
        <DataTableColumnHeader column={column} title={t("columns.name")} />
      ),
      cell: ({ row }) => (
        <button
          type="button"
          className="text-foreground text-left font-medium hover:underline"
          onClick={() => openVendorSidebar(row.original, "view")}
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
        <DataTableColumnHeader column={column} title={t("columns.description")} />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground max-w-[12rem] truncate">
          {row.original.description}
        </span>
      ),
      meta: { dataTableFilter: false },
    },
    {
      accessorKey: "openingBalance",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("columns.openingBalance")} align="center" />
      ),
      cell: ({ row }) => (
        <div className="flex justify-center">
          <span className="text-foreground tabular-nums">
            {formatMoney(row.original.openingBalance)}
          </span>
        </div>
      ),
      meta: { dataTableFilter: false },
    },
    {
      accessorKey: "totalPurchases",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("columns.totalPurchases")} align="center" />
      ),
      cell: ({ row }) => (
        <div className="flex justify-center">
          <span className="text-foreground tabular-nums">
            {formatMoney(row.original.totalPurchases)}
          </span>
        </div>
      ),
      meta: { dataTableFilter: false },
    },
    {
      accessorKey: "totalPayments",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("columns.totalPayments")} align="center" />
      ),
      cell: ({ row }) => (
        <div className="flex justify-center">
          <span className="text-foreground tabular-nums">
            {formatMoney(row.original.totalPayments)}
          </span>
        </div>
      ),
      meta: { dataTableFilter: false },
    },
    {
      id: "balance",
      accessorFn: (row) => Number(computeBalance(row)),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("columns.balance")} align="center" />
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
      accessorKey: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("columns.phone")} />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular-nums text-xs">{row.original.phone}</span>
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
            <DropdownMenuItem onClick={() => openVendorSidebar(row.original, "view")}>
              <IconEye />
              {t("actions.view")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openVendorSidebar(row.original, "edit")}>
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

export default function VendorsPage() {
  const { t } = useTranslation("vendors")
  const {
    vendors,
    setVendors,
    addVendor,
    updateVendor,
    removeVendor,
    duplicateVendor,
  } = useVendors()
  const [sidebar, setSidebar] = useState<VendorSidebarState>(null)

  const closeSidebar = () => setSidebar(null)

  const handleDelete = useCallback(
    async (vendor: VendorRow) => {
      if (
        !(await confirmDeleteAction({
          itemName: vendor.name,
          entityLabel: t("entity.vendor"),
        }))
      ) {
        return
      }
      removeVendor(vendor.id)
      if (sidebar?.mode !== "add" && sidebar?.vendor.id === vendor.id) {
        closeSidebar()
      }
      toast.message(t("toasts.removedNamed", { name: vendor.name }))
    },
    [removeVendor, sidebar]
  )

  const handleDuplicate = useCallback(
    async (vendor: VendorRow) => {
      if (
        !(await confirmDuplicateAction({
          itemName: vendor.name,
          entityLabel: t("entity.vendor"),
        }))
      ) {
        return
      }
      const copy = duplicateVendor(vendor.id)
      if (copy) toast.success(t("toasts.duplicatedNamed", { name: vendor.name }))
    },
    [duplicateVendor]
  )

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const fd = new FormData(e.currentTarget)
      const name = String(fd.get("name") ?? "").trim()
      if (!name) {
        toast.error(t("toasts.nameRequired"))
        return
      }

      if (sidebar?.mode === "add") {
        addVendor(vendorFromFormData(fd, 0))
        toast.success(t("toasts.created"))
        closeSidebar()
        return
      }

      if (sidebar?.mode === "edit" && sidebar.vendor) {
        updateVendor(sidebar.vendor.id, vendorFromFormData(fd, sidebar.vendor.id))
        toast.success(t("toasts.saved"))
        closeSidebar()
      }
    },
    [sidebar, addVendor, updateVendor]
  )

  const columns = useMemo(
    () =>
      getVendorColumns(
        t,
        (row, mode) => setSidebar({ vendor: row, mode }),
        handleDelete,
        handleDuplicate
      ),
    [t, handleDelete, handleDuplicate]
  )

  const vendorTabs: DataTableTab[] = [
    { value: "all", label: t("tabs.all") },
    { value: "active", label: t("tabs.active") },
    { value: "inactive", label: t("tabs.inactive") },
  ]

  const sheetVendor = sidebar && sidebar.mode !== "add" ? sidebar.vendor : null
  const formVendor =
    sidebar?.mode === "add" ? EMPTY_VENDOR : sheetVendor ?? EMPTY_VENDOR
  const formId =
    sidebar?.mode === "add"
      ? "vendor-add-form"
      : sheetVendor
        ? `vendor-edit-${sheetVendor.id}`
        : "vendor-edit"

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
                    ? t("sheet.add")
                    : sidebar.mode === "edit"
                      ? t("sheet.edit")
                      : sheetVendor?.name}
                </SheetTitle>
                <SheetDescription>
                  {sidebar.mode === "add" ? (
                    t("sheet.addDescription")
                  ) : sidebar.mode === "edit" && sheetVendor ? (
                    <>
                      {sheetVendor.name}
                      <span className="text-muted-foreground"> · ID {sheetVendor.id}</span>
                    </>
                  ) : sheetVendor ? (
                    <>
                      ID {sheetVendor.id}
                      {sheetVendor.phone ? ` · ${sheetVendor.phone}` : ""}
                    </>
                  ) : null}
                </SheetDescription>
              </SheetHeader>
              <div
                key={
                  sidebar.mode === "add"
                    ? "add"
                    : `${sheetVendor?.id}-${sidebar.mode}`
                }
                className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
              >
                {sidebar.mode === "view" && sheetVendor ? (
                  <VendorDetail vendor={sheetVendor} />
                ) : sidebar.mode === "edit" || sidebar.mode === "add" ? (
                  <VendorForm formId={formId} vendor={formVendor} onSubmit={handleSubmit} />
                ) : null}
              </div>
              <SheetFooter className="border-border/60 gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end">
                {sidebar.mode === "view" ? (
                  <>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() =>
                        sheetVendor &&
                        setSidebar({ mode: "edit", vendor: sheetVendor })
                      }
                    >
                      {t("actions.edit")}
                    </Button>
                    <SheetClose asChild>
                      <Button className="w-full sm:w-auto">{t("actions.close", { ns: "common" })}</Button>
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
                      {sidebar.mode === "add" ? t("sheet.create") : t("sheet.save")}
                    </Button>
                  </>
                )}
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <DataTable
        data={vendors}
        columns={columns}
        addButtonLabel={t("addButton")}
        searchPlaceholder={t("search")}
        importRowMapper={mapImportedVendor}
        importSampleFilename="vendors-sample.csv"
        exportFilename="vendors-export.csv"
        onDataChange={setVendors}
        onAddClick={() => setSidebar({ mode: "add" })}
        defaultColumnVisibility={{ status: false, actions: false }}
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
                  entityLabel: t("entity.vendor"),
                }))
              ) {
                return
              }
              const ids = new Set(selected.map((v) => v.id))
              setVendors((prev) => prev.filter((r) => !ids.has(r.id)))
              toast.message(t("toasts.removedCount", { count: selected.length }))
            },
          },
        ]}
        tabs={vendorTabs}
        defaultTab="all"
        tabFilter={vendorTabFilter}
      />
    </>
  )
}
