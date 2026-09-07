"use client"

import { useRouter } from "next/navigation"
import { type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import {
  AUTH_BUTTON,
  AUTH_INPUT,
  AuthHeading,
  AuthShell,
  AuthSwitch,
} from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"

export function ResetForm() {
  const { t } = useTranslation("auth")
  const router = useRouter()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fd = new FormData(event.currentTarget)
    const password = String(fd.get("password") ?? "")
    const confirm = String(fd.get("confirm") ?? "")
    if (password !== confirm) {
      toast.error(t("resetPassword.toastMismatch"))
      return
    }
    toast.success(t("resetPassword.toastSuccess"))
    router.push("/")
  }

  return (
    <AuthShell hero="reset_password">
      <AuthHeading
        title={t("resetPassword.title")}
        accent="password"
        subtitle={t("resetPassword.subtitle")}
      />
      <form className="space-y-3.5" onSubmit={handleSubmit}>
        <div className="grid gap-1.5">
          <Label htmlFor="password">{t("resetPassword.newPassword")}</Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="••••••••"
            required
            minLength={8}
            className={AUTH_INPUT}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="confirm">{t("resetPassword.confirmPassword")}</Label>
          <PasswordInput
            id="confirm"
            name="confirm"
            autoComplete="new-password"
            placeholder="••••••••"
            required
            minLength={8}
            className={AUTH_INPUT}
          />
        </div>
        <Button type="submit" className={AUTH_BUTTON}>
          {t("resetPassword.submit")}
        </Button>
        <AuthSwitch
          prompt={t("resetPassword.backTo")}
          href="/"
          label={t("resetPassword.signIn")}
        />
      </form>
    </AuthShell>
  )
}
