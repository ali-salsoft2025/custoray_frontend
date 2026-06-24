"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { IconDeviceFloppy, IconPhoto, IconRotate } from "@tabler/icons-react"
import { toast } from "sonner"

import { InvoiceTemplatePreview } from "@/components/invoices/invoice-template-preview"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { loadCompanySettings } from "@/lib/company-settings"
import {
  createCustomInvoiceTemplate,
  defaultInvoiceBuilderConfig,
  getDefaultColorsForTemplate,
  INVOICE_COLOR_FIELDS,
  INVOICE_MERGE_FIELDS,
  INVOICE_TEMPLATES,
  resolveInvoiceTemplate,
  type CustomInvoiceTemplate,
  type InvoiceBuilderConfig,
  type InvoiceBuilderLabels,
  type InvoiceFieldId,
  type InvoiceTemplateColorOverrides,
  type InvoiceTemplateId,
} from "@/lib/invoice-templates"

type InvoiceBuilderProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  baseLayout: InvoiceTemplateId
  colors: InvoiceTemplateColorOverrides
  builder: InvoiceBuilderConfig
  onBaseLayoutChange: (id: InvoiceTemplateId) => void
  onColorsChange: (colors: InvoiceTemplateColorOverrides) => void
  onBuilderChange: (builder: InvoiceBuilderConfig) => void
  onSaveCustomTemplate: (template: CustomInvoiceTemplate) => void
  editingCustom?: CustomInvoiceTemplate | null
  suggestedTemplateName?: string
}

const LABEL_FIELDS: { key: keyof InvoiceBuilderLabels; label: string }[] = [
  { key: "documentTitle", label: "Document title" },
  { key: "billToLabel", label: "Bill-to label" },
  { key: "dateLabel", label: "Date label" },
  { key: "invoiceIdLabel", label: "Invoice ID label" },
  { key: "statusLabel", label: "Status label" },
  { key: "rowNumberColumn", label: "Row # column" },
  { key: "descriptionColumn", label: "Description column" },
  { key: "qtyColumn", label: "Qty column" },
  { key: "rateColumn", label: "Unit price column" },
  { key: "amountColumn", label: "Amount column" },
  { key: "subtotalLabel", label: "Subtotal label" },
  { key: "paidLabel", label: "Paid label" },
  { key: "balanceLabel", label: "Balance due label" },
  { key: "totalLabel", label: "Total label" },
  { key: "thankYouMessage", label: "Thank-you message" },
  { key: "footerNote", label: "Footer note" },
]

const FIELD_GROUPS = [
  { id: "company" as const, title: "Company" },
  { id: "invoice" as const, title: "Invoice details" },
  { id: "customer" as const, title: "Customer" },
  { id: "items" as const, title: "Line items" },
  { id: "totals" as const, title: "Totals" },
  { id: "footer" as const, title: "Footer" },
]

function readLogoFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.onerror = () => reject(new Error("Could not read logo file."))
    reader.readAsDataURL(file)
  })
}

