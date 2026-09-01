import type { CompanyMembership } from "@/lib/api/auth"
import { loadCompanySettings } from "@/lib/company-settings"

export const COMPANIES_STORAGE_KEY = "custoray-companies-v1"
export const ACTIVE_COMPANY_STORAGE_KEY = "custoray-active-company-v1"

export function defaultLocalCompany(): CompanyMembership {
  const settings = loadCompanySettings()
  return {
    id: "local-default",
    name: settings.name || "Custoray",
    slug: "custoray",
    plan: "Demo",
    planCode: "starter",
    role: "Owner",
    isOwner: true,
    logoUrl: settings.logoUrl || "",
  }
}

export function loadLocalCompanies(): CompanyMembership[] {
  if (typeof window === "undefined") return [defaultLocalCompany()]
  try {
    const raw = window.localStorage.getItem(COMPANIES_STORAGE_KEY)
    if (!raw) return [defaultLocalCompany()]
    const parsed = JSON.parse(raw) as CompanyMembership[]
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [defaultLocalCompany()]
  } catch {
    return [defaultLocalCompany()]
  }
}

export function saveLocalCompanies(companies: CompanyMembership[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(COMPANIES_STORAGE_KEY, JSON.stringify(companies))
}

export function loadActiveCompanyId(companies: CompanyMembership[]): string {
  if (typeof window === "undefined") return companies[0]?.id ?? "local-default"
  const stored = window.localStorage.getItem(ACTIVE_COMPANY_STORAGE_KEY)
  if (stored && companies.some((company) => company.id === stored)) return stored
  return companies[0]?.id ?? "local-default"
}

export function saveActiveCompanyId(id: string) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(ACTIVE_COMPANY_STORAGE_KEY, id)
}

export function slugifyCompanyName(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "company"
  )
}
