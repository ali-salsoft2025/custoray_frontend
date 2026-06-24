"use client"

import { InvoicePdfButton } from "@/components/invoices/invoice-pdf-button"
import { formatDate, type OrderRow } from "@/lib/orders"
import { cn } from "@/lib/utils"

type PosInvoicePanelProps = {
  nextInvoiceNumber: string
  lastCreated: OrderRow | null
  justCreated: OrderRow | null
  formatMoney: (value: string) => string
  onDismissJustCreated?: () => void
  className?: string
}

export function PosInvoicePanel({
  nextInvoiceNumber,
  lastCreated,
  justCreated,
  formatMoney,
  onDismissJustCreated,
  className,
}: PosInvoicePanelProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-card px-3 py-2 text-xs shadow-sm shadow-black/[0.04] ring-1 ring-border/40",
        className
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-muted-foreground">Next invoice</span>
        <span className="font-semibold tabular-nums">{nextInvoiceNumber}</span>
      </div>

      {justCreated ? (
        <div className="bg-muted/40 mt-2 flex items-start justify-between gap-2 rounded-md px-2 py-1.5">
          <div className="min-w-0">
            <p className="font-medium tabular-nums">{justCreated.invoiceNumber}</p>
            <p className="text-muted-foreground truncate text-[10px]">
              {justCreated.customerName} · {formatMoney(justCreated.totalAmount)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <InvoicePdfButton order={justCreated} size="sm" variant="outline" label="PDF" />
            {onDismissJustCreated ? (
              <button
                type="button"
                onClick={onDismissJustCreated}
                className="text-muted-foreground hover:text-foreground text-[10px]"
              >
                ×
              </button>
            ) : null}
          </div>
        </div>
      ) : lastCreated ? (
        <p className="text-muted-foreground mt-1 truncate text-[10px]">
          Last {lastCreated.invoiceNumber} · {formatDate(lastCreated.orderDate)} ·{" "}
          {formatMoney(lastCreated.totalAmount)}
        </p>
      ) : null}
    </div>
  )
}
