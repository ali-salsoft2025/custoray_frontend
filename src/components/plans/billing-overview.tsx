"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { apiBillingSummary } from "@/lib/api/auth"
import { formatLimit } from "@/lib/plans"
import { formatTrialEndDate } from "@/lib/subscription-access"

function statusI18nKey(status: string | undefined) {
  if (status === "TRIAL") return "trial"
  if (status === "ACTIVE") return "active"
  if (status === "PAST_DUE") return "pastDue"
  if (status === "CANCELLED") return "cancelled"
  if (status === "EXPIRED") return "expired"
  return null
}

export function BillingOverview() {
  const { t } = useTranslation("settings")
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
  const statusKey = statusI18nKey(status)
  const statusText = statusKey ? t(`billing.statuses.${statusKey}`) : (status ?? "—")

  const periodText = onTrial
    ? trialEndsAt
      ? t("billing.trialEnds", { date: formatTrialEndDate(trialEndsAt) })
      : t("billing.trialInProgress")
    : periodEnd
      ? t("billing.periodEnds", { date: formatTrialEndDate(periodEnd) })
      : t("billing.noBillingPeriod")

  return (
    <section className="bg-card rounded-2xl border p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold">{t("billing.title")}</h2>
            <Badge variant={onTrial ? "secondary" : "default"}>{statusText}</Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {activeCompany?.name ? `${activeCompany.name} · ` : null}
            {onTrial ? t("billing.freeTrial") : planName}
            {" · "}
            {periodText}
          </p>
        </div>
        <Button variant="outline" className="shrink-0 rounded-full" disabled>
          {t("billing.managePayment")}
        </Button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <UsageStat
          label={t("billing.products")}
          used={usage?.products}
          max={plan?.maxProducts}
        />
        <UsageStat label={t("billing.users")} used={usage?.users} max={plan?.maxUsers} />
        <UsageStat
          label={t("billing.branches")}
          used={usage?.stores}
          max={plan?.maxStores}
        />
      </div>

      <p className="text-muted-foreground mt-4 text-xs">
        {t("billing.cardPaymentsHint")}
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
