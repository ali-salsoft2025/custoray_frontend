"use client"

import { Check } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/context/auth-context"
import { useCheckoutReturn } from "@/hooks/use-checkout-return"
import {
  apiBillingPortal,
  apiBillingSummary,
  apiCheckout,
  apiPublicPlans,
  apiRequestTrial,
} from "@/lib/api/auth"
import {
  formatPlanPrice,
  PLAN_BLURB,
  planIncludes,
  planVolumeFeatures,
  sortPlans,
  yearlyFromMonthly,
  type BillingInterval,
  type PublicPlan,
} from "@/lib/plans"
import { FALLBACK_PLANS, formatTrialEndDate } from "@/lib/subscription-access"
import { cn } from "@/lib/utils"

function FeatureRow({ children }: { children: string }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <span className="bg-primary text-primary-foreground mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
        <Check className="size-3" strokeWidth={3} />
      </span>
      <span>{children}</span>
    </li>
  )
}

export function PlansCatalog() {
  const { access, refreshAccess } = useAuth()
  useCheckoutReturn()
  const [plans, setPlans] = useState<PublicPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [interval, setInterval] = useState<BillingInterval>("yearly")
  const [extendOpen, setExtendOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [pending, setPending] = useState(false)
  const [checkingOut, setCheckingOut] = useState<string | null>(null)
  const [hasCustomer, setHasCustomer] = useState(false)
  const [billingEnabled, setBillingEnabled] = useState<boolean | null>(null)

  const currentCode = access?.planCode
  const onTrial = access?.status === "TRIAL"
  const isOwner = access?.isOwner ?? false
  const requested = access?.trialRequestPending
  const yearly = interval === "yearly"

  useEffect(() => {
    apiPublicPlans()
      .then((list) => setPlans(sortPlans(list.filter((p) => p.code !== "enterprise"))))
      .catch(() =>
        setPlans(
          sortPlans(
            FALLBACK_PLANS.filter((p) => p.code !== "enterprise").map((p) => ({
              code: p.code,
              displayName: p.displayName,
              priceMonthly: p.priceMonthly,
              maxStores: p.maxStores,
              maxUsers: p.maxUsers,
              maxProducts: p.maxProducts,
              moduleAccess: p.moduleAccess,
            }))
          )
        )
      )
      .finally(() => setLoading(false))
    apiBillingSummary()
      .then((summary) => {
        setHasCustomer(Boolean(summary.billingCustomer))
        setBillingEnabled(summary.billingEnabled)
      })
      .catch(() => {
        setHasCustomer(false)
        setBillingEnabled(null)
      })
  }, [])

  async function submitExtend() {
    if (reason.trim().length < 8) {
      toast.error("Please explain why you need more time (at least 8 characters).")
      return
    }
    setPending(true)
    try {
      await apiRequestTrial(reason.trim())
      await refreshAccess()
      setExtendOpen(false)
      setReason("")
      toast.success("Request sent. We will email you when an admin responds.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send request")
    } finally {
      setPending(false)
    }
  }

  function handleJoinNow() {
    if (!onTrial) {
      toast.info("Turn on Annually, then pick a plan to get 2 months free.")
      return
    }
    if (!isOwner) {
      toast.error("Ask the owner to request more trial time.")
      return
    }
    if (requested) {
      toast.info("Your extension request is already pending.")
      return
    }
    setExtendOpen(true)
  }

  async function handleUpgrade(planCode: string) {
    if (!isOwner) {
      toast.error("Ask the business owner to change the plan.")
      return
    }
    if (billingEnabled === false) {
      toast.error("Stripe is not configured yet. Add the test keys on the API and restart it.")
      return
    }
    setCheckingOut(planCode)
    try {
      const result = await apiCheckout(planCode, interval, "/settings/billing")
      if (result.applied) {
        await refreshAccess()
        toast.success("Plan updated")
        return
      }
      if (!result.checkoutUrl) {
        toast.error("Stripe did not return a checkout page.")
        return
      }
      window.location.assign(result.checkoutUrl)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start checkout")
    } finally {
      setCheckingOut(null)
    }
  }

  async function handleManageBilling() {
    if (!isOwner) {
      toast.error("Ask the business owner to manage billing.")
      return
    }
    setPending(true)
    try {
      const result = await apiBillingPortal()
      window.location.assign(result.portalUrl)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open billing portal")
    } finally {
      setPending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    )
  }

  const trialEnds = access?.trialEndsAt ? formatTrialEndDate(access.trialEndsAt) : null

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold tracking-tight uppercase">
          Choose your plans
        </h2>
        <div className="flex items-center gap-3 text-sm">
          <span className={cn(!yearly && "text-foreground font-medium", yearly && "text-muted-foreground")}>
            Monthly
          </span>
          <Switch
            checked={yearly}
            onCheckedChange={(checked) => setInterval(checked ? "yearly" : "monthly")}
            aria-label="Bill annually"
            className="h-6 w-11"
          />
          <span className={cn(yearly && "text-foreground font-medium", !yearly && "text-muted-foreground")}>
            Annually
          </span>
        </div>
      </div>

      <div className="bg-muted/40 flex flex-col gap-3 rounded-xl border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">
              {onTrial
                ? trialEnds
                  ? `Free trial available · ends ${trialEnds}`
                  : "Free trial available"
                : "2 months free on annual plans"}
            </p>
            {yearly ? (
              <span className="bg-primary text-primary-foreground rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                Save 2 months
              </span>
            ) : null}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {onTrial
              ? "Need more time? Request an extension, or pick a paid plan when you are ready."
              : "Switch to annual billing and get the first 2 months free."}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {isOwner && hasCustomer ? (
            <Button
              variant="outline"
              onClick={() => void handleManageBilling()}
              disabled={pending || Boolean(checkingOut)}
            >
              Manage billing
            </Button>
          ) : null}
          <Button className="shrink-0" onClick={handleJoinNow} disabled={Boolean(onTrial && requested)}>
            {onTrial && requested ? "Request sent" : "Join now"}
          </Button>
        </div>
      </div>

      <div className="grid w-full items-stretch gap-5 md:grid-cols-3">
        {plans.map((plan) => {
          const current = !onTrial && plan.code === currentCode
          const recommended = plan.code === "business"
          const extras = planVolumeFeatures(plan.code)
          const includes = planIncludes(plan)
          const price =
            yearly
              ? formatPlanPrice(yearlyFromMonthly(plan.priceMonthly).equivalentMonthlyCents)
              : formatPlanPrice(plan.priceMonthly)

          return (
            <article
              key={plan.code}
              className="bg-card flex flex-col rounded-xl border p-6"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-semibold">{plan.displayName}</h3>
                {recommended ? (
                  <span className="bg-primary text-primary-foreground rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                    Most popular
                  </span>
                ) : plan.code === "professional" ? (
                  <span className="bg-primary text-primary-foreground rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                    Scale
                  </span>
                ) : null}
              </div>
              <p className="text-muted-foreground mt-1 text-sm">{PLAN_BLURB[plan.code]}</p>
              <p className="mt-4 text-sm font-medium">
                {price}
                <span className="text-muted-foreground font-normal">/month</span>
              </p>

              <Button
                className="mt-4 w-full"
                variant={current ? "outline" : "default"}
                disabled={current || Boolean(checkingOut) || pending}
                onClick={current ? undefined : () => void handleUpgrade(plan.code)}
              >
                {current
                  ? "Your current plan"
                  : checkingOut === plan.code
                    ? "Redirecting…"
                    : onTrial
                      ? "Subscribe"
                      : "Upgrade"}
              </Button>

              <div className="bg-border my-5 h-px w-full" />

              <ul className="flex flex-1 flex-col gap-2.5">
                {extras.map((item) => (
                  <FeatureRow key={item}>{item}</FeatureRow>
                ))}
                {includes.map((item) => (
                  <FeatureRow key={item}>{item}</FeatureRow>
                ))}
              </ul>
            </article>
          )
        })}
      </div>

      <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend trial</DialogTitle>
            <DialogDescription>
              Tell us why you need more time. An admin reviews this, and extra trial
              days are limited.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="extend-trial-reason">Reason</Label>
            <textarea
              id="extend-trial-reason"
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-24 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="A few more days to finish setup / waiting on payment…"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setExtendOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={pending || reason.trim().length < 8}
              onClick={() => void submitExtend()}
            >
              {pending ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  Sending…
                </span>
              ) : (
                "Send request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
