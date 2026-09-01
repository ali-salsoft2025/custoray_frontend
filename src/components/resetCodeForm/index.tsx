"use client"

import { useSearchParams } from "next/navigation"
import { useState } from "react"

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
  const params = useSearchParams()
  const email = params.get("email")?.trim() ?? ""
  const [code, setCode] = useState("")

  return (
    <AuthShell hero="reset_code">
      <AuthHeading
        title="Enter reset code"
        accent="code"
        subtitle={
          email
            ? `We sent a 6-digit code to ${email}.`
            : "Enter the 6-digit code we sent to your email."
        }
      />
      <form className="space-y-3.5" action="/resetPassword" method="get">
        {email ? <input type="hidden" name="email" value={email} /> : null}
        <input type="hidden" name="code" value={code} />
        <div className="grid gap-2">
          <Label htmlFor="code">Reset code</Label>
          <AuthCodeInput id="code" value={code} onChange={setCode} />
        </div>
        <Button type="submit" className={AUTH_BUTTON} disabled={code.length !== 6}>
          Verify code
        </Button>
        <AuthSwitch prompt="Didn't get a code?" href="/forgetPassword" label="Resend" />
      </form>
    </AuthShell>
  )
}
