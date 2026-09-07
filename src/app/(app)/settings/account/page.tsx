"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { TwoFactorSettings } from "@/components/settings/two-factor-settings"
import { SettingsSection } from "@/components/settings/settings-section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { apiMe, apiPatchAccount } from "@/lib/api/auth"

export default function AccountSettingsPage() {
  const { t } = useTranslation("settings")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiMe()
      .then((s) => {
        setName(s.user.name)
        setEmail(s.user.email)
      })
      .catch(() => {})
  }, [])

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      const payload: { name?: string; password?: string } = { name: name.trim() }
      if (password.trim().length >= 8) payload.password = password.trim()
      const updated = await apiPatchAccount(payload)
      setName(updated.name)
      setPassword("")
      toast.success(t("account.toastUpdated"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("account.toastError"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
      <form onSubmit={handleSave}>
        <SettingsSection
          title={t("account.profile")}
          description={t("account.profileDescription")}
          footer={
            <Button type="submit" disabled={saving || name.trim().length < 1}>
              {saving ? t("account.saving") : t("account.saveProfile")}
            </Button>
          }
        >
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">{t("account.name")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("account.email")}</Label>
              <Input id="email" type="email" value={email} readOnly />
              <p className="text-muted-foreground text-xs">
                {t("account.emailHint")}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t("account.newPassword")}</Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("account.passwordPlaceholder")}
                minLength={8}
              />
            </div>
          </div>
        </SettingsSection>
      </form>
      <TwoFactorSettings />
    </div>
  )
}
