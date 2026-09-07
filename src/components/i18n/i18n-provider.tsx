"use client"

import { useLayoutEffect, type ReactNode } from "react"
import { I18nextProvider } from "react-i18next"

import { useAppearance } from "@/components/theme/appearance-provider"
import i18n from "@/i18n"
import { isAppLanguage } from "@/i18n/config"

export function I18nProvider({ children }: { children: ReactNode }) {
  const { prefs, ready } = useAppearance()
  const language = isAppLanguage(prefs.language) ? prefs.language : "en"

  useLayoutEffect(() => {
    // Appearance starts as English defaults. Do not sync until storage has
    // loaded, or the dashboard (and the rest of the app) gets stuck on en.
    if (!ready) return
    if (i18n.language !== language) {
      void i18n.changeLanguage(language)
    }
  }, [language, ready])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
