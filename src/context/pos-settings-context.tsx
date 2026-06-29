"use client"

import * as React from "react"

import {
  DEFAULT_POS_SETTINGS,
  mergePosSettings,
  parsePersistedPosSettings,
  POS_SETTINGS_STORAGE_KEY,
  type PosSettings,
} from "@/lib/pos-settings"

type PosSettingsContextValue = {
  settings: PosSettings
  updateSettings: (patch: Partial<PosSettings>) => void
  resetSettings: () => void
  hydrated: boolean
}

const PosSettingsContext = React.createContext<PosSettingsContextValue | null>(null)

export function PosSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState<PosSettings>(DEFAULT_POS_SETTINGS)
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    const saved =
      parsePersistedPosSettings(
        typeof window !== "undefined"
          ? window.localStorage.getItem(POS_SETTINGS_STORAGE_KEY)
          : null
      ) ??
      parsePersistedPosSettings(
        typeof window !== "undefined"
          ? window.localStorage.getItem("custoray-pos-settings-v1")
          : null
      )
    if (saved) setSettings(saved)
    setHydrated(true)
  }, [])

  React.useEffect(() => {
    if (!hydrated || typeof window === "undefined") return
    window.localStorage.setItem(POS_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  }, [hydrated, settings])

  const updateSettings = React.useCallback((patch: Partial<PosSettings>) => {
    setSettings((prev) => mergePosSettings(patch, prev))
  }, [])

  const resetSettings = React.useCallback(() => {
    setSettings(DEFAULT_POS_SETTINGS)
  }, [])

  const value = React.useMemo(
    () => ({ settings, updateSettings, resetSettings, hydrated }),
    [hydrated, resetSettings, settings, updateSettings]
  )

  return (
    <PosSettingsContext.Provider value={value}>{children}</PosSettingsContext.Provider>
  )
}

export function usePosSettings() {
  const context = React.useContext(PosSettingsContext)
  if (!context) {
    throw new Error("usePosSettings must be used within PosSettingsProvider")
  }
  return context
}
