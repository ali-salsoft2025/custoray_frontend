"use client"

import { useTranslation } from "react-i18next"

import { SettingsTabs } from "@/components/settings/settings-tabs"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { t } = useTranslation("nav")

  return (
    <div className="flex w-full flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">
        {t("settingsNav.title")}
      </h1>
      <SettingsTabs />
      <div className="min-w-0">{children}</div>
    </div>
  )
}
