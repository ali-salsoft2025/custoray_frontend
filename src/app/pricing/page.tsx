"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiPublicPlans } from "@/lib/api/auth";

type Plan = {
  code: string;
  displayName: string;
  priceMonthly: number;
  maxStores: number;
  maxUsers: number;
  maxProducts: number;
};

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiPublicPlans()
      .then(setPlans)
      .catch(() =>
        setPlans([
          { code: "starter", displayName: "Starter", priceMonthly: 2999, maxStores: 1, maxUsers: 3, maxProducts: 500 },
          { code: "business", displayName: "Business", priceMonthly: 7999, maxStores: 3, maxUsers: 10, maxProducts: 2000 },
          { code: "professional", displayName: "Professional", priceMonthly: 14999, maxStores: 5, maxUsers: 25, maxProducts: 10000 },
          { code: "enterprise", displayName: "Enterprise", priceMonthly: 29999, maxStores: 10, maxUsers: 50, maxProducts: 999999 },
        ])
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Simple pricing for every shop</h1>
        <p className="text-muted-foreground mt-2">Pick a plan that fits your shop.</p>
      </div>
      {loading ? (
        <p className="text-center text-muted-foreground">Loading plans…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <Card key={plan.code} className="flex flex-col">
              <CardHeader>
                <CardTitle>{plan.displayName}</CardTitle>
                <p className="text-2xl font-semibold">Rs {(plan.priceMonthly / 100).toFixed(0)}/mo</p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3 text-sm">
                <p>{plan.maxStores} store(s)</p>
                <p>{plan.maxUsers} users</p>
                <p>{plan.maxProducts >= 999999 ? "Unlimited" : plan.maxProducts} products</p>
                <Button asChild className="mt-auto">
                  <Link href={`/signup?plan=${plan.code}`}>Get started</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <p className="text-center text-sm">
        Already have an account? <Link href="/" className="underline">Sign in</Link>
      </p>
    </div>
  );
}
