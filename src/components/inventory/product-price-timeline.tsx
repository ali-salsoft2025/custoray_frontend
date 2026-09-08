"use client"

import { useEffect, useState } from "react"

import { formatMoney } from "@/lib/customers"
import {
  formatPriceTimelineDate,
  loadProductPriceHistory,
  priceFieldLabel,
  priceKindLabel,
  type ProductPriceEvent,
  type ProductPriceKind,
} from "@/lib/product-price-history"
import { cn } from "@/lib/utils"

const KIND_PILL: Record<ProductPriceKind, string> = {
  increased: "bg-amber-100 text-amber-800",
  decreased: "bg-emerald-100 text-emerald-800",
  set: "bg-sky-100 text-sky-800",
}

function eventLabel(event: ProductPriceEvent): string {
  return `${priceFieldLabel(event.field)} ${priceKindLabel(event.kind)}`
}

function eventAmount(event: ProductPriceEvent): string {
  if (event.previousPrice && event.kind !== "set") {
    return `${formatMoney(event.previousPrice)} → ${formatMoney(event.price)}`
  }
  return formatMoney(event.price)
}

export function ProductPriceTimeline({ sku }: { sku: string }) {
  const [events, setEvents] = useState<ProductPriceEvent[]>([])

  useEffect(() => {
    setEvents(sku ? loadProductPriceHistory(sku) : [])
  }, [sku])

  return (
    <section className="bg-card rounded-xl border px-4 py-4">
      <h3 className="mb-4 text-sm font-semibold tracking-tight">Timeline</h3>
      {events.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Price changes will appear here when this product&apos;s cost or sale price is updated.
        </p>
      ) : (
        <ol className="relative ms-1.5 space-y-5 border-l border-border/80 ps-5">
          {events.map((event) => (
            <li key={event.id} className="relative">
              <span className="absolute top-1.5 -left-[1.4375rem] size-2.5 rounded-full bg-sky-500" />
              <div className="flex flex-col gap-1">
                <span
                  className={cn(
                    "w-fit rounded-full px-2.5 py-0.5 text-xs font-medium",
                    KIND_PILL[event.kind]
                  )}
                >
                  {eventLabel(event)}
                </span>
                <p className="text-foreground text-xs font-medium tabular-nums">
                  {eventAmount(event)}
                </p>
                <p className="text-muted-foreground text-xs">
                  {formatPriceTimelineDate(event.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
