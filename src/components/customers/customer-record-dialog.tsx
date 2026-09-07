"use client"

import { useEffect, useMemo, useState } from "react"
import { IconDownload } from "@tabler/icons-react"
import { toast } from "sonner"

import { CustomerRecordPreview } from "@/components/customers/customer-record-preview"
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
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useOrders } from "@/context/orders-context"
import { useReturns } from "@/context/returns-context"
import { loadCompanySettings } from "@/lib/company-settings"
import {
  buildCustomerRecord,
  todayIsoDate,
  type CustomerRecord,
} from "@/lib/customer-record"
import type { CustomerRow } from "@/lib/customers"
import { loadDocumentDisplaySettings } from "@/lib/document-display-settings"
import { resolveActiveTemplateForPdf } from "@/lib/invoice-templates"

function filenameFromDisposition(header: string | null, fallback: string) {
  if (!header) return fallback
  const match = header.match(/filename="([^"]+)"/i)
  return match?.[1] ?? fallback
}

export async function downloadCustomerRecordPdf(record: CustomerRecord) {
  const company = loadCompanySettings()
  const { templateId, colors, builder } = resolveActiveTemplateForPdf()
  const display = loadDocumentDisplaySettings().customerHistory
  const response = await fetch("/api/customers/record/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ record, company, templateId, colors, builder, display }),
  })

  if (!response.ok) {
    throw new Error("PDF request failed")
  }

  const fallback = `customer-record-${record.customer.name.replace(/[^\w-]+/g, "_")}-${record.asOf}.pdf`
  const filename = filenameFromDisposition(
    response.headers.get("Content-Disposition"),
    fallback
  )
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

type CustomerRecordDialogProps = {
  customer: CustomerRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CustomerRecordDialog({
  customer,
  open,
  onOpenChange,
}: CustomerRecordDialogProps) {
  const { orders } = useOrders()
  const { returns } = useReturns()
  const [asOf, setAsOf] = useState(todayIsoDate)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) setAsOf(todayIsoDate())
  }, [open, customer?.id])

  const record = useMemo(() => {
    if (!customer) return null
    return buildCustomerRecord(customer, orders, returns, asOf)
  }, [customer, orders, returns, asOf])

  const template = useMemo(() => (open ? resolveActiveTemplateForPdf() : null), [open])
  const company = useMemo(() => (open ? loadCompanySettings() : null), [open])
  const display = useMemo(
    () => (open ? loadDocumentDisplaySettings().customerHistory : null),
    [open]
  )

  const handleDownload = async () => {
    if (!record) return
    setLoading(true)
    try {
      await downloadCustomerRecordPdf(record)
    } catch {
      toast.error("Could not download customer record PDF.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-border/60 space-y-1 border-b px-6 py-5 text-left">
          <DialogTitle>Customer record</DialogTitle>
          <DialogDescription>
            {customer
              ? `Full invoice history for ${customer.name} through the date you pick, grouped by month.`
              : "Pick a customer to view their record."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-end justify-between gap-3 border-b px-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="customer-record-as-of">As of</Label>
            <Input
              id="customer-record-as-of"
              type="date"
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
              className="w-[180px]"
            />
          </div>
          <Button type="button" onClick={handleDownload} disabled={!record || loading}>
            {loading ? <LoadingSpinner size="sm" /> : <IconDownload className="size-4" />}
            Download PDF
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-muted/30 px-4 py-5 sm:px-6">
          {record && company && template && display ? (
            <div className="flex justify-center">
              <CustomerRecordPreview
                record={record}
                company={company}
                templateId={template.templateId}
                colors={template.colors}
                builder={template.builder}
                display={display}
                logoUrl={company.logoUrl.trim() || undefined}
              />
            </div>
          ) : (
            <p className="text-muted-foreground py-12 text-center text-sm">No customer selected.</p>
          )}
        </div>

        <DialogFooter className="border-border/60 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
