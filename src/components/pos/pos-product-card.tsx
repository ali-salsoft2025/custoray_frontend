"use client"

import { IconPackage } from "@tabler/icons-react"

import type { ProductRow } from "@/lib/products"
import { cn } from "@/lib/utils"

type PosProductCardProps = {
  product: ProductRow
  inCartQty: number
  formatPrice: (value: string) => string
  onAdd: (product: ProductRow) => void
}

export function PosProductCard({
  product,
  inCartQty,
  formatPrice,
  onAdd,
}: PosProductCardProps) {
  const outOfStock = product.stock <= 0
  const lowStock = !outOfStock && product.stock <= 5
  const imageUrl = product.imageUrls?.[0]

  return (
    <button
      type="button"
      disabled={outOfStock}
      onClick={() => onAdd(product)}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl bg-card text-left",
        "shadow-sm shadow-black/[0.04] ring-1 ring-border/40",
        "transition-colors hover:ring-border/60",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        outOfStock && "cursor-not-allowed opacity-55"
      )}
    >
      {inCartQty > 0 ? (
        <span className="bg-foreground text-background absolute top-1.5 right-1.5 z-10 flex size-5 items-center justify-center rounded-full text-[10px] font-semibold">
          {inCartQty}
        </span>
      ) : null}

      {imageUrl ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="size-full object-cover" />
        </div>
      ) : null}

      <div className={cn("flex flex-1 flex-col gap-1.5 p-2.5", !imageUrl && "pt-3")}>
        {!imageUrl ? (
          <div className="bg-muted/50 text-muted-foreground flex size-7 items-center justify-center rounded-lg">
            <IconPackage className="size-3.5" stroke={1.5} />
          </div>
        ) : null}

        <div className="min-h-0 flex-1">
          <p className="line-clamp-2 text-xs leading-snug font-medium">{product.name}</p>
          <p className="text-muted-foreground mt-0.5 truncate text-[10px]">
            {product.sku}
            {product.brand && product.brand !== "—" ? ` · ${product.brand}` : ""}
          </p>
        </div>

        <div className="flex items-center justify-between gap-1 border-t border-border/30 pt-1.5">
          <span className="text-foreground text-sm font-semibold tabular-nums">
            {formatPrice(product.salePrice)}
          </span>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[9px] font-medium",
              outOfStock && "bg-muted text-muted-foreground",
              lowStock && "bg-amber-500/10 text-amber-800 dark:text-amber-300",
              !outOfStock && !lowStock && "text-muted-foreground"
            )}
          >
            {outOfStock ? "Out" : `${product.stock}`}
          </span>
        </div>
      </div>
    </button>
  )
}
