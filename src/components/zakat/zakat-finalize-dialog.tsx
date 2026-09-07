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
import { useTranslation } from "react-i18next"

export function ZakatFinalizeDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation("zakat")
  const { t: tc } = useTranslation("common")
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
      toast.error(t("finalizeDialog.toastRequired"))
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
    toast.success(t("finalizeDialog.toastRecorded"))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === 1
              ? t("finalizeDialog.reviewTitle")
              : step === 2
                ? t("finalizeDialog.paymentTitle")
                : t("finalizeDialog.recordedTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("finalizeDialog.stepOf", {
              step,
              label:
                step === 1
                  ? t("finalizeDialog.stepReview")
                  : step === 2
                    ? t("finalizeDialog.stepPayment")
                    : t("finalizeDialog.stepComplete"),
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2" aria-label={t("finalizeDialog.progressAria")}>
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
              <span className="text-muted-foreground text-sm">{t("finalizeDialog.assets")}</span>
              <span className="font-semibold tabular-nums">
                {formatZakatMoney(calculation.assets.total)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-muted-foreground text-sm">{t("finalizeDialog.liabilities")}</span>
              <span className="font-semibold tabular-nums">
                {formatZakatMoney(calculation.liabilities.total)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-muted-foreground text-sm">{t("finalizeDialog.netAssets")}</span>
              <span className="font-semibold tabular-nums">
                {formatZakatMoney(calculation.netAssets)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-muted-foreground text-sm">
                {t("finalizeDialog.zakatRate", {
                  rate: calculation.rate.toFixed(2),
                })}
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
              <Label htmlFor="zakat-payment-date">{t("finalizeDialog.paymentDate")}</Label>
              <Input
                id="zakat-payment-date"
                type="date"
                value={paymentDate}
                onChange={(event) => setPaymentDate(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zakat-payment-amount">{t("finalizeDialog.amountPaid")}</Label>
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
              <Label htmlFor="zakat-payment-reference">{t("reference")}</Label>
              <Input
                id="zakat-payment-reference"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder={t("finalizeDialog.referencePlaceholder")}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="zakat-payment-notes">{t("notes")}</Label>
              <textarea
                id="zakat-payment-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder={t("finalizeDialog.notesPlaceholder")}
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
            <h3 className="mt-4 text-lg font-semibold">{t("finalizeDialog.recordedTitle")}</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("finalizeDialog.paidOn", {
                amount: formatZakatMoney(saved.amountPaid),
                date: formatZakatDate(saved.paymentDate),
              })}
            </p>
            <div className="mx-auto mt-5 max-w-sm divide-y rounded-lg border text-left">
              <div className="flex justify-between gap-4 px-4 py-3 text-sm">
                <span className="text-muted-foreground">{t("finalizeDialog.lastPaidDate")}</span>
                <span className="font-medium">
                  {formatZakatDate(saved.paymentDate)}
                </span>
              </div>
              <div className="flex justify-between gap-4 px-4 py-3 text-sm">
                <span className="text-muted-foreground">{t("finalizeDialog.nextDue")}</span>
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
                {tc("actions.cancel")}
              </Button>
              <Button type="button" onClick={() => setStep(2)}>
                {tc("actions.continue")}
                <IconChevronRight className="size-4" />
              </Button>
            </>
          ) : step === 2 ? (
            <>
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                <IconChevronLeft className="size-4" />
                {tc("actions.back")}
              </Button>
              <Button type="button" disabled={submitting} onClick={complete}>
                {t("finalizeDialog.finalizeZakat")}
              </Button>
            </>
          ) : (
            <Button type="button" onClick={() => onOpenChange(false)}>
              {tc("actions.done")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
