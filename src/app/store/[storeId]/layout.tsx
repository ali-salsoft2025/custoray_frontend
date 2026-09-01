import React from "react"

import { DashboardProviders } from "@/components/dashboard-providers"

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardProviders>
      {children}
    </DashboardProviders>
  )
}
