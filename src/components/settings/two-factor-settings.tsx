"use client"

import { Check, Copy, ShieldCheck } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { AuthCodeInput } from "@/components/auth/auth-code-input"
import { SettingsSection } from "@/components/settings/settings-section"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  apiTotpDisable,
  apiTotpEnable,
  apiTotpSetup,
  apiTotpStatus,
  type TotpSetup,
} from "@/lib/api/auth"
import { formatTotpSecret } from "@/lib/two-factor"

export function TwoFactorSettings() {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [setup, setSetup] = useState<TotpSetup | null>(null)
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    apiTotpStatus()
      .then((status) => setEnabled(status.enabled))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function startSetup() {
    setBusy(true)
    try {
      const next = await apiTotpSetup()
      setSetup(next)
      setCode("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start setup")
    } finally {
      setBusy(false)
    }
  }

  async function enable() {
    if (code.length !== 6) {
      toast.error("Enter the 6-digit code from Google Authenticator.")
      return
    }
    setBusy(true)
    try {
      await apiTotpEnable(code)
      setEnabled(true)
      setSetup(null)
      setCode("")
      toast.success("Google Authenticator is enabled")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid authenticator code")
    } finally {
      setBusy(false)
    }
  }

  async function disable() {
    if (code.length !== 6) {
      toast.error("Enter the current 6-digit code to turn 2FA off.")
      return
    }
    setBusy(true)
    try {
      await apiTotpDisable(code)
      setEnabled(false)
      setCode("")
      toast.success("Google Authenticator is disabled")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid authenticator code")
    } finally {
      setBusy(false)
    }
  }

  async function copySecret() {
    if (!setup?.secret) return
    try {
      await navigator.clipboard.writeText(setup.secret)
      setCopied(true)
      toast.success("Secret key copied")
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("Could not copy the key")
    }
  }

  return (
    <SettingsSection
      title="Google Authenticator"
      description="Add a 6-digit code at sign-in using the Google Authenticator app."
      icon={<ShieldCheck />}
      compact
    >
      {loading ? (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <LoadingSpinner size="sm" />
          Loading…
        </div>
      ) : enabled && !setup ? (
        <div className="space-y-3">
          <p className="text-sm">
            Two-factor authentication is <span className="font-medium text-primary">on</span>.
            Enter a current authenticator code to turn it off.
          </p>
          <div className="grid gap-2">
            <Label htmlFor="disable-otp">Authenticator code</Label>
            <AuthCodeInput id="disable-otp" value={code} onChange={setCode} />
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={busy || code.length !== 6}
            onClick={() => void disable()}
          >
            {busy ? "Disabling…" : "Disable 2FA"}
          </Button>
        </div>
      ) : setup ? (
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm">
            Scan this QR code in Google Authenticator, then enter the 6-digit code to finish.
          </p>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <div className="rounded-xl border border-border/70 bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={setup.qrDataUrl}
                alt="Google Authenticator QR code"
                width={160}
                height={160}
                className="size-40"
              />
            </div>
            <button
              type="button"
              onClick={() => void copySecret()}
              className="text-foreground inline-flex items-center gap-1.5 font-mono text-xs tracking-wide hover:text-primary"
            >
              {formatTotpSecret(setup.secret)}
              {copied ? (
                <Check className="size-3.5 text-primary" />
              ) : (
                <Copy className="size-3.5 text-muted-foreground" />
              )}
            </button>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="enable-otp">Authenticator code</Label>
            <AuthCodeInput id="enable-otp" value={code} onChange={setCode} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={busy || code.length !== 6} onClick={() => void enable()}>
              {busy ? "Verifying…" : "Enable Google 2FA"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setSetup(null)
                setCode("")
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm">
            After you enable this, sign-in will ask for a Google Authenticator code.
          </p>
          <Button type="button" disabled={busy} onClick={() => void startSetup()}>
            {busy ? "Preparing…" : "Set up Google Authenticator"}
          </Button>
        </div>
      )}
    </SettingsSection>
  )
}
