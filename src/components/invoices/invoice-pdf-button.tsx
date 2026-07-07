"use client"

import { useState } from "react"
import { IconDownload } from "@tabler/icons-react"
import { toast } from "sonner"

import { LoadingSpinner } from "@/components/ui/loading-spinner"

import { Button } from "@/components/ui/button"
import { loadCompanySettings } from "@/lib/company-settings"
import { resolveActiveTemplateForPdf } from "@/lib/invoice-templates"
import type { OrderRow } from "@/lib/orders"
import { cn } from "@/lib/utils"

type InvoicePdfButtonProps = {
  order: OrderRow
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "icon"
  className?: string
  label?: string
  showIcon?: boolean
}

function filenameFromDisposition(header: string | null, fallback: string) {
  if (!header) return fallback
  const match = header.match(/filename="([^"]+)"/i)
  return match?.[1] ?? fallback
}

export async function downloadInvoicePdf(order: OrderRow) {
  const company = loadCompanySettings()
  const { templateId, colors, builder } = resolveActiveTemplateForPdf()
  const response = await fetch("/api/invoices/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order, company, templateId, colors, builder }),
  })

  if (!response.ok) {
    throw new Error("PDF request failed")
  }

  const fallback = `${order.invoiceNumber.replace(/[^\w-]+/g, "_")}.pdf`
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

export function InvoicePdfButton({
  order,
  variant = "outline",
  size = "default",
  className,
  label = "Download PDF",
  showIcon = true,
}: InvoicePdfButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      await downloadInvoicePdf(order)
    } catch {
      toast.error("Could not download invoice PDF.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(className)}
      disabled={loading}
      onClick={handleClick}
    >
      {loading ? (
        <LoadingSpinner size="sm" />
      ) : showIcon ? (
        <IconDownload className="size-4" />
      ) : null}
      {size !== "icon" ? label : <span className="sr-only">{label}</span>}
    </Button>
  )
}
