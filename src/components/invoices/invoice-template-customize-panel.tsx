"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import {
  DEFAULT_INVOICE_TEMPLATE_COPY,
  getDefaultColorsForTemplate,
  INVOICE_COLOR_FIELDS,
  type InvoiceTemplateColorOverrides,
  type InvoiceTemplateCopy,
  type InvoiceTemplateId,
} from "@/lib/invoice-templates"

type InvoiceTemplateCustomizePanelProps = {
  templateId: InvoiceTemplateId
  copy: InvoiceTemplateCopy
  colors: InvoiceTemplateColorOverrides
  onCopyChange: (copy: InvoiceTemplateCopy) => void
  onColorsChange: (colors: InvoiceTemplateColorOverrides) => void
  onResetColors: () => void
}

export function InvoiceTemplateCustomizePanel({
  templateId,
  copy,
  colors,
  onCopyChange,
  onColorsChange,
  onResetColors,
}: InvoiceTemplateCustomizePanelProps) {
  const { t } = useTranslation("documents")
  return (
    <div
      className="rounded-lg border p-4"
      style={{ backgroundColor: "#fafafa", borderColor: "#e5e7eb" }}
    >
      <p className="mb-1 text-sm font-semibold" style={{ color: "#111827" }}>
        {t("customizePanel.title")}
      </p>
      <p className="mb-4 text-xs" style={{ color: "#6b7280" }}>
        {t("customizePanel.hint")}
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "#374151" }}>
            {t("customizePanel.labelsMessages")}
          </p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`copy-title-${templateId}`} className="text-xs" style={{ color: "#374151" }}>
              {t("builder.labelFields.documentTitle")}
            </Label>
            <Input
              id={`copy-title-${templateId}`}
              value={copy.documentTitle}
              onChange={(e) => onCopyChange({ ...copy, documentTitle: e.target.value })}
              className="bg-white"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`copy-bill-${templateId}`} className="text-xs" style={{ color: "#374151" }}>
              {t("builder.labelFields.billToLabel")}
            </Label>
            <Input
              id={`copy-bill-${templateId}`}
              value={copy.billToLabel}
              onChange={(e) => onCopyChange({ ...copy, billToLabel: e.target.value })}
              className="bg-white"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`copy-thanks-${templateId}`} className="text-xs" style={{ color: "#374151" }}>
              {t("builder.labelFields.thankYouMessage")}
            </Label>
            <Input
              id={`copy-thanks-${templateId}`}
              value={copy.thankYouMessage}
              onChange={(e) => onCopyChange({ ...copy, thankYouMessage: e.target.value })}
              className="bg-white"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`copy-footer-${templateId}`} className="text-xs" style={{ color: "#374151" }}>
              {t("builder.labelFields.footerNote")}
            </Label>
            <Input
              id={`copy-footer-${templateId}`}
              value={copy.footerNote}
              onChange={(e) => onCopyChange({ ...copy, footerNote: e.target.value })}
              className="bg-white"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit bg-white"
            onClick={() => onCopyChange(DEFAULT_INVOICE_TEMPLATE_COPY)}
          >
            {t("customizePanel.resetText")}
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "#374151" }}>
              {t("builder.templateColors")}
            </p>
            <Button type="button" variant="outline" size="sm" className="bg-white" onClick={onResetColors}>
              {t("builder.resetColors")}
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {INVOICE_COLOR_FIELDS.map(({ key }) => {
              const value = colors[key] ?? getDefaultColorsForTemplate(templateId)[key] ?? "#000000"
              const colorLabel = t(`colors.${key}`)
              return (
                <div
                  key={key}
                  className="flex items-center gap-2 rounded-md border bg-white p-2"
                  style={{ borderColor: "#e5e7eb" }}
                >
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => onColorsChange({ ...colors, [key]: e.target.value })}
                    className="size-8 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
                    aria-label={colorLabel}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium" style={{ color: "#111827" }}>
                      {colorLabel}
                    </p>
                    <p className="font-mono text-[10px] uppercase" style={{ color: "#6b7280" }}>
                      {value}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
