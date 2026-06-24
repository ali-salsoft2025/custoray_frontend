"use client"

import { IconPlus, IconUser } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { InfiniteScrollSelect } from "@/components/ui/infinite-scroll-select"
import { cn } from "@/lib/utils"

type PosCustomerCardProps = {
  customerId: string
  customerName: string
  customerDescription?: string
  onCustomerChange: (value: string) => void
  onClearCustomer: () => void
  onAddCustomer: () => void
  customerOptions: {
    value: string
    label: string
    description?: string
  }[]
  walkInCustomerId: string
  className?: string
}

export function PosCustomerCard({
  customerId,
  customerName,
  customerDescription,
  onCustomerChange,
  onClearCustomer,
  onAddCustomer,
  customerOptions,
  walkInCustomerId,
  className,
}: PosCustomerCardProps) {
  const hasSelectedCustomer = customerId !== walkInCustomerId

  return (
    <div
      className={cn(
        "rounded-2xl bg-card p-4 shadow-sm shadow-black/[0.04] ring-1 ring-border/40",
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Customer</p>
        {hasSelectedCustomer ? (
          <Button type="button" variant="ghost" size="sm" onClick={onClearCustomer}>
            Clear
          </Button>
        ) : null}
      </div>

      <div className="bg-muted/40 mb-3 flex items-center gap-3 rounded-xl px-3 py-3">
        <div className="bg-background text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-full ring-1 ring-border/40">
          <IconUser className="size-5" stroke={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{customerName}</p>
          <p className="text-muted-foreground truncate text-xs">
            {customerDescription ?? "No customer record"}
          </p>
        </div>
      </div>

      <InfiniteScrollSelect
        id="pos-customer"
        value={customerId}
        onValueChange={onCustomerChange}
        options={customerOptions}
        placeholder="Search or select customer"
        searchPlaceholder="Search customers…"
        emptyMessage="No customers found."
        pageSize={10}
        onAddNew={onAddCustomer}
        addNewLabel="Add customer"
        className="h-10"
      />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground mt-2 h-8 w-full justify-start px-0 hover:bg-transparent hover:text-foreground"
        onClick={onAddCustomer}
      >
        <IconPlus className="mr-1.5 size-4" />
        Add new customer
      </Button>
    </div>
  )
}
