"use client"

import * as React from "react"
import { IconMinus, IconPlus, IconRotateClockwise, IconTrash } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  cartLineAdjustment,
  cartLineBaseTotal,
  cartLineHasAdjustment,
  type PosCartLine,
} from "@/lib/pos"
import { cn } from "@/lib/utils"

type PosCartLineControlsProps = {
  line: PosCartLine
  formatMoney: (value: string) => string
  onQuantityChange: (productId: number, quantity: number) => void
  onFinalPriceChange: (productId: number, finalLineTotal: string | undefined) => void
  onRemove: (productId: number) => void
}

export function PosCartLineControls({
  line,
  formatMoney,
  onQuantityChange,
  onFinalPriceChange,
  onRemove,
}: PosCartLineControlsProps) {
  const [qtyDraft, setQtyDraft] = React.useState(String(line.quantity))
  const [priceDraft, setPriceDraft] = React.useState("")

  React.useEffect(() => {
    setQtyDraft(String(line.quantity))
  }, [line.productId, line.quantity])

  React.useEffect(() => {
    if (line.finalLineTotal !== undefined && line.finalLineTotal !== "") {
      setPriceDraft(line.finalLineTotal)
      return
    }
    setPriceDraft(cartLineBaseTotal(line))
  }, [line.finalLineTotal, line.quantity, line.unitPrice])

  const baseTotal = cartLineBaseTotal(line)
  const adjustment = cartLineAdjustment(line)
  const adjustmentNum = Number(adjustment)
  const hasAdjustment = cartLineHasAdjustment(line)

  const applyQuantity = (raw: string) => {
    const parsed = Number.parseInt(raw, 10)
    if (!Number.isFinite(parsed) || parsed <= 0) return
    onQuantityChange(line.productId, Math.min(parsed, line.maxStock))
    setQtyDraft(String(Math.min(parsed, line.maxStock)))
  }

  const applyPrice = (raw: string) => {
    const parsed = Number(raw)
    if (!Number.isFinite(parsed) || parsed < 0) return
    const normalized = parsed.toFixed(2)
    if (Math.abs(parsed - Number(baseTotal)) < 0.005) {
      onFinalPriceChange(line.productId, undefined)
      setPriceDraft(baseTotal)
      return
    }
    onFinalPriceChange(line.productId, normalized)
    setPriceDraft(normalized)
  }

  return (
    <div className="space-y-2 border-t border-border/30 pt-2">
      <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
        <div>
          <p className="text-muted-foreground mb-1 text-[10px] font-medium uppercase tracking-wide">
            Qty
          </p>
          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-7 shrink-0 rounded-md"
              onClick={() => applyQuantity(String(Math.max(1, line.quantity - 1)))}
            >
              <IconMinus className="size-3" />
            </Button>
            <Input
              inputMode="numeric"
              value={qtyDraft}
              onChange={(event) => setQtyDraft(event.target.value.replace(/\D/g, ""))}
              onBlur={() => {
                if (qtyDraft.trim()) applyQuantity(qtyDraft)
                else setQtyDraft(String(line.quantity))
              }}
              className="h-7 px-1 text-center text-xs font-semibold tabular-nums"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-7 shrink-0 rounded-md"
              onClick={() =>
                applyQuantity(String(Math.min(line.maxStock, line.quantity + 1)))
              }
            >
              <IconPlus className="size-3" />
            </Button>
          </div>
        </div>

        <div>
          <p className="text-muted-foreground mb-1 text-[10px] font-medium uppercase tracking-wide">
            Total
          </p>
          <Input
            inputMode="decimal"
            value={priceDraft}
            onChange={(event) =>
              setPriceDraft(event.target.value.replace(/[^\d.]/g, ""))
            }
            onBlur={() => {
              if (priceDraft.trim()) applyPrice(priceDraft)
            }}
            className="h-7 text-xs font-semibold tabular-nums"
          />
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive size-7 shrink-0"
          onClick={() => onRemove(line.productId)}
          aria-label="Remove"
        >
          <IconTrash className="size-3.5" />
        </Button>
      </div>

      <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px]">
        <span>List {formatMoney(baseTotal)}</span>
        {hasAdjustment ? (
          <>
            <span
              className={cn(
                "font-medium",
                adjustmentNum < 0 && "text-emerald-600 dark:text-emerald-400",
                adjustmentNum > 0 && "text-amber-700 dark:text-amber-400"
              )}
            >
              {adjustmentNum < 0
                ? `${formatMoney(Math.abs(adjustmentNum).toFixed(2))} off`
                : `+${formatMoney(adjustment)}`}
            </span>
            <button
              type="button"
              onClick={() => {
                onFinalPriceChange(line.productId, undefined)
                setPriceDraft(baseTotal)
              }}
              className="hover:text-foreground inline-flex items-center gap-0.5 font-medium"
            >
              <IconRotateClockwise className="size-2.5" />
              Reset
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}
