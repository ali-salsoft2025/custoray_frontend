"use client"

import { IconShoppingCart } from "@tabler/icons-react"

import { PosCartCheckout } from "@/components/pos/pos-cart-checkout"
import { PosCartLineControls } from "@/components/pos/pos-cart-line-controls"
import { Button } from "@/components/ui/button"
import {
  cartLineBaseTotal,
  cartLineHasAdjustment,
  cartLineTotal,
  type PosCartLine,
} from "@/lib/pos"
import { cn } from "@/lib/utils"

type PosCartPanelProps = {
  cart: PosCartLine[]
  selectedProductId: number | null
  onSelectLine: (productId: number) => void
  onQuantityChange: (productId: number, quantity: number) => void
  onFinalPriceChange: (productId: number, finalLineTotal: string | undefined) => void
  onRemoveLine: (productId: number) => void
  onClearCart: () => void
  formatMoney: (value: string) => string
  paymentMethod: Parameters<typeof PosCartCheckout>[0]["paymentMethod"]
  onPaymentMethodChange: Parameters<typeof PosCartCheckout>[0]["onPaymentMethodChange"]
  discountDraft: string
  onDiscountDraftChange: (value: string) => void
  onApplyDiscount: () => void
  onClearDiscount: () => void
  appliedDiscount: string
  subtotal: string
  total: string
  disabled?: boolean
  processing?: boolean
  onCompleteSale: () => void
  className?: string
}

export function PosCartPanel({
  cart,
  selectedProductId,
  onSelectLine,
  onQuantityChange,
  onFinalPriceChange,
  onRemoveLine,
  onClearCart,
  formatMoney,
  paymentMethod,
  onPaymentMethodChange,
  discountDraft,
  onDiscountDraftChange,
  onApplyDiscount,
  onClearDiscount,
  appliedDiscount,
  subtotal,
  total,
  disabled,
  processing,
  onCompleteSale,
  className,
}: PosCartPanelProps) {
  const cartItemCount = cart.reduce((sum, line) => sum + line.quantity, 0)
  const selectedLine =
    cart.find((line) => line.productId === selectedProductId) ?? cart[cart.length - 1] ?? null

  return (
    <aside
      className={cn(
        "flex flex-col overflow-hidden rounded-xl bg-card shadow-sm shadow-black/[0.04] ring-1 ring-border/40 xl:max-h-[calc(100vh-10rem)]",
        className
      )}
    >
      <div className="border-border/40 flex items-center justify-between gap-2 border-b px-3 py-2">
        <p className="text-xs font-semibold">
          Cart
          <span className="text-muted-foreground ml-1.5 font-normal">
            {cartItemCount === 0 ? "· empty" : `· ${cartItemCount}`}
          </span>
        </p>
        {cart.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-7 px-2 text-xs"
            onClick={onClearCart}
          >
            Clear
          </Button>
        ) : null}
      </div>

      <div className="min-h-[100px] flex-1 space-y-1.5 overflow-y-auto p-2">
        {cart.length === 0 ? (
          <div className="text-muted-foreground flex min-h-[80px] flex-col items-center justify-center gap-1.5 text-center text-xs">
            <IconShoppingCart className="size-5 opacity-30" stroke={1.5} />
            Tap a product to add
          </div>
        ) : (
          cart.map((line) => {
            const isSelected = line.productId === selectedLine?.productId
            const lineTotal = cartLineTotal(line)
            const hasAdjustment = cartLineHasAdjustment(line)

            return (
              <div
                key={line.productId}
                className={cn(
                  "rounded-lg ring-1 transition-colors",
                  isSelected
                    ? "bg-primary/[0.04] ring-primary/35"
                    : "bg-muted/25 ring-border/25"
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelectLine(line.productId)}
                  className="w-full px-2.5 py-2 text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">{line.productName}</p>
                      <p className="text-muted-foreground text-[10px] tabular-nums">
                        {line.quantity} × {formatMoney(line.unitPrice)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-semibold tabular-nums">
                        {formatMoney(lineTotal)}
                      </p>
                      {hasAdjustment && !isSelected ? (
                        <p className="text-muted-foreground text-[9px] line-through tabular-nums">
                          {formatMoney(cartLineBaseTotal(line))}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </button>

                {isSelected ? (
                  <div className="px-2.5 pb-2">
                    <PosCartLineControls
                      line={line}
                      formatMoney={formatMoney}
                      onQuantityChange={onQuantityChange}
                      onFinalPriceChange={onFinalPriceChange}
                      onRemove={onRemoveLine}
                    />
                  </div>
                ) : null}
              </div>
            )
          })
        )}
      </div>

      <PosCartCheckout
        paymentMethod={paymentMethod}
        onPaymentMethodChange={onPaymentMethodChange}
        discountDraft={discountDraft}
        onDiscountDraftChange={onDiscountDraftChange}
        onApplyDiscount={onApplyDiscount}
        onClearDiscount={onClearDiscount}
        appliedDiscount={appliedDiscount}
        subtotal={subtotal}
        total={total}
        formatMoney={formatMoney}
        disabled={disabled}
        processing={processing}
        onCompleteSale={onCompleteSale}
      />
    </aside>
  )
}
