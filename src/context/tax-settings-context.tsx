"use client"

import * as React from "react"

import {
  DEFAULT_TAX_SETTINGS,
  mergeTaxSettings,
  parseTaxSettings,
  setTaxRegion,
  TAX_SETTINGS_STORAGE_KEY,
  type TaxSettings,
} from "@/lib/tax-settings"
import type { TaxRegion } from "@/lib/tax-region-config"

type TaxSettingsContextValue = {
  settings: TaxSettings
  updateSettings: (patch: Partial<TaxSettings>) => void
  setRegion: (region: TaxRegion) => void
  resetSettings: () => void
  hydrated: boolean
}

const TaxSettingsContext = React.createContext<TaxSettingsContextValue | null>(null)

export function TaxSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState<TaxSettings>(DEFAULT_TAX_SETTINGS)
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    const saved = parseTaxSettings(
      typeof window !== "undefined"
        ? window.localStorage.getItem(TAX_SETTINGS_STORAGE_KEY)
        : null
    )
    if (saved) setSettings(saved)
    setHydrated(true)
  }, [])

  React.useEffect(() => {
    if (!hydrated || typeof window === "undefined") return
    window.localStorage.setItem(TAX_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  }, [hydrated, settings])

  const updateSettings = React.useCallback((patch: Partial<TaxSettings>) => {
    setSettings((prev) => mergeTaxSettings(patch, prev))
  }, [])

  const setRegion = React.useCallback((region: TaxRegion) => {
    setSettings((prev) => setTaxRegion(prev, region))
  }, [])

  const resetSettings = React.useCallback(() => {
    setSettings(DEFAULT_TAX_SETTINGS)
  }, [])

  const value = React.useMemo(
    () => ({ settings, updateSettings, setRegion, resetSettings, hydrated }),
    [hydrated, resetSettings, setRegion, settings, updateSettings]
  )

  return (
    <TaxSettingsContext.Provider value={value}>{children}</TaxSettingsContext.Provider>
  )
}

export function useTaxSettings() {
  const context = React.useContext(TaxSettingsContext)
  if (!context) {
    throw new Error("useTaxSettings must be used within TaxSettingsProvider")
  }
  return context
}
