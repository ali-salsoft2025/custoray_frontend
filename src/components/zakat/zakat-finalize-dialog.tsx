"use client"

import * as React from "react"
import { IconCheck, IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useZakat } from "@/context/zakat-context"
import {
  addLunarYear,
  formatZakatDate,
  formatZakatMoney,
  type ZakatHistoryRecord,
} from "@/lib/zakat"

export function ZakatFinalizeDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { calculation, finalizeZakat } = useZakat()
  const [step, setStep] = React.useState(1)
  const [paymentDate, setPaymentDate] = React.useState("")
  const [amountPaid, setAmountPaid] = React.useState("")
  const [reference, setReference] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [saved, setSaved] = React.useState<ZakatHistoryRecord | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setStep(1)
    setPaymentDate(new Date().toISOString().slice(0, 10))
    setAmountPaid(calculation.estimatedZakat.toFixed(2))
    setReference("")
    setNotes("")
    setSaved(null)
    setSubmitting(false)
  }, [calculation.estimatedZakat, open])

  const complete = () => {
    if (submitting || saved) return
    if (!paymentDate || Number(amountPaid) <= 0) {
      toast.error("Enter a payment date and amount.")
      return
    }
    setSubmitting(true)
    const record = finalizeZakat({
      paymentDate,
      amountPaid: Number(amountPaid),
      reference,
      notes,
    })
    setSaved(record)
    setStep(3)
    setSubmitting(false)
    toast.success("Zakat recorded.")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === 1
              ? "Review calculation"
              : step === 2
                ? "Record payment"
                : "Zakat recorded"}
          </DialogTitle>
          <DialogDescription>
            Step {step} of 3 ·{" "}
            {step === 1 ? "Review" : step === 2 ? "Payment" : "Complete"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2" aria-label="Finalize progress">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className={`h-1.5 rounded-full ${
                item <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {step === 1 ? (
          <div className="divide-y rounded-xl border">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-muted-foreground text-sm">Assets</span>
              <span className="font-semibold tabular-nums">
                {formatZakatMoney(calculation.assets.total)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-muted-foreground text-sm">Liabilities</span>
              <span className="font-semibold tabular-nums">
                {formatZakatMoney(calculation.liabilities.total)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-muted-foreground text-sm">Net assets</span>
              <span className="font-semibold tabular-nums">
                {formatZakatMoney(calculation.netAssets)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-muted-foreground text-sm">
                Zakat ({calculation.rate.toFixed(2)}%)
              </span>
              <span className="text-lg font-semibold tabular-nums">
                {formatZakatMoney(calculation.estimatedZakat)}
              </span>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="zakat-payment-date">Payment date</Label>
              <Input
                id="zakat-payment-date"
                type="date"
                value={paymentDate}
                onChange={(event) => setPaymentDate(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zakat-payment-amount">Amount paid</Label>
              <Input
                id="zakat-payment-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amountPaid}
                onChange={(event) => setAmountPaid(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="zakat-payment-reference">Reference</Label>
              <Input
                id="zakat-payment-reference"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="Bank transfer, receipt number, or payment method"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="zakat-payment-notes">Notes</Label>
              <textarea
                id="zakat-payment-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional notes"
                className="border-input bg-background min-h-24 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              />
            </div>
          </div>
        ) : null}

        {step === 3 && saved ? (
          <div className="py-4 text-center">
            <div className="bg-primary text-primary-foreground mx-auto flex size-12 items-center justify-center rounded-full">
              <IconCheck className="size-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Zakat recorded</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Paid {formatZakatMoney(saved.amountPaid)} on{" "}
              {formatZakatDate(saved.paymentDate)}.
            </p>
            <div className="mx-auto mt-5 max-w-sm divide-y rounded-lg border text-left">
              <div className="flex justify-between gap-4 px-4 py-3 text-sm">
                <span className="text-muted-foreground">Last paid date</span>
                <span className="font-medium">
                  {formatZakatDate(saved.paymentDate)}
                </span>
              </div>
              <div className="flex justify-between gap-4 px-4 py-3 text-sm">
                <span className="text-muted-foreground">Next due</span>
                <span className="font-medium">
                  {formatZakatDate(addLunarYear(saved.paymentDate))}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          {step === 1 ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={() => setStep(2)}>
                Continue
                <IconChevronRight className="size-4" />
              </Button>
            </>
          ) : step === 2 ? (
            <>
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                <IconChevronLeft className="size-4" />
                Back
              </Button>
              <Button type="button" disabled={submitting} onClick={complete}>
                Finalize Zakat
              </Button>
            </>
          ) : (
            <Button type="button" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
