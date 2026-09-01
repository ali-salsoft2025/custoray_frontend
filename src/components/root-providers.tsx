"use client"

import * as React from "react"

import { AuthProvider } from "@/context/auth-context"
import { AppearanceProvider } from "@/components/theme/appearance-provider"
import { Toaster } from "@/components/ui/sonner"

export function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppearanceProvider>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </AppearanceProvider>
  )
}
