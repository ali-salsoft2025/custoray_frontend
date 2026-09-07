"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Switch } from "@/components/ui/switch"
import { AppPreferencesForm } from "@/components/settings/app-preferences-form"

const STORAGE_KEY = "custoray-notification-prefs-v1"

type NotificationState = {
  app: boolean
  email: boolean
  sms: boolean
}

const DEFAULT_NOTIFICATIONS: NotificationState = {
  app: true,
  email: true,
  sms: false,
}

function loadNotifications(): NotificationState {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATIONS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_NOTIFICATIONS
    const parsed = JSON.parse(raw) as Partial<NotificationState>
    return {
      app: parsed.app ?? true,
      email: parsed.email ?? true,
      sms: parsed.sms ?? false,
    }
  } catch {
    return DEFAULT_NOTIFICATIONS
  }
}

function Row({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-6">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="mt-1 h-6 w-11"
        aria-label={title}
      />
    </div>
  )
}

export default function NotificationsSettingsPage() {
  const { t } = useTranslation("settings")
  const [notifications, setNotifications] = useState<NotificationState>(DEFAULT_NOTIFICATIONS)

  useEffect(() => {
    setNotifications(loadNotifications())
  }, [])

  function update(patch: Partial<NotificationState>) {
    setNotifications((prev) => {
      const next = { ...prev, ...patch }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <div className="space-y-8">
      <div className="divide-border max-w-2xl divide-y">
        <Row
          title={t("notifications.inApp")}
          description={t("notifications.inAppDesc")}
          checked={notifications.app}
          onCheckedChange={(app) => update({ app })}
        />
        <Row
          title={t("notifications.email")}
          description={t("notifications.emailDesc")}
          checked={notifications.email}
          onCheckedChange={(email) => update({ email })}
        />
        <Row
          title={t("notifications.sms")}
          description={t("notifications.smsDesc")}
          checked={notifications.sms}
          onCheckedChange={(sms) => update({ sms })}
        />
      </div>
      <AppPreferencesForm />
    </div>
  )
}
