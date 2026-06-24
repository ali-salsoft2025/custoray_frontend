"use client"

import { useEffect, useState } from "react"

import {
  AppearanceSettings,
  type FontSizeKey,
  type ThemeMode,
} from "@/components/settings/appearance-settings"
import { AppPreferencesForm } from "@/components/settings/app-preferences-form"
import { BehaviorSettings } from "@/components/settings/behavior-settings"
import { CompanySettingsForm } from "@/components/settings/company-settings-form"

const FONT_SIZE_VALUES = {
  sm: "0.875rem",
  base: "0.9375rem",
  lg: "1.125rem",
  xl: "1.25rem",
} as const

export default function Settings() {
  const [theme, setTheme] = useState<ThemeMode>("system")
  const [fontSize, setFontSize] = useState<FontSizeKey>("base")
  const [colorTheme, setColorTheme] = useState("green")
  const [language, setLanguage] = useState("en")
  const [rtlEnabled, setRtlEnabled] = useState(false)

  const [notifications, setNotifications] = useState({
    app: true,
    email: true,
    sms: false,
  })

  const [preferences, setPreferences] = useState({
    reduceMotion: false,
    compactLayout: false,
    autoSave: true,
  })

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--app-font-size",
      FONT_SIZE_VALUES[fontSize]
    )
  }, [fontSize])

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", colorTheme)
  }, [colorTheme])

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove("light", "dark")

    if (theme === "light") root.classList.add("light")
    else if (theme === "dark") root.classList.add("dark")
    else if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      root.classList.add(systemTheme)
    }
  }, [theme])

  useEffect(() => {
    const rtlLangs = ["ar", "he", "fa", "ur"]
    const isRtl = rtlLangs.includes(language)
    document.documentElement.setAttribute("dir", isRtl ? "rtl" : "ltr")
    setRtlEnabled(isRtl)
  }, [language])

  return (
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Settings</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your company profile, app defaults, and personal preferences.
        </p>
      </div>

      <CompanySettingsForm />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AppPreferencesForm />
        <AppearanceSettings
          theme={theme}
          onThemeChange={setTheme}
          colorTheme={colorTheme}
          onColorThemeChange={setColorTheme}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          language={language}
          onLanguageChange={setLanguage}
          rtlEnabled={rtlEnabled}
        />
        <BehaviorSettings
          notifications={notifications}
          onNotificationsChange={setNotifications}
          preferences={preferences}
          onPreferencesChange={setPreferences}
        />
      </div>
    </div>
  )
}
