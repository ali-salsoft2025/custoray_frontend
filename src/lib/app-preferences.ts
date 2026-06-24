import { z } from "zod"

export const billItemViewModeSchema = z.enum(["bill", "item"])
export type BillItemViewMode = z.infer<typeof billItemViewModeSchema>

/** @deprecated Use BillItemViewMode */
export type PurchaseViewMode = BillItemViewMode

export const appPreferencesSchema = z.object({
  defaultPurchaseView: billItemViewModeSchema.default("bill"),
  defaultSalesView: billItemViewModeSchema.default("item"),
})

export type AppPreferences = z.infer<typeof appPreferencesSchema>

export const APP_PREFERENCES_STORAGE_KEY = "custoray-app-preferences-v1"
export const PURCHASE_VIEW_SESSION_KEY = "custoray-purchase-view-session"
export const SALES_VIEW_SESSION_KEY = "custoray-sales-view-session"
export const RETURNS_VIEW_SESSION_KEY = "custoray-returns-view-session"

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  defaultPurchaseView: "bill",
  defaultSalesView: "item",
}

export function parseAppPreferences(raw: string | null): AppPreferences | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    const result = appPreferencesSchema.safeParse(parsed)
    if (result.success) return result.data
    const legacy = parsed as { defaultPurchaseView?: BillItemViewMode }
    if (legacy.defaultPurchaseView) {
      return {
        defaultPurchaseView: legacy.defaultPurchaseView,
        defaultSalesView: "item",
      }
    }
    return null
  } catch {
    return null
  }
}

export function loadAppPreferences(): AppPreferences {
  if (typeof window === "undefined") return DEFAULT_APP_PREFERENCES
  const saved = parseAppPreferences(
    window.localStorage.getItem(APP_PREFERENCES_STORAGE_KEY)
  )
  return saved ?? DEFAULT_APP_PREFERENCES
}

export function saveAppPreferences(preferences: AppPreferences) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(
    APP_PREFERENCES_STORAGE_KEY,
    JSON.stringify(preferences)
  )
}

export function billItemViewModeLabel(mode: BillItemViewMode) {
  return mode === "bill" ? "Bill wise" : "Item wise"
}

/** @deprecated Use billItemViewModeLabel */
export function purchaseViewModeLabel(mode: BillItemViewMode) {
  return billItemViewModeLabel(mode)
}

function loadViewMode(
  sessionKey: string,
  defaultMode: BillItemViewMode
): BillItemViewMode {
  if (typeof window === "undefined") return defaultMode
  const session = window.sessionStorage.getItem(sessionKey)
  if (session === "bill" || session === "item") return session
  return defaultMode
}

function saveViewMode(sessionKey: string, mode: BillItemViewMode) {
  if (typeof window === "undefined") return
  window.sessionStorage.setItem(sessionKey, mode)
}

export function loadPurchaseViewMode(): BillItemViewMode {
  return loadViewMode(
    PURCHASE_VIEW_SESSION_KEY,
    loadAppPreferences().defaultPurchaseView
  )
}

export function savePurchaseViewMode(mode: BillItemViewMode) {
  saveViewMode(PURCHASE_VIEW_SESSION_KEY, mode)
}

export function loadSalesViewMode(): BillItemViewMode {
  return loadViewMode(SALES_VIEW_SESSION_KEY, loadAppPreferences().defaultSalesView)
}

export function saveSalesViewMode(mode: BillItemViewMode) {
  saveViewMode(SALES_VIEW_SESSION_KEY, mode)
}

export function loadReturnViewMode(): BillItemViewMode {
  return loadViewMode(RETURNS_VIEW_SESSION_KEY, "item")
}

export function saveReturnViewMode(mode: BillItemViewMode) {
  saveViewMode(RETURNS_VIEW_SESSION_KEY, mode)
}
