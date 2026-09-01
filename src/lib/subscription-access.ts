import type { SessionPayload } from "@/lib/api/auth"

export type AccessInfo = {
  allowed: boolean
  status: string
  trialEndsAt: string | null
  isOwner: boolean
  planCode: string
  planName: string
  trialRequestPending: boolean
}

export function accessFromSession(me: SessionPayload): AccessInfo {
  const trialEndsAt = me.subscription?.trialEndsAt ?? null
  const allowed =
    me.access?.allowed ??
    (me.subscription?.status === "ACTIVE" ||
      (me.subscription?.status === "TRIAL" &&
        (!trialEndsAt || new Date(trialEndsAt).getTime() > Date.now())))

  return {
    allowed,
    status: me.access?.status ?? me.subscription?.status ?? "EXPIRED",
    trialEndsAt,
    isOwner: me.user.isOwner,
    planCode: me.plan.code,
    planName: me.plan.displayName,
    trialRequestPending: me.trialRequest?.status === "pending",
  }
}

export function formatTrialEndDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export const FALLBACK_PLANS = [
  {
    code: "starter",
    displayName: "Starter",
    priceMonthly: 2999,
    maxStores: 1,
    maxUsers: 3,
    maxProducts: 500,
    moduleAccess: [] as string[],
  },
  {
    code: "business",
    displayName: "Business",
    priceMonthly: 7999,
    maxStores: 3,
    maxUsers: 10,
    maxProducts: 2000,
    moduleAccess: [] as string[],
  },
  {
    code: "professional",
    displayName: "Professional",
    priceMonthly: 14999,
    maxStores: 5,
    maxUsers: 25,
    maxProducts: 10000,
    moduleAccess: [] as string[],
  },
  {
    code: "enterprise",
    displayName: "Enterprise",
    priceMonthly: 29999,
    maxStores: 10,
    maxUsers: 50,
    maxProducts: 999999,
    moduleAccess: [] as string[],
  },
]
