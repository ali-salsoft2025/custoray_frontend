import { z } from "zod"

import {
  defaultBusinessTypeForRegion,
  defaultTaxIdsForRegion,
  getTaxRegionProfile,
  isTaxRegion,
  type TaxRegion,
} from "@/lib/tax-region-config"

export const TAX_MANUAL_ENTRY_CATEGORIES = [
  {
    value: "extra_income",
    label: "Extra income",
    hint: "Money you received that is not recorded as a sale in Custoray",
  },
  {
    value: "extra_expense",
    label: "Extra expense",
    hint: "Money you spent that is not recorded as a purchase in Custoray",
  },
  {
    value: "other_asset",
    label: "Something you own",
    hint: "Equipment, deposits, or other value not shown in inventory",
  },
  {
    value: "other_liability",
    label: "Money you owe",
    hint: "Loans or bills not tracked under vendors",
  },
] as const

export type TaxManualEntryCategory =
  (typeof TAX_MANUAL_ENTRY_CATEGORIES)[number]["value"]

export const taxManualEntrySchema = z.object({
  id: z.string(),
  label: z.string().trim().min(1).max(80),
  amount: z.string(),
  category: z.enum(["extra_income", "extra_expense", "other_asset", "other_liability"]),
  note: z.string().max(200).optional(),
})

export type TaxManualEntry = z.infer<typeof taxManualEntrySchema>

export const TAX_DISPLAY_CURRENCIES = ["USD", "PKR", "EUR", "GBP"] as const
export type TaxDisplayCurrency = (typeof TAX_DISPLAY_CURRENCIES)[number]

export const TAX_SETTINGS_STORAGE_KEY = "custoray-tax-settings-v1"

export const taxSettingsSchema = z.object({
  region: z.enum(["US", "PK", "generic"]),
  regionConfigured: z.boolean(),
  displayCurrency: z.enum(["USD", "PKR", "EUR", "GBP"]),
  businessTaxId: z.string().max(40),
  taxIds: z.record(z.string(), z.string()),
  businessType: z.string(),
  estimatedTaxRatePercent: z.number().min(0).max(100),
  accountantNotes: z.string().max(500),
  manualEntries: z.array(taxManualEntrySchema),
})

export type TaxSettings = z.infer<typeof taxSettingsSchema>

export const DEFAULT_TAX_SETTINGS: TaxSettings = {
  region: "generic",
  regionConfigured: true,
  displayCurrency: "USD",
  businessTaxId: "",
  taxIds: defaultTaxIdsForRegion("generic"),
  businessType: defaultBusinessTypeForRegion("generic"),
  estimatedTaxRatePercent: 0,
  accountantNotes: "",
  manualEntries: [],
}

export function parseTaxSettings(raw: string | null): TaxSettings | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    const result = taxSettingsSchema.safeParse(parsed)
    if (!result.success) {
      const legacy = parsed as Partial<TaxSettings> & { manualEntries?: TaxManualEntry[] }
      const fallback = {
        ...DEFAULT_TAX_SETTINGS,
        ...legacy,
        manualEntries: legacy.manualEntries ?? [],
        displayCurrency: legacy.displayCurrency ?? DEFAULT_TAX_SETTINGS.displayCurrency,
        businessTaxId: legacy.businessTaxId ?? "",
        regionConfigured: true,
      }
      const retry = taxSettingsSchema.safeParse(fallback)
      return retry.success ? normalizeTaxSettings(retry.data) : null
    }
    return normalizeTaxSettings(result.data)
  } catch {
    return null
  }
}

export function normalizeTaxSettings(settings: TaxSettings): TaxSettings {
  const profile = getTaxRegionProfile(settings.region)
  const businessType = profile.businessTypes.some((type) => type.value === settings.businessType)
    ? settings.businessType
    : defaultBusinessTypeForRegion(settings.region)
  const taxIds = {
    ...defaultTaxIdsForRegion(settings.region),
    ...settings.taxIds,
  }
  if (settings.businessTaxId.trim()) {
    taxIds.taxId = settings.businessTaxId.trim()
  }
  return taxSettingsSchema.parse({
    ...settings,
    regionConfigured: true,
    businessType,
    taxIds,
    manualEntries: settings.manualEntries.map((entry) => ({
      ...entry,
      amount: normalizeEntryAmount(entry.amount),
    })),
  })
}

export function normalizeEntryAmount(value: string): string {
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""))
  return Number.isFinite(parsed) ? Math.max(0, parsed).toFixed(2) : "0.00"
}

export function mergeTaxSettings(patch: Partial<TaxSettings>, prev: TaxSettings): TaxSettings {
  const merged = { ...prev, ...patch }
  if (patch.region && patch.region !== prev.region) {
    merged.taxIds = {
      ...defaultTaxIdsForRegion(patch.region),
      ...(patch.taxIds ?? {}),
    }
    if (!patch.businessType) {
      merged.businessType = defaultBusinessTypeForRegion(patch.region)
    }
  }
  if (patch.businessTaxId !== undefined) {
    merged.taxIds = {
      ...merged.taxIds,
      taxId: patch.businessTaxId.trim(),
    }
  }
  return normalizeTaxSettings(taxSettingsSchema.parse(merged))
}

export function setTaxRegion(settings: TaxSettings, region: TaxRegion): TaxSettings {
  return mergeTaxSettings(
    {
      region,
      regionConfigured: true,
      taxIds: defaultTaxIdsForRegion(region),
      businessType: defaultBusinessTypeForRegion(region),
    },
    settings
  )
}

export function sanitizeTaxRegion(value: string): TaxRegion {
  return isTaxRegion(value) ? value : "generic"
}

export function createManualEntry(
  input: Omit<TaxManualEntry, "id"> & { id?: string }
): TaxManualEntry {
  return taxManualEntrySchema.parse({
    id: input.id ?? `entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label: input.label,
    amount: normalizeEntryAmount(input.amount),
    category: input.category,
    note: input.note,
  })
}

export function manualEntryCategoryLabel(category: TaxManualEntryCategory): string {
  return TAX_MANUAL_ENTRY_CATEGORIES.find((item) => item.value === category)?.label ?? category
}