export function InvoiceBuilder({
  open,
  onOpenChange,
  baseLayout,
  colors,
  builder,
  onBaseLayoutChange,
  onColorsChange,
  onBuilderChange,
  onSaveCustomTemplate,
  editingCustom,
  suggestedTemplateName = "",
}: InvoiceBuilderProps) {
  const [templateName, setTemplateName] = useState(suggestedTemplateName)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const company = useMemo(() => loadCompanySettings(), [open])

  useEffect(() => {
    if (open) {
      setTemplateName(editingCustom?.name ?? suggestedTemplateName)
    }
  }, [open, editingCustom, suggestedTemplateName])

  const resolvedTemplate = resolveInvoiceTemplate(baseLayout, colors)
  const logoUrl =
    builder.logoUrlOverride.trim() ||
    company.logoUrl.trim() ||
    "/assets/logo-2.png"

  const patchBuilder = useCallback(
    (patch: Partial<InvoiceBuilderConfig>) => {
      onBuilderChange({ ...builder, ...patch })
    },
    [builder, onBuilderChange]
  )

  const patchLabel = useCallback(
    (key: keyof InvoiceBuilderLabels, value: string) => {
      onBuilderChange({
        ...builder,
        labels: { ...builder.labels, [key]: value },
      })
    },
    [builder, onBuilderChange]
  )

  const toggleField = useCallback(
    (id: InvoiceFieldId, enabled: boolean) => {
      onBuilderChange({
        ...builder,
        fields: { ...builder.fields, [id]: enabled },
      })
    },
    [builder, onBuilderChange]
  )

  const handleLogoUpload = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file for the logo.")
      return
    }
    try {
      const dataUrl = await readLogoFile(file)
      patchBuilder({ logoUrlOverride: dataUrl })
      toast.success("Logo updated for this template.")
    } catch {
      toast.error("Could not upload logo.")
    }
  }

  const handleResetBuilder = () => {
    onBuilderChange(defaultInvoiceBuilderConfig())
    toast.message("Builder reset to defaults.")
  }

  const handleResetColors = () => {
    onColorsChange(getDefaultColorsForTemplate(baseLayout))
    toast.message("Colors reset to layout defaults.")
  }

  const handleSaveCustom = () => {
    const name = templateName.trim()
    if (!name) {
      toast.error("Enter a name for your custom template.")
      return
    }
    const template = editingCustom
      ? { ...editingCustom, name, baseLayout, colors, builder }
      : createCustomInvoiceTemplate(name, baseLayout, colors, builder)
    onSaveCustomTemplate(template)
    toast.success(editingCustom ? "Custom template updated." : "Custom template saved.")
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(100vw,1100px)]"
        style={{ backgroundColor: "#f9fafb" }}
      >
        <SheetHeader className="shrink-0 border-b px-6 py-4" style={{ borderColor: "#e5e7eb", backgroundColor: "#ffffff" }}>
          <SheetTitle style={{ color: "#111827" }}>
            {editingCustom ? "Edit custom template" : "Create custom template"}
          </SheetTitle>
          <SheetDescription style={{ color: "#6b7280" }}>
            {editingCustom
              ? "Update your saved template. Built-in presets cannot be changed."
              : "Built-in presets are read-only. Your changes are saved as a new custom template."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="min-h-0 flex-1 overflow-y-auto border-r p-4 lg:p-6" style={{ borderColor: "#e5e7eb", backgroundColor: "#ffffff" }}>
            <Tabs defaultValue="fields" className="flex flex-col gap-4">
              <TabsList className="grid w-full grid-cols-4 bg-[#f3f4f6]">
                <TabsTrigger value="fields">Fields</TabsTrigger>
                <TabsTrigger value="text">Text</TabsTrigger>
                <TabsTrigger value="company">Company</TabsTrigger>
                <TabsTrigger value="colors">Colors</TabsTrigger>
              </TabsList>

              <TabsContent value="fields" className="mt-0 space-y-4">
                <p className="text-xs" style={{ color: "#6b7280" }}>
                  Show or hide sections on the invoice. Data fills automatically from orders and company settings.
                </p>
                {FIELD_GROUPS.map((group) => {
                  const items = INVOICE_MERGE_FIELDS.filter((f) => f.group === group.id)
                  return (
                    <div key={group.id} className="rounded-lg border p-3" style={{ borderColor: "#e5e7eb" }}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "#374151" }}>
                        {group.title}
                      </p>
                      <div className="flex flex-col gap-2">
                        {items.map((field) => (
                          <div key={field.id} className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium" style={{ color: "#111827" }}>
                                {field.label}
                              </p>
                              <p className="font-mono text-[10px]" style={{ color: "#9ca3af" }}>
                                {field.hint}
                              </p>
                            </div>
                            <Switch
                              checked={builder.fields[field.id]}
                              onCheckedChange={(checked) => toggleField(field.id, checked)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </TabsContent>

              <TabsContent value="text" className="mt-0 space-y-3">
                {LABEL_FIELDS.map(({ key, label }) => (
                  <div key={key} className="flex flex-col gap-1.5">
                    <Label htmlFor={`builder-label-${key}`} className="text-xs" style={{ color: "#374151" }}>
                      {label}
                    </Label>
                    <Input
                      id={`builder-label-${key}`}
                      value={builder.labels[key]}
                      onChange={(e) => patchLabel(key, e.target.value)}
                      className="bg-white"
                    />
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="bg-white" onClick={handleResetBuilder}>
                  <IconRotate className="size-4" />
                  Reset all text & fields
                </Button>
              </TabsContent>

              <TabsContent value="company" className="mt-0 space-y-4">
                <p className="text-xs" style={{ color: "#6b7280" }}>
                  Leave blank to use values from Settings → Company. Overrides apply only to this template.
                </p>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs" style={{ color: "#374151" }}>Company name</Label>
                  <Input
                    placeholder={company.name || "{{company_name}}"}
                    value={builder.companyNameOverride}
                    onChange={(e) => patchBuilder({ companyNameOverride: e.target.value })}
                    className="bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs" style={{ color: "#374151" }}>Tagline</Label>
                  <Input
                    placeholder={company.tagline || "{{company_tagline}}"}
                    value={builder.companyTaglineOverride}
                    onChange={(e) => patchBuilder({ companyTaglineOverride: e.target.value })}
                    className="bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs" style={{ color: "#374151" }}>Address</Label>
                  <Input
                    placeholder="{{company_address}}"
                    value={builder.companyAddressOverride}
                    onChange={(e) => patchBuilder({ companyAddressOverride: e.target.value })}
                    className="bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs" style={{ color: "#374151" }}>Phone & email</Label>
                  <Input
                    placeholder="{{company_contact}}"
                    value={builder.companyContactOverride}
                    onChange={(e) => patchBuilder({ companyContactOverride: e.target.value })}
                    className="bg-white"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-xs" style={{ color: "#374151" }}>Logo</Label>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => void handleLogoUpload(e.target.files?.[0])}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="bg-white"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <IconPhoto className="size-4" />
                      Upload logo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="bg-white"
                      onClick={() => patchBuilder({ logoUrlOverride: "" })}
                    >
                      Use company logo
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="colors" className="mt-0 space-y-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs" style={{ color: "#374151" }}>Base layout</Label>
                  <Select value={baseLayout} onValueChange={(v) => onBaseLayoutChange(v as InvoiceTemplateId)}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INVOICE_TEMPLATES.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "#374151" }}>
                    Template colors
                  </p>
                  <Button type="button" variant="outline" size="sm" className="bg-white" onClick={handleResetColors}>
                    Reset colors
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {INVOICE_COLOR_FIELDS.map(({ key, label }) => {
                    const value = colors[key] ?? getDefaultColorsForTemplate(baseLayout)[key] ?? "#000000"
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
                          aria-label={label}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-medium" style={{ color: "#111827" }}>
                            {label}
                          </p>
                          <p className="font-mono text-[10px] uppercase" style={{ color: "#6b7280" }}>
                            {value}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 space-y-3 border-t pt-4" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="custom-template-name" className="text-xs" style={{ color: "#374151" }}>
                  Template name
                </Label>
                <Input
                  id="custom-template-name"
                  placeholder="My branded invoice"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="bg-white"
                />
              </div>
              <Button type="button" className="w-full sm:w-auto" onClick={handleSaveCustom}>
                <IconDeviceFloppy className="size-4" />
                {editingCustom ? "Save changes" : "Save custom template"}
              </Button>
            </div>
          </div>

          <div
            className="flex shrink-0 flex-col items-center justify-start gap-3 overflow-y-auto p-4 lg:w-[360px] lg:p-6"
            style={{ backgroundColor: "#f3f4f6" }}
          >
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "#374151" }}>
              Live preview (portrait A4)
            </p>
            <InvoiceTemplatePreview
              template={resolvedTemplate}
              builder={builder}
              logoUrl={logoUrl}
              size="sheet"
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
