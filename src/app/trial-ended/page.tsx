"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAuth } from "@/context/auth-context"
import { useCheckoutReturn } from "@/hooks/use-checkout-return"
import {
  apiCheckout,
  apiPublicPlans,
  apiRequestTrial,
} from "@/lib/api/auth"
import { FALLBACK_PLANS, formatTrialEndDate } from "@/lib/subscription-access"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

function formatPrice(cents: number) {
  return `Rs ${(cents / 100).toFixed(0)}`
}

function TrialEndedContent() {
  const { t } = useTranslation("plans")
  const router = useRouter()
  const params = useSearchParams()
  const { access, hydrated, isAuthenticated, refreshAccess, logout } = useAuth()
  useCheckoutReturn({ redirectWhenActive: "/home" })
  const [plans, setPlans] = useState(FALLBACK_PLANS)
  const [reason, setReason] = useState("")
  const [pending, setPending] = useState(false)
  const [requested, setRequested] = useState(false)

  useEffect(() => {
    if (!hydrated) return
    if (!isAuthenticated) {
      router.replace("/")
      return
    }
    if (access?.allowed) {
      router.replace("/home")
    }
  }, [hydrated, isAuthenticated, access, router])

  useEffect(() => {
    setRequested(Boolean(access?.trialRequestPending) || params.get("requested") === "1")
  }, [access?.trialRequestPending, params])

  useEffect(() => {
    apiPublicPlans()
      .then((list) => {
        if (list.length) setPlans(list)
      })
      .catch(() => {
        /* fallback */
      })
  }, [])

  if (!hydrated || !isAuthenticated || !access || access.allowed) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const isOwner = access?.isOwner ?? false

  async function requestTrial() {
    if (reason.trim().length < 8) {
      toast.error(t("toasts.reasonShort"))
      return
    }
    setPending(true)
    try {
      await apiRequestTrial(reason.trim())
      setRequested(true)
      await refreshAccess()
      toast.success(t("toasts.requestSent"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toasts.couldNotSend"))
    } finally {
      setPending(false)
    }
  }

  async function buyPlan(planCode: string) {
    setPending(true)
    try {
      const result = await apiCheckout(planCode, "monthly", "/trial-ended")
      if (result.applied) {
        await refreshAccess()
        toast.success(t("toasts.subscriptionActive"))
        router.replace("/home")
        return
      }
      if (!result.checkoutUrl) {
        toast.error(t("toasts.noCheckout"))
        return
      }
      window.location.assign(result.checkoutUrl)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toasts.couldNotCheckout"))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-4xl flex-col justify-center gap-6 px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {t("trialEnded")}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {access?.planName
            ? t("trialOver", {
                plan: access.planName,
                date: access?.trialEndsAt
                  ? ` (${formatTrialEndDate(access.trialEndsAt)})`
                  : "",
              })
            : t("trialOverGeneric", {
                date: access?.trialEndsAt
                  ? ` (${formatTrialEndDate(access.trialEndsAt)})`
                  : "",
              })}{" "}
          {t("dataSaved")}
        </p>
      </div>

      {!isOwner ? (
        <Card>
          <CardContent className="p-6 text-sm">
            {t("staffMessage")}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t("requestTrial")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {requested ? (
                <p className="text-sm">
                  {t("requestPending")}
                </p>
              ) : (
                <>
                  <Label htmlFor="trial-reason">{t("reasonLabel")}</Label>
                  <textarea
                    id="trial-reason"
                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-24 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={t("reasonPlaceholder")}
                  />
                  <Button type="button" variant="outline" disabled={pending} onClick={() => void requestTrial()}>
                    {t("sendRequest")}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <div>
            <h2 className="mb-3 text-lg font-semibold">{t("buySubscription")}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {plans.map((plan) => (
                <button
                  key={plan.code}
                  type="button"
                  disabled={pending}
                  onClick={() => void buyPlan(plan.code)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-colors hover:border-primary/40 disabled:opacity-60",
                    plan.code === access?.planCode && "border-primary ring-1 ring-primary"
                  )}
                >
                  <p className="font-semibold">{plan.displayName}</p>
                  <p className="mt-1 text-lg font-semibold">
                    {formatPrice(plan.priceMonthly)}
                    <span className="text-muted-foreground text-sm font-normal">
                      {t("perMonth")}
                    </span>
                  </p>
                  <p className="text-muted-foreground mt-2 text-xs">
                    {t("planMeta", {
                      stores: plan.maxStores,
                      users: plan.maxUsers,
                      products:
                        plan.maxProducts >= 999999
                          ? t("unlimited")
                          : plan.maxProducts,
                    })}
                  </p>
                  <p className="mt-3 text-sm font-medium">{t("subscribe")}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <p className="text-muted-foreground text-center text-xs">
        {t("adminHint")}{" "}
        <button
          type="button"
          className="underline"
          onClick={() => void refreshAccess().then((next) => next?.allowed && router.replace("/home"))}
        >
          {t("checkAccess")}
        </button>
        {" · "}
        <button type="button" className="underline" onClick={() => void logout()}>
          {t("signOut")}
        </button>
      </p>
    </div>
  )
}

export default function TrialEndedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center">
          <LoadingSpinner />
        </div>
      }
    >
      <TrialEndedContent />
    </Suspense>
  )
}
