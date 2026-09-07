"use client"

import * as React from "react"

import { AuthProvider } from "@/context/auth-context"
import { AppearanceProvider } from "@/components/theme/appearance-provider"
import { I18nProvider } from "@/components/i18n/i18n-provider"
import { ConfirmDialogHost } from "@/components/confirm-dialog"
import { Toaster } from "@/components/ui/sonner"

export function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppearanceProvider>
      <I18nProvider>
        <AuthProvider>
          {children}
          <ConfirmDialogHost />
          <Toaster />
        </AuthProvider>
      </I18nProvider>
    </AppearanceProvider>
  )
}
