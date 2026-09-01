"use client"

import { IconMinus, IconPackage, IconPlus } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import type { ProductRow } from "@/lib/products"
import { cn } from "@/lib/utils"

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

export function StorefrontProductCard({
  product,
  inCartQty,
  formatPrice,
  onAdd,
  onQuantityChange,
}: {
  product: ProductRow
  inCartQty: number
  formatPrice: (value: string) => string
  onAdd: (product: ProductRow) => void
  onQuantityChange: (productId: number, quantity: number) => void
}) {
  const imageUrl = product.imageUrls?.[0]?.trim()

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border/40",
        "transition-shadow duration-200 hover:shadow-md"
      )}
    >
      <div className="bg-muted/40 relative aspect-[4/3] w-full overflow-hidden">
        {imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={imageUrl} alt="" className="size-full object-cover" />
        ) : (
          <div className="text-muted-foreground flex size-full flex-col items-center justify-center gap-1.5">
            <IconPackage className="size-7 opacity-40" stroke={1.5} />
            <span className="text-xs font-semibold tracking-wide uppercase">
              {initials(product.name)}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        <p className="line-clamp-2 text-[15px] leading-snug font-medium">{product.name}</p>
        <div className="mt-auto flex items-center justify-between gap-2">
          <p className="text-base font-semibold tabular-nums">
            {formatPrice(product.salePrice)}
          </p>
          {inCartQty === 0 ? (
            <Button
              type="button"
              className="h-11 rounded-full px-5 text-sm font-semibold"
              onClick={() => onAdd(product)}
            >
              Add
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-10 rounded-full"
                onClick={() => onQuantityChange(product.id, inCartQty - 1)}
              >
                <IconMinus className="size-4" />
              </Button>
              <span className="min-w-[1.5rem] text-center text-base font-semibold tabular-nums">
                {inCartQty}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-10 rounded-full"
                disabled={inCartQty >= product.stock}
                onClick={() => onQuantityChange(product.id, inCartQty + 1)}
              >
                <IconPlus className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
