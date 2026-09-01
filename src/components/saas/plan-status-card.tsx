"use client"

import Link from "next/link"
import { Sparkles } from "lucide-react"

import { useSidebar } from "@/components/ui/sidebar"
import { useAuth } from "@/context/auth-context"
import { TRIAL_DAYS } from "@/lib/plans"
import { formatTrialEndDate } from "@/lib/subscription-access"
import { cn } from "@/lib/utils"

function daysLeft(iso: string) {
  return Math.max(
    0,
    Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  )
}

function statusLabel(status: string) {
  if (status === "TRIAL") return "Trial"
  if (status === "ACTIVE") return "Active"
  if (status === "PAST_DUE") return "Past due"
  if (status === "CANCELLED") return "Cancelled"
  if (status === "EXPIRED") return "Expired"
  return status
}

export function PlanStatusCard() {
  const { access } = useAuth()
  const { state } = useSidebar()
  const collapsed = state === "collapsed"

  if (!access) return null

  const onTrial = access.status === "TRIAL"
  const attention = access.status === "PAST_DUE" || access.status === "EXPIRED"
  const left = access.trialEndsAt ? daysLeft(access.trialEndsAt) : 0
  const remainingPct = onTrial
    ? Math.min(100, Math.max(8, (left / TRIAL_DAYS) * 100))
    : 100
  const usedDays = onTrial ? Math.min(TRIAL_DAYS, TRIAL_DAYS - left) : 0
  const title =
    onTrial && access.trialEndsAt
      ? `Trial ends ${formatTrialEndDate(access.trialEndsAt)}`
      : `${access.planName} · ${statusLabel(access.status)}`

  if (collapsed) {
    return (
      <Link
        href="/settings/billing"
        title={title}
        className={cn(
          "mx-auto flex size-8 flex-col items-center justify-center rounded-lg text-[9px] font-bold leading-none ring-1",
          attention
            ? "bg-amber-50 text-amber-700 ring-amber-200"
            : "bg-primary/15 text-primary ring-primary/20"
        )}
      >
        {onTrial ? left : <Sparkles className="size-3.5" />}
      </Link>
    )
  }

  return (
    <Link
      href="/settings/billing"
      title={title}
      className={cn(
        "group flex min-h-[7.5rem] flex-col rounded-xl p-4 ring-1 transition-colors",
        attention
          ? "bg-amber-50 ring-amber-200 hover:bg-amber-100/80 dark:bg-amber-950/30 dark:ring-amber-800"
          : "bg-primary/10 ring-primary/20 hover:bg-primary/[0.14]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-foreground truncate text-sm font-semibold leading-tight">
            {access.planName}
          </p>
          <p className="text-muted-foreground mt-1 text-xs leading-snug">
            {onTrial
              ? left === 0
                ? "Trial ends today"
                : `${left} day${left === 1 ? "" : "s"} left of ${TRIAL_DAYS}`
              : statusLabel(access.status)}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
            attention
              ? "bg-amber-200/80 text-amber-900"
              : "bg-primary/20 text-primary"
          )}
        >
          {statusLabel(access.status)}
        </span>
      </div>
      <div className="mt-auto pt-4">
        {onTrial ? (
          <div>
            <div className="bg-primary/20 h-1.5 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full"
                style={{ width: `${remainingPct}%` }}
              />
            </div>
            <p className="text-muted-foreground mt-1.5 text-[11px]">
              Day {Math.max(1, usedDays)} of {TRIAL_DAYS}
              {access.trialEndsAt
                ? ` · ends ${formatTrialEndDate(access.trialEndsAt)}`
                : null}
            </p>
          </div>
        ) : null}
        {access.trialRequestPending ? (
          <p className="text-primary mt-1.5 text-[11px] font-medium">
            Extension request pending
          </p>
        ) : null}
      </div>
    </Link>
  )
}
