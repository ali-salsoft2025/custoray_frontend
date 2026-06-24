"use client"

import { useCallback, useMemo, useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  computePaymentImpact,
  computeReturnTotal,
  formatMoney,
  type ReturnLineRow,
  type ReturnRow,
} from "@/lib/returns"

type ReturnFormProps = {
  formId: string
  returnDoc: ReturnRow
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
}

export function ReturnForm({ formId, returnDoc, onSubmit }: ReturnFormProps) {
  const [lines, setLines] = useState<ReturnLineRow[]>(
    returnDoc.lines.length > 0 ? returnDoc.lines : []
  )

  const returnTotal = useMemo(() => computeReturnTotal(lines), [lines])

  const paymentImpact = useMemo(
    () =>
      computePaymentImpact(
        returnDoc.sourcePaidAmount,
        returnDoc.sourceTotalBefore,
        returnTotal
      ),
    [returnDoc.sourcePaidAmount, returnDoc.sourceTotalBefore, returnTotal]
  )

  const updateLine = useCallback((index: number, quantity: number) => {
    setLines((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line
        const qty = Math.min(Math.max(1, quantity), line.maxQuantity)
        const lineTotal = (Number(line.unitPrice) * qty).toFixed(2)
        return { ...line, quantity: qty, lineTotal }
      })
    )
  }, [])

  const typeLabel = returnDoc.type === "sales" ? "Sale" : "Purchase"
  const partyLabel = returnDoc.type === "sales" ? "Customer" : "Vendor"

  return (
    <form id={formId} className="flex flex-col gap-4 text-sm" onSubmit={onSubmit}>
      <input type="hidden" name="type" value={returnDoc.type} />
      <input type="hidden" name="sourceId" value={returnDoc.sourceId} />
      <input type="hidden" name="referenceNumber" value={returnDoc.referenceNumber} />
      <input type="hidden" name="partyName" value={returnDoc.partyName} />
      <input type="hidden" name="sourcePaidAmount" value={returnDoc.sourcePaidAmount} />
      <input type="hidden" name="sourceTotalBefore" value={returnDoc.sourceTotalBefore} />
      <input type="hidden" name="refundedAmount" value={paymentImpact.refundDue} />

      <div className="bg-muted/30 border-border/60 rounded-lg border p-3 text-sm">
        <p className="text-muted-foreground">
          {typeLabel} return ·{" "}
          <span className="text-foreground font-medium">{returnDoc.referenceNumber}</span>
        </p>
        <p className="text-muted-foreground mt-1">
          {partyLabel}:{" "}
          <span className="text-foreground">{returnDoc.partyName}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${formId}-returnNumber`}>Return #</Label>
          <Input
            id={`${formId}-returnNumber`}
            name="returnNumber"
            defaultValue={returnDoc.returnNumber}
            placeholder={returnDoc.type === "sales" ? "SR-3001" : "PR-3001"}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${formId}-returnDate`}>Return date</Label>
          <Input
            id={`${formId}-returnDate`}
            name="returnDate"
            type="date"
            defaultValue={returnDoc.returnDate}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${formId}-description`}>Notes</Label>
        <Input
          id={`${formId}-description`}
          name="description"
          defaultValue={returnDoc.description === "—" ? "" : returnDoc.description}
          placeholder="Reason for return…"
        />
      </div>

      <div className="flex flex-col gap-3">
        <Label>Items to return</Label>
        <div className="flex flex-col gap-3">
          {lines.map((line, index) => (
            <div
              key={`${line.id}-${index}`}
              className="border-border/60 bg-muted/20 space-y-2 rounded-lg border p-3"
            >
              <input type="hidden" name={`lines[${index}].id`} value={line.id} />
              <input
                type="hidden"
                name={`lines[${index}].sourceLineId`}
                value={line.sourceLineId}
              />
              <input
                type="hidden"
                name={`lines[${index}].productName`}
                value={line.productName}
              />
              <input
                type="hidden"
                name={`lines[${index}].maxQuantity`}
                value={line.maxQuantity}
              />
              <input
                type="hidden"
                name={`lines[${index}].unitPrice`}
                value={line.unitPrice}
              />
              <p className="text-foreground font-medium">{line.productName}</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`${formId}-qty-${index}`}>Return qty</Label>
                  <Input
                    id={`${formId}-qty-${index}`}
                    name={`lines[${index}].quantity`}
                    type="number"
                    min={1}
                    max={line.maxQuantity}
                    value={line.quantity}
                    onChange={(e) => updateLine(index, Number(e.target.value) || 1)}
                  />
                  <span className="text-muted-foreground text-xs">
                    Max {line.maxQuantity}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Unit price</Label>
                  <div className="text-muted-foreground flex h-9 items-center tabular-nums">
                    {formatMoney(line.unitPrice)}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Line total</Label>
                  <div className="text-foreground flex h-9 items-center tabular-nums">
                    {line.lineTotal}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-border/60 bg-muted/20 space-y-2 rounded-lg border p-3">
        <p className="text-foreground font-medium">Payment impact</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <span className="text-muted-foreground">Original total</span>
          <span className="text-right tabular-nums">
            {formatMoney(returnDoc.sourceTotalBefore)}
          </span>
          <span className="text-muted-foreground">Paid amount</span>
          <span className="text-right tabular-nums">
            {formatMoney(returnDoc.sourcePaidAmount)}
          </span>
          <span className="text-muted-foreground">Return amount</span>
          <span className="text-right tabular-nums text-amber-700 dark:text-amber-400">
            −{returnTotal}
          </span>
          <span className="text-muted-foreground">New total</span>
          <span className="text-right tabular-nums">
            {formatMoney(paymentImpact.sourceTotalAfter)}
          </span>
          {Number(paymentImpact.refundDue) > 0 ? (
            <>
              <span className="text-muted-foreground">Refund due</span>
              <span className="text-right font-medium text-emerald-700 tabular-nums dark:text-emerald-400">
                {formatMoney(paymentImpact.refundDue)}
              </span>
            </>
          ) : null}
          {Number(paymentImpact.balanceDue) > 0 ? (
            <>
              <span className="text-muted-foreground">Balance due</span>
              <span className="text-right font-medium text-amber-700 tabular-nums dark:text-amber-400">
                {formatMoney(paymentImpact.balanceDue)}
              </span>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${formId}-status`}>Status</Label>
        <select
          id={`${formId}-status`}
          name="status"
          defaultValue={returnDoc.status}
          className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        >
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
    </form>
  )
}
