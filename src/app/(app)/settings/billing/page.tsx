"use client"

import { Suspense } from "react"

import { PlansCatalog } from "@/components/plans/plans-catalog"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function BillingSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      }
    >
      <PlansCatalog />
    </Suspense>
  )
}
