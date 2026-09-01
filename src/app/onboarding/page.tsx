"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiMe, apiOnboardingProgress, apiPatchOnboarding } from "@/lib/api/auth";
import { useAuth } from "@/context/auth-context";

const STEPS = [
  { key: "company", label: "Complete company profile", href: "/settings" },
  { key: "products", label: "Add your first product", href: "/inventory/products" },
  { key: "buyer", label: "Add your first buyer", href: "/customers" },
  { key: "firstSale", label: "Record your first sale", href: "/sales" },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { access, hydrated, isAuthenticated } = useAuth();
  const [steps, setSteps] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.replace("/");
      return;
    }
    if (access && !access.allowed) {
      router.replace("/trial-ended");
    }
  }, [hydrated, isAuthenticated, access, router]);

  useEffect(() => {
    if (!hydrated || !isAuthenticated) return;
    apiOnboardingProgress()
      .then((p) => setSteps(p.steps ?? {}))
      .catch(async () => {
        try {
          const me = await apiMe();
          setSteps((me.onboarding?.steps as Record<string, boolean>) ?? {});
        } catch {
          router.replace("/");
        }
      })
      .finally(() => setLoading(false));
  }, [hydrated, isAuthenticated, router]);

  async function markDone(key: string) {
    const next = { ...steps, [key]: true };
    setSteps(next);
    try {
      await apiPatchOnboarding(next);
      toast.success("Progress saved");
    } catch {
      toast.error("Could not save progress");
    }
  }

  const doneCount = STEPS.filter((s) => steps[s.key]).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Custoray</CardTitle>
          <p className="text-muted-foreground text-sm">
            {doneCount}/{STEPS.length} steps complete — get set up in minutes.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : (
            STEPS.map((step) => (
              <div
                key={step.key}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">{step.label}</p>
                  <p className="text-muted-foreground text-sm">
                    {steps[step.key] ? "Done" : "Not started"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={step.href}>Go</Link>
                  </Button>
                  {!steps[step.key] && (
                    <Button size="sm" onClick={() => markDone(step.key)}>
                      Mark done
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
          {doneCount >= 3 && (
            <Button onClick={() => router.push("/home")}>Go to dashboard</Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
