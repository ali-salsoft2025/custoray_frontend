"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api/client";
import { FALLBACK_PLANS } from "@/lib/subscription-access";

type TenantRow = {
  id: string;
  name: string;
  status: string;
  subscription: {
    status: string;
    trialEndsAt: string | null;
    plan: { code: string; displayName: string };
  } | null;
};

type TrialRequestRow = {
  id: string;
  tenantId: string | null;
  tenantName: string;
  plan: string | null;
  subscriptionStatus: string | null;
  status: string;
  reason: string;
  days: number | null;
  createdAt: string;
};

export default function AdminDashboardPage() {
  const { t } = useTranslation("plans");
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [requests, setRequests] = useState<TrialRequestRow[]>([]);
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [extendDays, setExtendDays] = useState<Record<string, string>>({});
  const [assignPlan, setAssignPlan] = useState<Record<string, string>>({});
  const [approveDays, setApproveDays] = useState<Record<string, string>>({});

  async function reload() {
    const [tenantList, requestList, planList] = await Promise.all([
      apiFetch<TenantRow[]>("/admin/tenants").catch(() => []),
      apiFetch<TrialRequestRow[]>("/admin/trial-requests").catch(() => []),
      apiFetch<typeof FALLBACK_PLANS>("/admin/plans").catch(() => FALLBACK_PLANS),
    ]);
    setTenants(Array.isArray(tenantList) ? tenantList : []);
    setRequests(Array.isArray(requestList) ? requestList : []);
    if (planList.length) setPlans(planList);
  }

  useEffect(() => {
    void reload();
  }, []);

  async function extendTrial(tenantId: string) {
    const days = Number(extendDays[tenantId] || 7);
    try {
      await apiFetch(`/admin/tenants/${tenantId}/extend-trial`, {
        method: "POST",
        body: JSON.stringify({ days }),
      });
      toast.success(t("admin.toastExtended"));
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.toastExtendFailed"));
    }
  }

  async function assignSubscription(tenantId: string) {
    const planCode = assignPlan[tenantId] || plans[0]?.code;
    if (!planCode) return;
    try {
      await apiFetch(`/admin/tenants/${tenantId}/assign-subscription`, {
        method: "POST",
        body: JSON.stringify({ planCode }),
      });
      toast.success(t("admin.toastAssigned"));
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.toastAssignFailed"));
    }
  }

  async function approveRequest(id: string) {
    const days = Number(approveDays[id] || 7);
    try {
      await apiFetch(`/admin/trial-requests/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ days }),
      });
      toast.success(t("admin.toastApproved"));
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.toastApproveFailed"));
    }
  }

  async function rejectRequest(id: string) {
    try {
      await apiFetch(`/admin/trial-requests/${id}/reject`, { method: "POST" });
      toast.success(t("admin.toastRejected"));
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.toastRejectFailed"));
    }
  }

  const pending = requests.filter((row) => row.status === "pending");

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">{t("admin.title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.trialRequests", { count: pending.length })}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("admin.noPending")}</p>
          ) : (
            pending.map((row) => (
              <div key={row.id} className="rounded-lg border p-3 text-sm">
                <p className="font-medium">{row.tenantName}</p>
                <p className="text-muted-foreground mt-1">{row.reason}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Input
                    className="h-9 w-20"
                    type="number"
                    min={1}
                    max={15}
                    placeholder={t("admin.days")}
                    value={approveDays[row.id] ?? "7"}
                    onChange={(e) =>
                      setApproveDays((prev) => ({ ...prev, [row.id]: e.target.value }))
                    }
                  />
                  <Button size="sm" onClick={() => void approveRequest(row.id)}>
                    {t("admin.approve")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void rejectRequest(row.id)}>
                    {t("admin.reject")}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.tenants")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tenants.map((tenant) => (
            <div key={tenant.id} className="rounded-lg border p-3 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">{tenant.name}</p>
                <p className="text-muted-foreground">
                  {tenant.subscription?.plan.displayName ?? t("admin.noPlan")} ·{" "}
                  {tenant.subscription?.status ?? "—"}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Input
                  className="h-9 w-20"
                  type="number"
                  min={1}
                  max={365}
                  placeholder={t("admin.days")}
                  value={extendDays[tenant.id] ?? "7"}
                  onChange={(e) =>
                    setExtendDays((prev) => ({ ...prev, [tenant.id]: e.target.value }))
                  }
                />
                <Button size="sm" variant="outline" onClick={() => void extendTrial(tenant.id)}>
                  {t("admin.extendTrial")}
                </Button>
                <select
                  className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                  value={assignPlan[tenant.id] ?? tenant.subscription?.plan.code ?? plans[0]?.code}
                  onChange={(e) =>
                    setAssignPlan((prev) => ({ ...prev, [tenant.id]: e.target.value }))
                  }
                >
                  {plans.map((plan) => (
                    <option key={plan.code} value={plan.code}>
                      {plan.displayName}
                    </option>
                  ))}
                </select>
                <Button size="sm" onClick={() => void assignSubscription(tenant.id)}>
                  {t("admin.assignPlan")}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
