"use client"

import * as React from "react"

import { AuthProvider } from "@/context/auth-context"
import { Toaster } from "@/components/ui/sonner"

export function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster richColors position="top-center" />
    </AuthProvider>
  )
}
