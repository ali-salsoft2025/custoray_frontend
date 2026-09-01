export type FontSizeKey = "sm" | "base" | "lg" | "xl"

export type AppearancePrefs = {
  colorTheme: string
  customColor: string
  reduceMotion: boolean
  compactLayout: boolean
  language: string
  fontSize: FontSizeKey
}

export const APPEARANCE_STORAGE_KEY = "custoray-appearance-v1"

export const FONT_SIZE_VALUES: Record<FontSizeKey, string> = {
  sm: "0.875rem",
  base: "0.9375rem",
  lg: "1.125rem",
  xl: "1.25rem",
}

export const ACCENT_PRESETS = [
  { id: "green", label: "Green", color: "#92c720" },
  { id: "red", label: "Red", color: "#ef4444" },
  { id: "blue", label: "Blue", color: "#3b82f6" },
  { id: "purple", label: "Purple", color: "#8b5cf6" },
  { id: "violet", label: "Navy", color: "#4f46e5" },
] as const

export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic (العربية)" },
] as const

export const DEFAULT_APPEARANCE: AppearancePrefs = {
  colorTheme: "green",
  customColor: "#92c720",
  reduceMotion: false,
  compactLayout: false,
  language: "en",
  fontSize: "base",
}

const RTL_LANGS = new Set(["ar", "he", "fa", "ur"])

function isHexColor(value: string) {
  return /^#([0-9a-fA-F]{6})$/.test(value.trim())
}

export function parseAppearance(raw: string | null): AppearancePrefs | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<AppearancePrefs>
    return {
      colorTheme: typeof parsed.colorTheme === "string" ? parsed.colorTheme : DEFAULT_APPEARANCE.colorTheme,
      customColor: isHexColor(parsed.customColor ?? "")
        ? parsed.customColor!.trim()
        : DEFAULT_APPEARANCE.customColor,
      reduceMotion: Boolean(parsed.reduceMotion),
      compactLayout: Boolean(parsed.compactLayout),
      language: parsed.language === "ar" ? "ar" : "en",
      fontSize:
        parsed.fontSize === "sm" || parsed.fontSize === "lg" || parsed.fontSize === "xl"
          ? parsed.fontSize
          : "base",
    }
  } catch {
    return null
  }
}

export function loadAppearance(): AppearancePrefs {
  if (typeof window === "undefined") return DEFAULT_APPEARANCE
  return parseAppearance(window.localStorage.getItem(APPEARANCE_STORAGE_KEY)) ?? DEFAULT_APPEARANCE
}

export function saveAppearance(prefs: AppearancePrefs) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(prefs))
}

export function applyAppearance(prefs: AppearancePrefs) {
  if (typeof document === "undefined") return
  const root = document.documentElement
  const custom = prefs.colorTheme === "custom" && isHexColor(prefs.customColor)

  if (custom) {
    root.setAttribute("data-theme", "custom")
    root.style.setProperty("--primary", prefs.customColor)
    root.style.setProperty("--ring", prefs.customColor)
    root.style.setProperty("--sidebar-primary", prefs.customColor)
  } else {
    root.style.removeProperty("--primary")
    root.style.removeProperty("--ring")
    root.style.removeProperty("--sidebar-primary")
    if (prefs.colorTheme && prefs.colorTheme !== "green") {
      root.setAttribute("data-theme", prefs.colorTheme)
    } else {
      root.removeAttribute("data-theme")
    }
  }

  root.setAttribute("data-density", prefs.compactLayout ? "compact" : "comfortable")
  root.setAttribute("data-reduce-motion", prefs.reduceMotion ? "true" : "false")
  root.style.setProperty("--app-font-size", FONT_SIZE_VALUES[prefs.fontSize])

  const rtl = RTL_LANGS.has(prefs.language)
  root.setAttribute("dir", rtl ? "rtl" : "ltr")
  root.setAttribute("lang", prefs.language)
}

export function presetColor(id: string) {
  return ACCENT_PRESETS.find((item) => item.id === id)?.color ?? DEFAULT_APPEARANCE.customColor
}

export function isRtlLanguage(language: string) {
  return RTL_LANGS.has(language)
}
