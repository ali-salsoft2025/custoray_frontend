"use client"

import { Check } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { Switch } from "@/components/ui/switch"
import { useAppearance } from "@/components/theme/appearance-provider"
import {
  ACCENT_PRESETS,
  presetColor,
} from "@/lib/appearance-prefs"
import { cn } from "@/lib/utils"

function MiniUi({ dark }: { dark?: boolean }) {
  return (
    <div className={cn("flex h-full min-h-[8.5rem]", dark ? "bg-zinc-900" : "bg-zinc-100")}>
      <div className={cn("w-[22%]", dark ? "bg-zinc-800" : "bg-white")} />
      <div className="flex flex-1 flex-col gap-1.5 p-2.5">
        <div className="bg-primary/80 h-2 w-1/2 rounded-sm" />
        <div className={cn("h-1.5 w-full rounded-sm", dark ? "bg-zinc-700" : "bg-zinc-200")} />
        <div className={cn("h-1.5 w-4/5 rounded-sm", dark ? "bg-zinc-700" : "bg-zinc-200")} />
        <div className="mt-auto grid grid-cols-3 gap-1">
          <div className="bg-primary/25 h-7 rounded" />
          <div className={cn("h-7 rounded", dark ? "bg-zinc-700" : "bg-zinc-200")} />
          <div className={cn("h-7 rounded", dark ? "bg-zinc-700" : "bg-zinc-200")} />
        </div>
      </div>
    </div>
  )
}

function TablePreview({ compact }: { compact?: boolean }) {
  const rows = compact ? 5 : 3
  return (
    <div className="bg-muted/40 flex min-h-[8.5rem] flex-col gap-1 p-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "bg-background flex items-center gap-2 rounded-md border px-2",
            compact ? "h-5" : "h-8"
          )}
        >
          <span className="bg-muted h-2 w-8 rounded-sm" />
          <span className="bg-muted h-2 flex-1 rounded-sm" />
          <span className="bg-primary/40 h-2 w-10 rounded-sm" />
        </div>
      ))}
    </div>
  )
}

function ChoiceCard({
  selected,
  onClick,
  label,
  description,
  children,
}: {
  selected: boolean
  onClick: () => void
  label: string
  description?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex cursor-pointer flex-col overflow-hidden rounded-xl border text-start transition-colors",
        selected
          ? "border-primary bg-primary/5 ring-primary/30 ring-2"
          : "border-border hover:border-primary/40 bg-card"
      )}
    >
      {selected ? (
        <span className="bg-primary text-primary-foreground absolute top-2.5 end-2.5 z-10 flex size-5 items-center justify-center rounded-full">
          <Check className="size-3" strokeWidth={3} />
        </span>
      ) : null}
      <div className="overflow-hidden">{children}</div>
      <div className="px-3 py-2.5">
        <p className="text-sm font-medium">{label}</p>
        {description ? (
          <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>
        ) : null}
      </div>
    </button>
  )
}

const PRESET_I18N_KEY: Record<string, "green" | "red" | "blue" | "purple" | "navy"> = {
  green: "green",
  red: "red",
  blue: "blue",
  purple: "purple",
  violet: "navy",
}

export function AppearanceSettings() {
  const { t } = useTranslation("settings")
  const { prefs, update } = useAppearance()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const mode = mounted ? (theme ?? "system") : "system"
  const customHex =
    prefs.colorTheme === "custom" ? prefs.customColor : presetColor(prefs.colorTheme)

  return (
    <div className="divide-border flex flex-col divide-y">
      <section className="pb-8">
        <h2 className="text-base font-semibold">{t("appearance.themes")}</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("appearance.themesDescription")}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <ChoiceCard
            selected={mode === "light"}
            onClick={() => setTheme("light")}
            label={t("appearance.lightMode")}
            description={t("appearance.lightModeDesc")}
          >
            <MiniUi />
          </ChoiceCard>
          <ChoiceCard
            selected={mode === "dark"}
            onClick={() => setTheme("dark")}
            label={t("appearance.darkMode")}
            description={t("appearance.darkModeDesc")}
          >
            <MiniUi dark />
          </ChoiceCard>
          <ChoiceCard
            selected={mode === "system"}
            onClick={() => setTheme("system")}
            label={t("appearance.systemPreferences")}
            description={t("appearance.systemPreferencesDesc")}
          >
            <div className="grid min-h-[8.5rem] grid-cols-2 overflow-hidden">
              <MiniUi />
              <MiniUi dark />
            </div>
          </ChoiceCard>
        </div>
      </section>

      <section className="py-8">
        <h2 className="text-base font-semibold">{t("appearance.accentColors")}</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("appearance.accentColorsDescription")}
        </p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {ACCENT_PRESETS.map((item) => {
              const selected = prefs.colorTheme === item.id
              const label = t(`appearance.presets.${PRESET_I18N_KEY[item.id] ?? item.id}`)
              return (
                <button
                  key={item.id}
                  type="button"
                  title={label}
                  aria-label={label}
                  onClick={() =>
                    update({ colorTheme: item.id, customColor: item.color })
                  }
                  className={cn(
                    "size-8 rounded-full ring-2 ring-offset-2 ring-offset-background transition-shadow",
                    selected ? "ring-foreground" : "ring-transparent hover:ring-border"
                  )}
                  style={{ backgroundColor: item.color }}
                />
              )
            })}
          </div>
          <label className="flex items-center gap-2.5">
            <span className="text-muted-foreground text-sm">{t("appearance.customColor")}</span>
            <input
              value={customHex}
              onChange={(event) => {
                const value = event.target.value
                update({
                  customColor: value,
                  colorTheme: /^#([0-9a-fA-F]{6})$/.test(value) ? "custom" : prefs.colorTheme,
                })
              }}
              className="border-input h-9 w-[7.5rem] rounded-md border bg-transparent px-2.5 font-mono text-sm outline-none focus-visible:ring-2"
              spellCheck={false}
              aria-label={t("appearance.customAccentHex")}
            />
            <span
              className="size-8 rounded-full border"
              style={{ backgroundColor: customHex }}
            />
          </label>
        </div>
      </section>

      <section className="flex items-start justify-between gap-6 py-8">
        <div>
          <h2 className="text-base font-semibold">{t("appearance.showAnimations")}</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("appearance.showAnimationsDescription")}
          </p>
        </div>
        <Switch
          checked={!prefs.reduceMotion}
          onCheckedChange={(checked) => update({ reduceMotion: !checked })}
          className="h-6 w-11"
          aria-label={t("appearance.showAnimations")}
        />
      </section>

      <section className="pt-8">
        <h2 className="text-base font-semibold">{t("appearance.tablesView")}</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("appearance.tablesViewDescription")}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <ChoiceCard
            selected={!prefs.compactLayout}
            onClick={() => update({ compactLayout: false })}
            label={t("appearance.comfortable")}
            description={t("appearance.comfortableDesc")}
          >
            <TablePreview />
          </ChoiceCard>
          <ChoiceCard
            selected={prefs.compactLayout}
            onClick={() => update({ compactLayout: true })}
            label={t("appearance.compact")}
            description={t("appearance.compactDesc")}
          >
            <TablePreview compact />
          </ChoiceCard>
        </div>
      </section>
    </div>
  )
}
