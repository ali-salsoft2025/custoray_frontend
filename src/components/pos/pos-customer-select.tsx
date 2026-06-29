"use client"

import { IconPlus, IconUser, IconX } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { InfiniteScrollSelect } from "@/components/ui/infinite-scroll-select"
import { cn } from "@/lib/utils"

type PosCustomerSelectProps = {
  customerId: string
  customerName: string
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

export function PosCustomerSelect({
  customerId,
  customerName,
  onCustomerChange,
  onClearCustomer,
  onAddCustomer,
  customerOptions,
  walkInCustomerId,
  className,
}: PosCustomerSelectProps) {
  const hasSelectedCustomer = customerId !== walkInCustomerId

  return (
    <div className={cn("flex min-w-0 items-center gap-1", className)}>
      <InfiniteScrollSelect
        id="pos-customer-toolbar"
        value={customerId}
        onValueChange={onCustomerChange}
        options={customerOptions}
        placeholder="Customer"
        searchPlaceholder="Search customers…"
        emptyMessage="No customers found."
        pageSize={10}
        onAddNew={onAddCustomer}
        addNewLabel="Add customer"
        leadingIcon={<IconUser className="size-4" stroke={1.75} />}
        className="h-10 min-w-0 flex-1 rounded-full text-sm shadow-sm"
      />

      {hasSelectedCustomer ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0 rounded-full"
          onClick={onClearCustomer}
          aria-label={`Clear ${customerName}`}
        >
          <IconX className="size-4" />
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0 rounded-full"
          onClick={onAddCustomer}
          aria-label="Add customer"
        >
          <IconPlus className="size-4" />
        </Button>
      )}
    </div>
  )
}
