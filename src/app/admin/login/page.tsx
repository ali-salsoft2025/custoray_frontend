"use client"

import { Mail } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import {
  AUTH_BUTTON,
  AUTH_INPUT,
  AuthHeading,
  AuthShell,
  AuthSwitch,
} from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { PasswordInput } from "@/components/ui/password-input"
import { apiFetch } from "@/lib/api/client"

export default function AdminLoginPage() {
  const { t } = useTranslation("auth")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await apiFetch("/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })
      toast.success(t("admin.toastSuccess"))
      window.location.href = "/admin"
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.toastFailed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <AuthHeading
        title={t("admin.title")}
        accent={t("admin.accent")}
        subtitle={t("admin.subtitle")}
      />
      <form className="space-y-3.5" onSubmit={onSubmit}>
        <div className="grid gap-1.5">
          <Label htmlFor="email">{t("admin.email")}</Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@custoray.com"
              required
              autoComplete="email"
              className={`${AUTH_INPUT} pr-10`}
            />
            <Mail
              className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2"
              aria-hidden
            />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="password">{t("admin.password")}</Label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            className={AUTH_INPUT}
          />
        </div>
        <Button type="submit" disabled={loading} className={AUTH_BUTTON}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner size="sm" />
              {t("admin.signingIn")}
            </span>
          ) : (
            t("admin.submit")
          )}
        </Button>
        <AuthSwitch prompt={t("admin.notAdmin")} href="/" label={t("admin.backToSignIn")} />
      </form>
    </AuthShell>
  )
}
