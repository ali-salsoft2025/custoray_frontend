"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { AuthCodeInput } from "@/components/auth/auth-code-input"
import {
  AUTH_BUTTON,
  AuthHeading,
  AuthShell,
} from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAuth } from "@/context/auth-context"
import { clearTwoFactorChallenge, loadTwoFactorChallenge } from "@/lib/two-factor"

export function TwoFactorForm() {
  const router = useRouter()
  const { completeTwoFactor, session, hydrated } = useAuth()
  const [code, setCode] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!hydrated) return
    if (loadTwoFactorChallenge()) {
      setReady(true)
      return
    }
    if (session) {
      router.replace("/home")
      return
    }
    toast.error("Sign in first to verify your authenticator code.")
    router.replace("/")
  }, [hydrated, session, router])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (code.length !== 6) {
      toast.error("Enter the 6-digit code from Google Authenticator.")
      return
    }

    setVerifying(true)
    const result = await completeTwoFactor(code)
    setVerifying(false)

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    toast.success(result.accessAllowed ? "Welcome back!" : "Your trial has ended.")
    router.replace(result.accessAllowed ? "/home" : "/trial-ended")
  }

  if (!ready) return null

  return (
    <AuthShell hero="twofa">
      <AuthHeading
        title="Authenticator code"
        accent="code"
        subtitle="Open Google Authenticator and enter the 6-digit code for Custoray."
      />
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="otp">Google Authenticator</Label>
          <AuthCodeInput id="otp" value={code} onChange={setCode} />
        </div>
        <Button
          type="submit"
          className={AUTH_BUTTON}
          disabled={code.length !== 6 || verifying}
        >
          {verifying ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner size="sm" />
              Verifying…
            </span>
          ) : (
            "Verify and continue"
          )}
        </Button>
        <p className="text-muted-foreground pt-1 text-center text-xs">
          Use a different account?{" "}
          <button
            type="button"
            className="text-primary font-medium hover:underline"
            onClick={() => {
              clearTwoFactorChallenge()
              router.replace("/")
            }}
          >
            Back to sign in
          </button>
        </p>
      </form>
    </AuthShell>
  )
}
