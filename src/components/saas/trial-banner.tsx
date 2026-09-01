"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { apiMe, type SessionPayload } from "@/lib/api/auth";

export function TrialBanner() {
  const [session, setSession] = useState<SessionPayload | null>(null);

  useEffect(() => {
    apiMe()
      .then(setSession)
      .catch(() => setSession(null));
  }, []);

  if (!session?.subscription) return null;

  const { status, trialEndsAt } = session.subscription;
  if (status !== "TRIAL" || !trialEndsAt) return null;

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="bg-primary/10 border-primary/20 flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2 text-sm">
      <span>
        <strong>{session.plan.displayName}</strong> trial — {daysLeft} day
        {daysLeft === 1 ? "" : "s"} left
      </span>
      <Link href="/settings/billing" className="text-primary font-medium underline">
        Plans & billing
      </Link>
    </div>
  );
}
