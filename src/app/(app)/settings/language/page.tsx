"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAppearance } from "@/components/theme/appearance-provider"
import { FONT_SIZE_VALUES, LANGUAGES, isRtlLanguage, type FontSizeKey } from "@/lib/appearance-prefs"

const FONT_SIZE_LABELS: Record<FontSizeKey, string> = {
  sm: "Small",
  base: "Default",
  lg: "Large",
  xl: "Extra large",
}

export default function LanguageSettingsPage() {
  const { prefs, update } = useAppearance()

  return (
    <div className="divide-border max-w-2xl divide-y">
      <section className="flex flex-col gap-4 pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Language</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Default language for the workspace.
          </p>
        </div>
        <div className="sm:w-64">
          <Select
            value={prefs.language}
            onValueChange={(language) => update({ language })}
          >
            <SelectTrigger className="w-full">
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
          <p className="text-muted-foreground mt-2 text-xs">
            {isRtlLanguage(prefs.language)
              ? "Right-to-left layout enabled"
              : "Left-to-right layout enabled"}
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-4 pt-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Font size</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Scale text across Custoray.
          </p>
        </div>
        <div className="sm:w-64">
          <Select
            value={prefs.fontSize}
            onValueChange={(value) => update({ fontSize: value as FontSizeKey })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(FONT_SIZE_VALUES) as FontSizeKey[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {FONT_SIZE_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>
    </div>
  )
}
