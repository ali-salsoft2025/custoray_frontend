"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import {
  applyAppearance,
  DEFAULT_APPEARANCE,
  loadAppearance,
  saveAppearance,
  type AppearancePrefs,
} from "@/lib/appearance-prefs"

type AppearanceContextValue = {
  prefs: AppearancePrefs
  update: (patch: Partial<AppearancePrefs>) => void
  ready: boolean
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null)

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<AppearancePrefs>(DEFAULT_APPEARANCE)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const loaded = loadAppearance()
    setPrefs(loaded)
    applyAppearance(loaded)
    setReady(true)
  }, [])

  const update = useCallback((patch: Partial<AppearancePrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch }
      saveAppearance(next)
      applyAppearance(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ prefs, update, ready }),
    [prefs, ready, update]
  )

  return (
    <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>
  )
}

export function useAppearance() {
  const ctx = useContext(AppearanceContext)
  if (!ctx) {
    throw new Error("useAppearance must be used within AppearanceProvider")
  }
  return ctx
}
