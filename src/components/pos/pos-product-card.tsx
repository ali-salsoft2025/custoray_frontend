"use client"

import { IconPackage } from "@tabler/icons-react"

import type { ProductRow } from "@/lib/products"
import { cn } from "@/lib/utils"

type PosProductCardProps = {
  product: ProductRow
  inCartQty: number
  formatPrice: (value: string) => string
  onAdd: (product: ProductRow) => void
  /** When false, out-of-stock items remain tappable (e.g. POS returns). */
  disableWhenOutOfStock?: boolean
  showSku?: boolean
  showStock?: boolean
  lowStockThreshold?: number
}

function productInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

export function PosProductCard({
  product,
  inCartQty,
  formatPrice,
  onAdd,
  disableWhenOutOfStock = true,
  showSku = true,
  showStock = true,
  lowStockThreshold = 5,
}: PosProductCardProps) {
  const outOfStock = product.stock <= 0
  const lowStock = !outOfStock && product.stock <= lowStockThreshold
  const imageUrl = product.imageUrls?.[0]?.trim()
  const isDisabled = disableWhenOutOfStock && outOfStock

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={() => onAdd(product)}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl bg-card text-left",
        "shadow-sm shadow-black/[0.04] ring-1 ring-border/40",
        "transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-border/60",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        isDisabled && "cursor-not-allowed opacity-55 hover:translate-y-0 hover:shadow-sm"
      )}
    >
      {inCartQty > 0 ? (
        <span className="bg-foreground text-background absolute top-1.5 right-1.5 z-10 flex size-5 items-center justify-center rounded-full text-[10px] font-semibold">
          {inCartQty}
        </span>
      ) : null}

      <div className="relative h-16 w-full shrink-0 overflow-hidden bg-muted/40">
        {imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl}
            alt=""
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="text-muted-foreground flex size-full items-center justify-center gap-2 bg-gradient-to-b from-muted/30 to-muted/60 px-2">
            <div className="bg-background/70 flex size-8 shrink-0 items-center justify-center rounded-md ring-1 ring-border/40">
              <IconPackage className="size-4" stroke={1.5} />
            </div>
            <span className="text-muted-foreground/80 truncate text-[10px] font-semibold tracking-wide uppercase">
              {productInitials(product.name)}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-2.5">
        <div className="min-h-0 flex-1">
          <p className="line-clamp-2 text-sm leading-snug font-medium">{product.name}</p>
          {showSku ? (
            <p className="text-muted-foreground mt-0.5 truncate text-xs">
              {product.sku}
              {product.brand && product.brand !== "—" ? ` · ${product.brand}` : ""}
            </p>
          ) : product.brand && product.brand !== "—" ? (
            <p className="text-muted-foreground mt-0.5 truncate text-xs">{product.brand}</p>
          ) : null}
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 border-t border-border/40 pt-2">
          <span className="text-foreground text-sm font-semibold tabular-nums">
            {formatPrice(product.salePrice)}
          </span>
          {showStock ? (
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-[10px] font-medium",
                outOfStock && "bg-muted text-muted-foreground",
                lowStock && "bg-amber-500/10 text-amber-800 dark:text-amber-300",
                !outOfStock && !lowStock && "bg-muted/80 text-muted-foreground"
              )}
            >
              {outOfStock ? "Out of stock" : `${product.stock} avail.`}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  )
}
