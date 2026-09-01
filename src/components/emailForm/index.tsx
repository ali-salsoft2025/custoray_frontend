"use client"

import { Mail } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"

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
import { apiForgotPassword } from "@/lib/api/auth"

export function EmailForm() {
  const router = useRouter()
  const [sending, setSending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fd = new FormData(event.currentTarget)
    const email = String(fd.get("email") ?? "").trim()
    if (!email) {
      toast.error("Enter your email")
      return
    }

    setSending(true)
    try {
      await apiForgotPassword(email)
      toast.success("Enter the 6-digit code we sent to your email.")
      router.push(`/resetCode?email=${encodeURIComponent(email)}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send reset email")
    } finally {
      setSending(false)
    }
  }

  return (
    <AuthShell hero="reset_email">
      <AuthHeading
        title="Forgot password"
        accent="password"
        subtitle="Enter your email and we’ll send reset instructions if an account exists."
      />
      <form className="space-y-3.5" onSubmit={handleSubmit}>
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@company.com"
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
        <Button type="submit" className={AUTH_BUTTON} disabled={sending}>
          {sending ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner size="sm" />
              Sending…
            </span>
          ) : (
            "Send reset email"
          )}
        </Button>
        <AuthSwitch prompt="Remembered it?" href="/" label="Sign in" />
      </form>
    </AuthShell>
  )
}
