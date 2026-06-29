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
import { ORDER_STATUSES, PAYMENT_METHODS, statusLabel, type OrderRow } from "@/lib/orders"
import { normalizeDiscountAmount } from "@/lib/pos"
import { formatMoney as formatCurrency } from "@/lib/customers"
import { cn } from "@/lib/utils"

function formatPosPositive(value: string) {
  return formatCurrency(value).replace(/^\$/, "Rs ")
}

type PosCartCheckoutProps = {
  paymentMethod: OrderRow["paymentMethod"]
  onPaymentMethodChange: (value: OrderRow["paymentMethod"]) => void
  status: OrderRow["status"]
  onStatusChange: (value: OrderRow["status"]) => void
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
  variant?: "sale" | "return"
  enabledPaymentMethods?: OrderRow["paymentMethod"][]
  allowDiscounts?: boolean
  allowPartialPayment?: boolean
  paidAmountDraft?: string
  onPaidAmountDraftChange?: (value: string) => void
}

export function PosCartCheckout({
  paymentMethod,
  onPaymentMethodChange,
  status,
  onStatusChange,
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
  variant = "sale",
  enabledPaymentMethods = [...PAYMENT_METHODS],
  allowDiscounts = true,
  allowPartialPayment = false,
  paidAmountDraft = "",
  onPaidAmountDraftChange,
}: PosCartCheckoutProps) {
  const isReturn = variant === "return"
  const hasDiscount = Number(appliedDiscount) > 0
  const showPartialPayment = !isReturn && allowPartialPayment
  const balanceDue = Math.max(
    0,
    Number(total) - (Number(paidAmountDraft) || 0)
  ).toFixed(2)

  const actionLabel = processing
    ? "Processing…"
    : isReturn
      ? status === "completed"
        ? "Complete return"
        : status === "pending"
          ? "Save pending return"
          : "Save cancelled return"
      : status === "completed"
        ? "Complete sale"
        : status === "pending"
          ? "Save pending sale"
          : "Save cancelled sale"

  return (
    <div className="border-border/40 space-y-3 border-t p-4">
      <div className="space-y-1.5">
        <Label htmlFor="pos-payment" className="text-xs">
          {isReturn ? "Refund method" : "Payment method"}
        </Label>
        <Select
          value={paymentMethod}
          onValueChange={(value) =>
            onPaymentMethodChange(value as OrderRow["paymentMethod"])
          }
        >
          <SelectTrigger id="pos-payment" className="h-10 w-full">
            <SelectValue placeholder="Select payment method" />
          </SelectTrigger>
          <SelectContent>
            {enabledPaymentMethods.map((method) => (
              <SelectItem key={method} value={method}>
                {method}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pos-status" className="text-xs">
          Status
        </Label>
        <Select
          value={status}
          onValueChange={(value) => onStatusChange(value as OrderRow["status"])}
        >
          <SelectTrigger id="pos-status" className="h-10 w-full">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUSES.map((option) => (
              <SelectItem key={option} value={option}>
                {statusLabel(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {allowDiscounts ? (
        <div className="space-y-1.5">
          <Label htmlFor="pos-discount" className="text-xs">
            Discount
          </Label>
          <div className="flex gap-2">
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
              className="h-10"
            />
            <Button
              type="button"
              variant="outline"
              className="h-10 shrink-0"
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
              className="text-muted-foreground hover:text-foreground text-xs font-medium"
            >
              Remove discount
            </button>
          ) : null}
        </div>
      ) : null}

      {showPartialPayment ? (
        <div className="space-y-1.5">
          <Label htmlFor="pos-paid-amount" className="text-xs">
            Amount paid
          </Label>
          <Input
            id="pos-paid-amount"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={paidAmountDraft}
            onChange={(event) => onPaidAmountDraftChange?.(event.target.value)}
            placeholder={total}
            disabled={disabled}
            className="h-10"
          />
        </div>
      ) : null}

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="tabular-nums">{formatMoney(subtotal)}</span>
        </div>
        {hasDiscount ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Discount</span>
            <span className="tabular-nums">
              −{isReturn ? formatPosPositive(appliedDiscount) : formatMoney(appliedDiscount)}
            </span>
          </div>
        ) : null}
        {showPartialPayment ? (
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground">Balance due</span>
            <span className="font-medium tabular-nums">{formatPosPositive(balanceDue)}</span>
          </div>
        ) : null}
        <div
          className={cn(
            "flex items-center justify-between rounded-lg px-3 py-3",
            isReturn ? "bg-amber-500/10" : "bg-muted/40"
          )}
        >
          <span className="font-medium">{isReturn ? "Refund total" : "Total due"}</span>
          <span
            className={cn(
              "text-lg font-semibold tabular-nums",
              isReturn && "text-amber-900 dark:text-amber-300"
            )}
          >
            {formatMoney(total)}
          </span>
        </div>
      </div>

      <Button
        type="button"
        className="h-11 w-full"
        disabled={disabled || processing}
        onClick={onCompleteSale}
      >
        {actionLabel}
      </Button>
    </div>
  )
}

export function applyPosDiscount(subtotal: string, discountDraft: string): string {
  return normalizeDiscountAmount(subtotal, discountDraft.trim() || "0")
}
