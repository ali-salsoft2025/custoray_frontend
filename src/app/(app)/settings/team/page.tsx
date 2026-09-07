"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { SettingsSection } from "@/components/settings/settings-section"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { apiFetch } from "@/lib/api/client"

type TeamUser = {
  id: string
  email: string
  name: string
  isOwner: boolean
  isActive: boolean
  role: { id: string; name: string } | null
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export default function TeamSettingsPage() {
  const { t } = useTranslation("settings")
  const [users, setUsers] = useState<TeamUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<TeamUser[]>("/team/users")
      .then((list) => setUsers(Array.isArray(list) ? list : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="w-full max-w-2xl">
      <SettingsSection
        title={t("team.title")}
        description={t("team.description")}
      >
        {loading ? (
          <div className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
            <LoadingSpinner size="sm" />
            {t("team.loading")}
          </div>
        ) : users.length === 0 ? (
          <p className="text-muted-foreground py-6 text-sm">{t("team.empty")}</p>
        ) : (
          <ul className="divide-border/60 divide-y">
            {users.map((user) => (
              <li key={user.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                  {initials(user.name || user.email)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{user.name || t("team.unnamed")}</p>
                  <p className="text-muted-foreground truncate text-xs">{user.email}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
                  <Badge variant="secondary">
                    {user.isOwner ? t("team.owner") : user.role?.name ?? t("team.member")}
                  </Badge>
                  <Badge variant={user.isActive ? "outline" : "secondary"}>
                    {user.isActive ? t("team.active") : t("team.inactive")}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SettingsSection>
    </div>
  )
}
