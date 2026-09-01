"use client"

import { Mail } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { toast } from "sonner"

import { AuthSocialButtons } from "@/components/auth/auth-social"
import {
  AUTH_BUTTON,
  AUTH_INPUT,
  AuthHeading,
  AuthShell,
  AuthSwitch,
} from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { PasswordInput } from "@/components/ui/password-input"
import { useAuth } from "@/context/auth-context"
import { loadTwoFactorChallenge } from "@/lib/two-factor"

export function LoginForm({
  expiredNotice = false,
  redirectTo,
}: {
  expiredNotice?: boolean
  redirectTo?: string
}) {
  const router = useRouter()
  const { login, session, hydrated, access } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const stayOnAuth = useRef(false)

  const nextPath = access && !access.allowed ? "/trial-ended" : redirectTo || "/home"

  useEffect(() => {
    if (!hydrated || stayOnAuth.current) return
    if (loadTwoFactorChallenge()) {
      router.replace("/2fa")
      return
    }
    if (!session) return
    if (access && !access.allowed) {
      router.replace("/trial-ended")
      return
    }
    if (!access || access.allowed) {
      router.replace(redirectTo || "/home")
    }
  }, [hydrated, session, access, router, redirectTo])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const email = String(fd.get("email") ?? "")
    const password = String(fd.get("password") ?? "")

    setSubmitting(true)
    const result = await login(email, password)
    setSubmitting(false)

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    if (result.requiresTwoFactor) {
      stayOnAuth.current = true
      router.replace("/2fa")
      return
    }

    toast.success(
      result.accessAllowed ? "Welcome back!" : "Your trial has ended."
    )
    router.replace(result.accessAllowed ? nextPath : "/trial-ended")
  }

  return (
    <AuthShell>
      <AuthHeading
        title="Welcome back"
        accent="back"
        subtitle={
          expiredNotice
            ? "Your trial has ended. Sign in to request more time or buy a plan."
            : "Sign in to your account to continue"
        }
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
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgetPassword"
              prefetch
              className="text-primary text-xs font-medium hover:underline"
              onClick={() => {
                stayOnAuth.current = true
              }}
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            className={AUTH_INPUT}
          />
        </div>
        <label className="flex items-center gap-2 text-xs">
          <Checkbox id="remember" name="remember" />
          <span>Remember me</span>
        </label>
        <Button type="submit" className={AUTH_BUTTON} disabled={submitting}>
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner size="sm" />
              Signing in…
            </span>
          ) : (
            "Log in"
          )}
        </Button>
        <AuthSocialButtons
          onNavigate={() => {
            stayOnAuth.current = true
          }}
        />
        <AuthSwitch
          prompt="Don't have an account?"
          href="/signup"
          label="Sign up"
          onNavigate={() => {
            stayOnAuth.current = true
          }}
        />
      </form>
    </AuthShell>
  )
}
