"use client"

import { useRouter } from "next/navigation"
import { type FormEvent } from "react"
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
  const router = useRouter()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fd = new FormData(event.currentTarget)
    const password = String(fd.get("password") ?? "")
    const confirm = String(fd.get("confirm") ?? "")
    if (password !== confirm) {
      toast.error("Passwords do not match.")
      return
    }
    toast.success("Password updated. You can sign in now.")
    router.push("/")
  }

  return (
    <AuthShell hero="reset_password">
      <AuthHeading
        title="Reset password"
        accent="password"
        subtitle="Choose a new password for your account."
      />
      <form className="space-y-3.5" onSubmit={handleSubmit}>
        <div className="grid gap-1.5">
          <Label htmlFor="password">New password</Label>
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
          <Label htmlFor="confirm">Confirm password</Label>
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
          Reset password
        </Button>
        <AuthSwitch prompt="Back to" href="/" label="Sign in" />
      </form>
    </AuthShell>
  )
}
