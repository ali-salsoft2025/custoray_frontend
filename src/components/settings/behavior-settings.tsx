"use client"

import { SettingsSection } from "@/components/settings/settings-section"
import { SettingsToggleRow } from "@/components/settings/settings-toggle-row"

type NotificationState = {
  app: boolean
  email: boolean
  sms: boolean
}

type PreferenceState = {
  reduceMotion: boolean
  compactLayout: boolean
  autoSave: boolean
}

type BehaviorSettingsProps = {
  notifications: NotificationState
  onNotificationsChange: (value: NotificationState) => void
  preferences: PreferenceState
  onPreferencesChange: (value: PreferenceState) => void
}

export function BehaviorSettings({
  notifications,
  onNotificationsChange,
  preferences,
  onPreferencesChange,
}: BehaviorSettingsProps) {
  return (
    <>
      <SettingsSection
        title="Notifications"
        description="Choose how you want to be notified."
      >
        <div className="space-y-2">
          <SettingsToggleRow
            title="In-app notifications"
            description="Alerts and updates inside Custoray."
            checked={notifications.app}
            onCheckedChange={(app) =>
              onNotificationsChange({ ...notifications, app })
            }
          />
          <SettingsToggleRow
            title="Email notifications"
            description="Summaries and important account emails."
            checked={notifications.email}
            onCheckedChange={(email) =>
              onNotificationsChange({ ...notifications, email })
            }
          />
          <SettingsToggleRow
            title="SMS notifications"
            description="Text messages for urgent alerts."
            checked={notifications.sms}
            onCheckedChange={(sms) =>
              onNotificationsChange({ ...notifications, sms })
            }
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="General preferences"
        description="Comfort and workflow options."
      >
        <div className="space-y-2">
          <SettingsToggleRow
            title="Reduce motion"
            description="Minimize animations across the interface."
            checked={preferences.reduceMotion}
            onCheckedChange={(reduceMotion) =>
              onPreferencesChange({ ...preferences, reduceMotion })
            }
          />
          <SettingsToggleRow
            title="Compact layout"
            description="Tighter spacing on tables and lists."
            checked={preferences.compactLayout}
            onCheckedChange={(compactLayout) =>
              onPreferencesChange({ ...preferences, compactLayout })
            }
          />
          <SettingsToggleRow
            title="Auto save"
            description="Save form changes automatically where supported."
            checked={preferences.autoSave}
            onCheckedChange={(autoSave) =>
              onPreferencesChange({ ...preferences, autoSave })
            }
          />
        </div>
      </SettingsSection>
    </>
  )
}
