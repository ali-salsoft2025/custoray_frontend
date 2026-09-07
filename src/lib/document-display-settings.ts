import { z } from "zod"

import { isAdditionLine, isDiscountLine } from "@/lib/pos"

export const documentDisplayFlagsSchema = z.object({
  showDiscounts: z.boolean(),
  showAdditions: z.boolean(),
  showCustomerBalance: z.boolean(),
})

export type DocumentDisplayFlags = z.infer<typeof documentDisplayFlagsSchema>

export const documentDisplaySettingsSchema = z.object({
  invoice: documentDisplayFlagsSchema,
  customerHistory: documentDisplayFlagsSchema,
})

export type DocumentDisplaySettings = z.infer<typeof documentDisplaySettingsSchema>

export const DOCUMENT_DISPLAY_SETTINGS_STORAGE_KEY =
  "custoray-document-display-settings-v1"

export const DEFAULT_DOCUMENT_DISPLAY_FLAGS: DocumentDisplayFlags = {
  showDiscounts: true,
  showAdditions: true,
  showCustomerBalance: true,
}

export const DEFAULT_DOCUMENT_DISPLAY_SETTINGS: DocumentDisplaySettings = {
  invoice: { ...DEFAULT_DOCUMENT_DISPLAY_FLAGS },
  customerHistory: { ...DEFAULT_DOCUMENT_DISPLAY_FLAGS },
}

export function parseDocumentDisplaySettings(
  raw: string | null
): DocumentDisplaySettings | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    const result = documentDisplaySettingsSchema.safeParse(parsed)
    if (result.success) return result.data
    const loose = parsed as Partial<DocumentDisplaySettings>
    return {
      invoice: {
        ...DEFAULT_DOCUMENT_DISPLAY_FLAGS,
        ...loose.invoice,
      },
      customerHistory: {
        ...DEFAULT_DOCUMENT_DISPLAY_FLAGS,
        ...loose.customerHistory,
      },
    }
  } catch {
    return null
  }
}

export function loadDocumentDisplaySettings(): DocumentDisplaySettings {
  if (typeof window === "undefined") return DEFAULT_DOCUMENT_DISPLAY_SETTINGS
  return (
    parseDocumentDisplaySettings(
      window.localStorage.getItem(DOCUMENT_DISPLAY_SETTINGS_STORAGE_KEY)
    ) ?? DEFAULT_DOCUMENT_DISPLAY_SETTINGS
  )
}

export function saveDocumentDisplaySettings(settings: DocumentDisplaySettings) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(
    DOCUMENT_DISPLAY_SETTINGS_STORAGE_KEY,
    JSON.stringify(settings)
  )
}

export function filterDocumentLines<T extends { productName: string }>(
  lines: T[],
  flags: Pick<DocumentDisplayFlags, "showDiscounts" | "showAdditions">
): T[] {
  return lines.filter((line) => {
    if (!flags.showDiscounts && isDiscountLine(line)) return false
    if (!flags.showAdditions && isAdditionLine(line)) return false
    return true
  })
}
