"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PAYMENT_METHODS, type OrderRow } from "@/lib/orders"
import { normalizeDiscountAmount } from "@/lib/pos"

type PosCartCheckoutProps = {
  paymentMethod: OrderRow["paymentMethod"]
  onPaymentMethodChange: (value: OrderRow["paymentMethod"]) => void
  discountDraft: string
  onDiscountDraftChange: (value: string) => void
  onApplyDiscount: () => void
  onClearDiscount: () => void
  appliedDiscount: string
  subtotal: string
  total: string
  formatMoney: (value: string) => string
  disabled?: boolean
  processing?: boolean
  onCompleteSale: () => void
}

export function PosCartCheckout({
  paymentMethod,
  onPaymentMethodChange,
  discountDraft,
  onDiscountDraftChange,
  onApplyDiscount,
  onClearDiscount,
  appliedDiscount,
  subtotal,
  total,
  formatMoney,
  disabled,
  processing,
  onCompleteSale,
}: PosCartCheckoutProps) {
  const hasDiscount = Number(appliedDiscount) > 0

  return (
    <div className="border-border/40 space-y-2.5 border-t p-2.5">
      <div className="space-y-1">
        <Label htmlFor="pos-payment" className="text-[10px] font-medium uppercase tracking-wide">
          Payment
        </Label>
        <Select
          value={paymentMethod}
          onValueChange={(value) =>
            onPaymentMethodChange(value as OrderRow["paymentMethod"])
          }
        >
          <SelectTrigger id="pos-payment" className="h-8 w-full text-xs">
            <SelectValue placeholder="Payment method" />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_METHODS.map((method) => (
              <SelectItem key={method} value={method}>
                {method}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="pos-discount" className="text-[10px] font-medium uppercase tracking-wide">
          Discount
        </Label>
        <div className="flex gap-1.5">
          <Input
            id="pos-discount"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={discountDraft}
            onChange={(event) => onDiscountDraftChange(event.target.value)}
            placeholder="0.00"
            disabled={disabled}
            className="h-8 text-xs"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0 px-2.5 text-xs"
            disabled={disabled}
            onClick={onApplyDiscount}
          >
            Apply
          </Button>
        </div>
        {hasDiscount ? (
          <button
            type="button"
            onClick={onClearDiscount}
            className="text-muted-foreground hover:text-foreground text-[10px] font-medium"
          >
            Remove discount
          </button>
        ) : null}
      </div>

      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="tabular-nums">{formatMoney(subtotal)}</span>
        </div>
        {hasDiscount ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Discount</span>
            <span className="tabular-nums">−{formatMoney(appliedDiscount)}</span>
          </div>
        ) : null}
        <div className="bg-muted/40 flex items-center justify-between rounded-md px-2.5 py-2">
          <span className="font-medium">Total</span>
          <span className="text-base font-semibold tabular-nums">{formatMoney(total)}</span>
        </div>
      </div>

      <Button
        type="button"
        className="h-9 w-full text-sm"
        disabled={disabled || processing}
        onClick={onCompleteSale}
      >
        {processing ? "Processing…" : "Complete sale"}
      </Button>
    </div>
  )
}

export function applyPosDiscount(subtotal: string, discountDraft: string): string {
  return normalizeDiscountAmount(subtotal, discountDraft.trim() || "0")
}
