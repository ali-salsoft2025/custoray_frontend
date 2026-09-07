"use client"

import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { AuthCodeInput } from "@/components/auth/auth-code-input"
import {
  AUTH_BUTTON,
  AuthHeading,
  AuthShell,
  AuthSwitch,
} from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export function ResetCodeForm() {
  const { t } = useTranslation("auth")
  const params = useSearchParams()
  const email = params.get("email")?.trim() ?? ""
  const [code, setCode] = useState("")

  return (
    <AuthShell hero="reset_code">
      <AuthHeading
        title={t("resetCode.title")}
        accent="code"
        subtitle={
          email
            ? t("resetCode.subtitleWithEmail", { email })
            : t("resetCode.subtitle")
        }
      />
      <form className="space-y-3.5" action="/resetPassword" method="get">
        {email ? <input type="hidden" name="email" value={email} /> : null}
        <input type="hidden" name="code" value={code} />
        <div className="grid gap-2">
          <Label htmlFor="code">{t("resetCode.label")}</Label>
          <AuthCodeInput id="code" value={code} onChange={setCode} />
        </div>
        <Button type="submit" className={AUTH_BUTTON} disabled={code.length !== 6}>
          {t("resetCode.verify")}
        </Button>
        <AuthSwitch
          prompt={t("resetCode.noCode")}
          href="/forgetPassword"
          label={t("resetCode.resend")}
        />
      </form>
    </AuthShell>
  )
}
