"use client"

import {
  IconDeviceDesktop,
  IconMoon,
  IconSun,
} from "@tabler/icons-react"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SettingsSection } from "@/components/settings/settings-section"
import { cn } from "@/lib/utils"

const FONT_SIZES = {
  sm: "Small",
  base: "Default",
  lg: "Large",
  xl: "Extra large",
} as const

type FontSizeKey = keyof typeof FONT_SIZES

const COLOR_THEMES = [
  { id: "default", label: "Default", color: "oklch(0.45 0.02 260)" },
  { id: "green", label: "Green", color: "#92c720" },
  { id: "blue", label: "Blue", color: "hsl(221.2 83.2% 53.3%)" },
  { id: "violet", label: "Violet", color: "hsl(262.1 83.3% 57.8%)" },
  { id: "purple", label: "Purple", color: "hsl(270 70% 50%)" },
  { id: "red", label: "Red", color: "hsl(0 84.2% 60.2%)" },
  { id: "rose", label: "Rose", color: "hsl(346.8 77.2% 49.8%)" },
  { id: "orange", label: "Orange", color: "hsl(24.6 95% 53.1%)" },
  { id: "amber", label: "Amber", color: "hsl(38 92% 50%)" },
  { id: "yellow", label: "Yellow", color: "hsl(47.9 95.8% 53.1%)" },
  { id: "lime", label: "Lime", color: "hsl(84 81% 44%)" },
  { id: "emerald", label: "Emerald", color: "hsl(160 84% 39%)" },
  { id: "teal", label: "Teal", color: "hsl(173 80% 40%)" },
  { id: "cyan", label: "Cyan", color: "hsl(189 94% 43%)" },
  { id: "sky", label: "Sky", color: "hsl(199 89% 48%)" },
  { id: "indigo", label: "Indigo", color: "hsl(239 84% 67%)" },
  { id: "pink", label: "Pink", color: "hsl(330 81% 60%)" },
  { id: "fuchsia", label: "Fuchsia", color: "hsl(292 84% 61%)" },
] as const

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic (العربية)" },
]

const THEME_MODES = [
  { value: "light", label: "Light", icon: IconSun },
  { value: "dark", label: "Dark", icon: IconMoon },
  { value: "system", label: "System", icon: IconDeviceDesktop },
] as const

type ThemeMode = (typeof THEME_MODES)[number]["value"]

type AppearanceSettingsProps = {
  theme: ThemeMode
  onThemeChange: (value: ThemeMode) => void
  colorTheme: string
  onColorThemeChange: (value: string) => void
  fontSize: FontSizeKey
  onFontSizeChange: (value: FontSizeKey) => void
  language: string
  onLanguageChange: (value: string) => void
  rtlEnabled: boolean
}

export function AppearanceSettings({
  theme,
  onThemeChange,
  colorTheme,
  onColorThemeChange,
  fontSize,
  onFontSizeChange,
  language,
  onLanguageChange,
  rtlEnabled,
}: AppearanceSettingsProps) {
  return (
    <SettingsSection
      title="Appearance"
      description="Theme, accent color, typography, and language."
    >
      <div className="space-y-2">
        <Label>Display mode</Label>
        <div className="bg-muted/30 grid grid-cols-3 gap-2 rounded-xl p-1 ring-1 ring-border/30">
          {THEME_MODES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => onThemeChange(value)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors",
                theme === value
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border/40"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-4" stroke={1.75} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Accent color</Label>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-9">
          {COLOR_THEMES.map((item) => (
            <button
              key={item.id}
              type="button"
              title={item.label}
              onClick={() => onColorThemeChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg p-2 transition-colors",
                colorTheme === item.id
                  ? "bg-muted ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : "hover:bg-muted/60"
              )}
            >
              <span
                className="size-7 rounded-full ring-1 ring-border/40"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground w-full truncate text-center text-[10px]">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="settings-font-size">Font size</Label>
          <Select
            value={fontSize}
            onValueChange={(value) => onFontSizeChange(value as FontSizeKey)}
          >
            <SelectTrigger id="settings-font-size" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(FONT_SIZES) as [FontSizeKey, string][]).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="settings-language">Language</Label>
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger id="settings-language" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">
            {rtlEnabled ? "Right-to-left layout enabled" : "Left-to-right layout enabled"}
          </p>
        </div>
      </div>
    </SettingsSection>
  )
}

export { FONT_SIZES }
export type { FontSizeKey, ThemeMode }
