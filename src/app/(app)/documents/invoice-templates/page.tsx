"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { IconPlus } from "@tabler/icons-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import { InvoiceBuilder } from "@/components/invoices/invoice-builder"
import { InvoiceTemplateCard } from "@/components/invoices/invoice-template-card"
import { Button } from "@/components/ui/button"
import { loadCompanySettings } from "@/lib/company-settings"
import {
  defaultInvoiceBuilderConfig,
  draftFromPreset,
  getDefaultColorsForTemplate,
  INVOICE_TEMPLATES,
  loadActiveInvoiceTemplateRef,
  loadCustomInvoiceTemplates,
  resolveInvoiceTemplate,
  resolvePresetTemplate,
  saveActiveInvoiceTemplateRef,
  saveCustomInvoiceTemplates,
  type ActiveInvoiceTemplateRef,
  type CustomInvoiceTemplate,
  type InvoiceBuilderConfig,
  type InvoiceTemplateColorOverrides,
  type InvoiceTemplateId,
} from "@/lib/invoice-templates"

export default function InvoiceTemplatesPage() {
  const { t } = useTranslation("documents")
  const searchParams = useSearchParams()
  const [activeRef, setActiveRef] = useState<ActiveInvoiceTemplateRef>({ kind: "preset", id: "classic" })
  const [customTemplates, setCustomTemplates] = useState<CustomInvoiceTemplate[]>([])
  const [builderOpen, setBuilderOpen] = useState(false)
  const [builderLayout, setBuilderLayout] = useState<InvoiceTemplateId>("classic")
  const [builderColors, setBuilderColors] = useState<InvoiceTemplateColorOverrides>({})
  const [builderDraft, setBuilderDraft] = useState<InvoiceBuilderConfig>(defaultInvoiceBuilderConfig())
  const [editingCustom, setEditingCustom] = useState<CustomInvoiceTemplate | null>(null)
  const [suggestedTemplateName, setSuggestedTemplateName] = useState("")
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setActiveRef(loadActiveInvoiceTemplateRef())
    setCustomTemplates(loadCustomInvoiceTemplates())
    setHydrated(true)
  }, [])

  const company = loadCompanySettings()
  const defaultLogoUrl = company.logoUrl.trim() || "/assets/logo-2.png"

  const handleSelectPreset = useCallback((id: InvoiceTemplateId) => {
    const ref: ActiveInvoiceTemplateRef = { kind: "preset", id }
    setActiveRef(ref)
    saveActiveInvoiceTemplateRef(ref)
    const name = t(`presets.${id}.name`)
    toast.success(t("toasts.activeNow", { name }))
  }, [t])

  const handleSelectCustom = useCallback((template: CustomInvoiceTemplate) => {
    const ref: ActiveInvoiceTemplateRef = { kind: "custom", id: template.id }
    setActiveRef(ref)
    saveActiveInvoiceTemplateRef(ref)
    toast.success(t("toasts.activeNow", { name: template.name }))
  }, [t])

  const openBuilderForPreset = useCallback((id: InvoiceTemplateId) => {
    const draft = draftFromPreset(id)
    setEditingCustom(null)
    setBuilderLayout(draft.baseLayout)
    setBuilderColors(draft.colors)
    setBuilderDraft(draft.builder)
    setSuggestedTemplateName(draft.suggestedName)
    setBuilderOpen(true)
  }, [])

  const openBuilderNew = useCallback(() => {
    setEditingCustom(null)
    setBuilderLayout("classic")
    setBuilderColors(getDefaultColorsForTemplate("classic"))
    setBuilderDraft(defaultInvoiceBuilderConfig())
    setSuggestedTemplateName(t("templatesPage.defaultName"))
    setBuilderOpen(true)
  }, [t])

  const openBuilderEditCustom = useCallback((template: CustomInvoiceTemplate) => {
    setEditingCustom(template)
    setBuilderLayout(template.baseLayout)
    setBuilderColors(template.colors)
    setBuilderDraft(template.builder)
    setSuggestedTemplateName(template.name)
    setBuilderOpen(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    const customize = searchParams.get("customize")
    const edit = searchParams.get("edit")
    if (customize === "classic" || customize === "minimal" || customize === "modern" || customize === "professional") {
      openBuilderForPreset(customize)
    } else if (edit) {
      const template = customTemplates.find((t) => t.id === edit)
      if (template) openBuilderEditCustom(template)
    }
  }, [hydrated, searchParams, customTemplates, openBuilderForPreset, openBuilderEditCustom])

  const handleSaveCustomTemplate = useCallback(
    (template: CustomInvoiceTemplate) => {
      setCustomTemplates((prev) => {
        const exists = prev.some((t) => t.id === template.id)
        const next = exists
          ? prev.map((t) => (t.id === template.id ? template : t))
          : [...prev, template]
        saveCustomInvoiceTemplates(next)
        return next
      })
      handleSelectCustom(template)
    },
    [handleSelectCustom]
  )

  const handleDeleteCustom = useCallback(
    (id: string) => {
      setCustomTemplates((prev) => {
        const next = prev.filter((t) => t.id !== id)
        saveCustomInvoiceTemplates(next)
        return next
      })
      if (activeRef.kind === "custom" && activeRef.id === id) {
        handleSelectPreset("classic")
      }
      toast.message(t("toasts.customRemoved"))
    },
    [activeRef, handleSelectPreset, t]
  )

  if (!hydrated) return null

  return (
    <div className="flex flex-col gap-8 p-4 lg:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold" style={{ color: "#111827" }}>
            {t("templatesPage.title")}
          </h2>
          <p className="mt-1 text-sm" style={{ color: "#6b7280" }}>
            {t("templatesPage.intro")}
          </p>
        </div>
        <Button type="button" onClick={openBuilderNew} className="shrink-0">
          <IconPlus className="size-4" />
          {t("templatesPage.create")}
        </Button>
      </div>

      <section className="space-y-4">
        <h3 className="text-sm font-medium uppercase tracking-wide" style={{ color: "#374151" }}>
          {t("templatesPage.presetLayouts")}
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {INVOICE_TEMPLATES.map((meta) => {
            const isSelected = activeRef.kind === "preset" && activeRef.id === meta.id
            const preset = resolvePresetTemplate(meta.id)
            const rowTemplate = resolveInvoiceTemplate(meta.id, preset.colors)

            return (
              <InvoiceTemplateCard
                key={meta.id}
                name={t(`presets.${meta.id}.name`)}
                description={t(`presets.${meta.id}.description`)}
                previewSlug={meta.id}
                template={rowTemplate}
                builder={preset.builder}
                logoUrl={defaultLogoUrl}
                isActive={isSelected}
                onSelect={() => handleSelectPreset(meta.id)}
                onCustomize={() => openBuilderForPreset(meta.id)}
              />
            )
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-medium uppercase tracking-wide" style={{ color: "#374151" }}>
          {t("templatesPage.customSection")}
        </h3>
        {customTemplates.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm" style={{ borderColor: "#e5e7eb", color: "#6b7280" }}>
            {t("templatesPage.emptyCustom")}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {customTemplates.map((template) => {
              const isSelected = activeRef.kind === "custom" && activeRef.id === template.id
              const rowTemplate = resolveInvoiceTemplate(template.baseLayout, template.colors)
              const baseLayoutName = t(`presets.${template.baseLayout}.name`)

              return (
                <InvoiceTemplateCard
                  key={template.id}
                  name={template.name}
                  description=""
                  previewSlug={template.id}
                  template={rowTemplate}
                  builder={template.builder}
                  logoUrl={
                    template.builder.logoUrlOverride.trim() || defaultLogoUrl
                  }
                  isActive={isSelected}
                  isCustom
                  baseLayoutName={baseLayoutName}
                  onSelect={() => handleSelectCustom(template)}
                  onCustomize={() => openBuilderEditCustom(template)}
                  onDelete={() => handleDeleteCustom(template.id)}
                />
              )
            })}
          </div>
        )}
      </section>

      <InvoiceBuilder
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        baseLayout={builderLayout}
        colors={builderColors}
        builder={builderDraft}
        onBaseLayoutChange={setBuilderLayout}
        onColorsChange={setBuilderColors}
        onBuilderChange={setBuilderDraft}
        onSaveCustomTemplate={handleSaveCustomTemplate}
        editingCustom={editingCustom}
        suggestedTemplateName={suggestedTemplateName}
      />
    </div>
  )
}
