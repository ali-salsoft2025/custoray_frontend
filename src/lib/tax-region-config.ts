export const TAX_REGIONS = ["US", "PK", "generic"] as const
export type TaxRegion = (typeof TAX_REGIONS)[number]

export type TaxIdField = {
  key: string
  label: string
  placeholder: string
}

export type TaxBusinessType = {
  value: string
  label: string
}

export type TaxDisplayCurrency = "USD" | "PKR" | "EUR" | "GBP"

export type TaxRegionProfile = {
  id: TaxRegion
  label: string
  shortLabel: string
  currency: TaxDisplayCurrency
  locale: string
  taxIdFields: TaxIdField[]
  businessTypes: TaxBusinessType[]
  salesTaxLabel: string
  fiscalYearHint: string
  disclaimerExtra?: string
}

const US_PROFILE: TaxRegionProfile = {
  id: "US",
  label: "United States",
  shortLabel: "US",
  currency: "USD",
  locale: "en-US",
  taxIdFields: [
    { key: "ein", label: "EIN", placeholder: "12-3456789" },
    { key: "stateTaxId", label: "State tax ID", placeholder: "Optional state ID" },
  ],
  businessTypes: [
    { value: "sole_proprietor", label: "Sole proprietorship" },
    { value: "llc", label: "LLC" },
    { value: "s_corp", label: "S-Corporation" },
    { value: "c_corp", label: "C-Corporation" },
    { value: "partnership", label: "Partnership" },
  ],
  salesTaxLabel: "Sales tax",
  fiscalYearHint: "Uses your active fiscal term (calendar or custom).",
  disclaimerExtra:
    "US figures are estimates for CPA review — not IRS filing documents.",
}

const PK_PROFILE: TaxRegionProfile = {
  id: "PK",
  label: "Pakistan",
  shortLabel: "PK",
  currency: "PKR",
  locale: "en-PK",
  taxIdFields: [
    { key: "ntn", label: "NTN", placeholder: "1234567-8" },
    { key: "strn", label: "STRN", placeholder: "Optional sales tax registration" },
  ],
  businessTypes: [
    { value: "sole_proprietor", label: "Sole proprietorship" },
    { value: "partnership", label: "Partnership (AOP)" },
    { value: "private_ltd", label: "Private limited company" },
    { value: "company", label: "Public / other company" },
  ],
  salesTaxLabel: "Sales tax / GST",
  fiscalYearHint: "Uses your active fiscal term (July–June is common in PK).",
  disclaimerExtra:
    "Pakistan figures are estimates for your tax consultant — not FBR returns.",
}

const GENERIC_PROFILE: TaxRegionProfile = {
  id: "generic",
  label: "Other / International",
  shortLabel: "Other",
  currency: "USD",
  locale: "en-US",
  taxIdFields: [
    { key: "taxId", label: "Tax ID", placeholder: "National tax identifier" },
    { key: "registration", label: "Registration #", placeholder: "Business registration" },
  ],
  businessTypes: [
    { value: "sole_proprietor", label: "Sole proprietorship" },
    { value: "partnership", label: "Partnership" },
    { value: "company", label: "Company" },
  ],
  salesTaxLabel: "Sales / VAT tax",
  fiscalYearHint: "Uses your active fiscal term from the header calendar.",
}

export const TAX_REGION_PROFILES: Record<TaxRegion, TaxRegionProfile> = {
  US: US_PROFILE,
  PK: PK_PROFILE,
  generic: GENERIC_PROFILE,
}

export function getTaxRegionProfile(region: TaxRegion): TaxRegionProfile {
  return TAX_REGION_PROFILES[region] ?? GENERIC_PROFILE
}

export function isTaxRegion(value: string): value is TaxRegion {
  return TAX_REGIONS.includes(value as TaxRegion)
}

export type TaxMoneyProfile = Pick<TaxRegionProfile, "currency" | "locale">

export function formatTaxMoney(
  amount: number | string,
  profile: TaxMoneyProfile
): string {
  const value = Number(amount)
  const safe = Number.isFinite(value) ? value : 0
  return new Intl.NumberFormat(profile.locale, {
    style: "currency",
    currency: profile.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe)
}

const DISPLAY_CURRENCY_LOCALE: Record<string, string> = {
  USD: "en-US",
  PKR: "en-PK",
  EUR: "de-DE",
  GBP: "en-GB",
}

export function getTaxDisplayProfile(settings: {
  displayCurrency?: string
  region?: TaxRegion
}): TaxMoneyProfile & {
  salesTaxLabel: string
  label: string
} {
  const currency =
    (settings.displayCurrency as TaxDisplayCurrency) ||
    getTaxRegionProfile(settings.region ?? "generic").currency
  const base = getTaxRegionProfile(settings.region ?? "generic")
  return {
    currency,
    locale: DISPLAY_CURRENCY_LOCALE[currency] ?? "en-US",
    salesTaxLabel: base.salesTaxLabel,
    label: base.label,
  }
}

export function defaultTaxIdsForRegion(region: TaxRegion): Record<string, string> {
  const profile = getTaxRegionProfile(region)
  return Object.fromEntries(profile.taxIdFields.map((field) => [field.key, ""]))
}

export function defaultBusinessTypeForRegion(region: TaxRegion): string {
  return getTaxRegionProfile(region).businessTypes[0]?.value ?? "sole_proprietor"
}
