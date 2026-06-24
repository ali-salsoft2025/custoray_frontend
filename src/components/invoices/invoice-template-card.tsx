"use client"

import Link from "next/link"
import { IconCheck, IconEye, IconPencil, IconTrash } from "@tabler/icons-react"

import { InvoiceTemplatePreview } from "@/components/invoices/invoice-template-preview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { confirmSelectInvoiceTemplateAction } from "@/lib/confirm-action"
import type { InvoiceBuilderConfig, InvoiceTemplateDefinition } from "@/lib/invoice-templates"
import { cn } from "@/lib/utils"

type InvoiceTemplateCardProps = {
  name: string
  description: string
  previewSlug: string
  template: InvoiceTemplateDefinition
  builder: InvoiceBuilderConfig
  logoUrl: string
  isActive?: boolean
  isCustom?: boolean
  baseLayoutName?: string
  onSelect: () => void
  onCustomize: () => void
  onDelete?: () => void
}

export function InvoiceTemplateCard({
  name,
  description,
  previewSlug,
  template,
  builder,
  logoUrl,
  isActive = false,
  isCustom = false,
  baseLayoutName,
  onSelect,
  onCustomize,
  onDelete,
}: InvoiceTemplateCardProps) {
  const handleCardClick = async () => {
    if (isActive) return
    const confirmed = await confirmSelectInvoiceTemplateAction({ templateName: name })
    if (confirmed) onSelect()
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      void handleCardClick()
    }
  }

  return (
    <article
      role="button"
      tabIndex={isActive ? -1 : 0}
      aria-label={isActive ? `${name} — active template` : `Select ${name} as invoice template`}
      onClick={() => void handleCardClick()}
      onKeyDown={handleKeyDown}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl border bg-white transition-shadow",
        isActive ? "ring-2 ring-[#92c720] ring-offset-2" : "cursor-pointer hover:shadow-md"
      )}
      style={{ borderColor: isActive ? "#92c720" : "#e5e7eb" }}
    >
      <div className="bg-[#f3f4f6] p-4">
        <div className="mx-auto flex justify-center">
          <InvoiceTemplatePreview
            template={template}
            builder={builder}
            logoUrl={logoUrl}
            size="thumb"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-h-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="font-semibold" style={{ color: "#111827" }}>
              {name}
            </h3>
            {isCustom ? (
              <Badge variant="outline" className="bg-white px-1.5 text-[10px]" style={{ color: "#374151" }}>
                Custom
              </Badge>
            ) : null}
            {isActive ? (
              <Badge
                variant="outline"
                className="gap-0.5 border-[#92c720] bg-white px-1.5 text-[10px]"
                style={{ color: "#3f6212" }}
              >
                <IconCheck className="size-2.5" />
                Active
              </Badge>
            ) : null}
          </div>
          <p className="line-clamp-2 text-xs leading-relaxed" style={{ color: "#6b7280" }}>
            {isCustom && baseLayoutName ? `Based on ${baseLayoutName}. ` : ""}
            {description}
          </p>
          {!isActive ? (
            <p className="text-[11px]" style={{ color: "#9ca3af" }}>
              Click card to select
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <Button type="button" variant="outline" size="sm" className="bg-white" asChild>
            <Link href={`/documents/invoice-templates/preview/${previewSlug}`}>
              <IconEye className="size-3.5" />
              Preview
            </Link>
          </Button>
          <Button type="button" variant="outline" size="sm" className="bg-white" onClick={onCustomize}>
            <IconPencil className="size-3.5" />
            {isCustom ? "Edit" : "Customize"}
          </Button>
          {isCustom && onDelete ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="col-span-2 bg-white text-red-600 hover:text-red-700"
              onClick={onDelete}
            >
              <IconTrash className="size-3.5" />
              Delete
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  )
}
