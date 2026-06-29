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

import { VendorDetail } from "@/components/vendors/vendor-detail"
import { VendorForm } from "@/components/vendors/vendor-form"
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
  statusLabel,
  vendorFromFormData,
  type VendorRow,
} from "@/lib/vendors"

const vendorTabs: DataTableTab[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
]

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
        <DataTableColumnHeader column={column} title="Description" />
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
        <DataTableColumnHeader column={column} title="Opening balance" align="center" />
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
        <DataTableColumnHeader column={column} title="Total purchases" align="center" />
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
        <DataTableColumnHeader column={column} title="Total payments" align="center" />
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
            <DropdownMenuItem onClick={() => openVendorSidebar(row.original, "view")}>
              <IconEye />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openVendorSidebar(row.original, "edit")}>
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

export default function VendorsPage() {
  const {
    vendors,
    setVendors,
    addVendor,
    updateVendor,
    removeVendor,
    duplicateVendor,
  } = useVendors()
  const [sidebar, setSidebar] = useState<VendorSidebarState>(null)

  const vendorStats = useMemo(() => {
    const active = vendors.filter((vendor) => vendor.status === "active")
    const outstanding = vendors.reduce((acc, vendor) => {
      const balance = Number(computeBalance(vendor))
      return acc + (Number.isFinite(balance) && balance > 0 ? balance : 0)
    }, 0)
    const totalPurchases = sumNumericField(vendors, (vendor) => vendor.totalPurchases)
    return {
      count: vendors.length,
      activeCount: active.length,
      outstanding,
      totalPurchases,
    }
  }, [vendors])

  const closeSidebar = () => setSidebar(null)

  const handleDelete = useCallback(
    async (vendor: VendorRow) => {
      if (
        !(await confirmDeleteAction({
          itemName: vendor.name,
          entityLabel: "vendor",
        }))
      ) {
        return
      }
      removeVendor(vendor.id)
      if (sidebar?.mode !== "add" && sidebar?.vendor.id === vendor.id) {
        closeSidebar()
      }
      toast.message(`Removed ${vendor.name} (demo).`)
    },
    [removeVendor, sidebar]
  )

  const handleDuplicate = useCallback(
    async (vendor: VendorRow) => {
      if (
        !(await confirmDuplicateAction({
          itemName: vendor.name,
          entityLabel: "vendor",
        }))
      ) {
        return
      }
      const copy = duplicateVendor(vendor.id)
      if (copy) toast.success(`Duplicated ${vendor.name} (demo).`)
    },
    [duplicateVendor]
  )

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const fd = new FormData(e.currentTarget)
      const name = String(fd.get("name") ?? "").trim()
      if (!name) {
        toast.error("Vendor name is required.")
        return
      }

      if (sidebar?.mode === "add") {
        addVendor(vendorFromFormData(fd, 0))
        toast.success("Vendor created (demo).")
        closeSidebar()
        return
      }

      if (sidebar?.mode === "edit" && sidebar.vendor) {
        updateVendor(sidebar.vendor.id, vendorFromFormData(fd, sidebar.vendor.id))
        toast.success("Vendor saved (demo).")
        closeSidebar()
      }
    },
    [sidebar, addVendor, updateVendor]
  )

  const columns = useMemo(
    () =>
      getVendorColumns(
        (row, mode) => setSidebar({ vendor: row, mode }),
        handleDelete,
        handleDuplicate
      ),
    [handleDelete, handleDuplicate]
  )

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
                    ? "Add vendor"
                    : sidebar.mode === "edit"
                      ? "Edit vendor"
                      : sheetVendor?.name}
                </SheetTitle>
                <SheetDescription>
                  {sidebar.mode === "add" ? (
                    "Fill in vendor details and photo. Saving is demo only."
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
                      {sidebar.mode === "add" ? "Create vendor" : "Save vendor"}
                    </Button>
                  </>
                )}
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <StatCardsGrid className="mb-5">
        <StatCard
          label="Vendors"
          value={String(vendorStats.count)}
          hint={`${vendorStats.activeCount} active`}
        />
        <StatCard
          label="Active"
          value={String(vendorStats.activeCount)}
          hint={`${vendorStats.count - vendorStats.activeCount} inactive`}
        />
        <StatCard
          label="Outstanding"
          value={formatMoney(vendorStats.outstanding.toFixed(2))}
          hint="Payable balance"
        />
        <StatCard
          label="Total purchases"
          value={formatMoney(vendorStats.totalPurchases.toFixed(2))}
          hint="Lifetime volume"
        />
      </StatCardsGrid>

      <DataTable
        data={vendors}
        columns={columns}
        addButtonLabel="Add vendor"
        searchPlaceholder="Search vendors..."
        importRowMapper={mapImportedVendor}
        importSampleFilename="vendors-sample.csv"
        exportFilename="vendors-export.csv"
        onDataChange={setVendors}
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
                  entityLabel: "vendor",
                }))
              ) {
                return
              }
              const ids = new Set(selected.map((v) => v.id))
              setVendors((prev) => prev.filter((r) => !ids.has(r.id)))
              toast.message(
                `Removed ${selected.length} vendor${selected.length === 1 ? "" : "s"} (demo).`
              )
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
