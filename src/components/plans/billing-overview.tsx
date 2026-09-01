"use client"

import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { apiBillingSummary } from "@/lib/api/auth"
import { formatLimit } from "@/lib/plans"
import { formatTrialEndDate } from "@/lib/subscription-access"

function statusLabel(status: string | undefined) {
  if (status === "TRIAL") return "Trial"
  if (status === "ACTIVE") return "Active"
  if (status === "PAST_DUE") return "Past due"
  if (status === "CANCELLED") return "Cancelled"
  if (status === "EXPIRED") return "Expired"
  return status ?? "—"
}

export function BillingOverview() {
  const { access, activeCompany } = useAuth()
  const [data, setData] = useState<Awaited<ReturnType<typeof apiBillingSummary>> | null>(
    null
  )

  useEffect(() => {
    apiBillingSummary()
      .then(setData)
      .catch(() => setData(null))
  }, [])

  const status = data?.subscription?.status ?? access?.status
  const onTrial = status === "TRIAL"
  const planName = data?.plan?.displayName ?? access?.planName ?? "—"
  const trialEndsAt = data?.subscription?.trialEndsAt ?? access?.trialEndsAt
  const periodEnd = data?.subscription?.currentPeriodEnd
  const usage = data?.usage
  const plan = data?.plan

  const periodText = onTrial
    ? trialEndsAt
      ? `Trial ends ${formatTrialEndDate(trialEndsAt)}`
      : "Trial in progress"
    : periodEnd
      ? `Current period ends ${formatTrialEndDate(periodEnd)}`
      : "No billing period"

  return (
    <section className="bg-card rounded-2xl border p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold">Billing</h2>
            <Badge variant={onTrial ? "secondary" : "default"}>{statusLabel(status)}</Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {activeCompany?.name ? `${activeCompany.name} · ` : null}
            {onTrial ? "Free trial" : planName}
            {" · "}
            {periodText}
          </p>
        </div>
        <Button variant="outline" className="shrink-0 rounded-full" disabled>
          Manage payment
        </Button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <UsageStat
          label="Products"
          used={usage?.products}
          max={plan?.maxProducts}
        />
        <UsageStat label="Users" used={usage?.users} max={plan?.maxUsers} />
        <UsageStat
          label="Branches"
          used={usage?.stores}
          max={plan?.maxStores}
        />
      </div>

      <p className="text-muted-foreground mt-4 text-xs">
        Card payments are not connected yet. This page is for your current
        subscription and usage — not for switching plans.
      </p>
    </section>
  )
}

function UsageStat({
  label,
  used,
  max,
}: {
  label: string
  used: number | undefined
  max: number | undefined
}) {
  return (
    <div className="bg-muted/60 rounded-xl px-4 py-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums">
        {used == null ? "—" : used.toLocaleString()}
        {max != null ? (
          <span className="text-muted-foreground font-normal">
            {" "}
            / {formatLimit(max)}
          </span>
        ) : null}
      </p>
    </div>
  )
}
