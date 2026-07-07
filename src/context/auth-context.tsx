"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import {
  authenticateCredentials,
  clearSession,
  GUEST_SESSION,
  loadSession,
  saveSession,
  sessionToNavUser,
  type AuthSession,
  type AuthUser,
} from "@/lib/auth-session"
import {
  canAdmin,
  canDelete,
  canEdit,
  canView,
} from "@/lib/employee-permissions"

type AuthContextValue = {
  session: AuthSession | null
  activeSession: AuthSession
  isAuthenticated: boolean
  user: AuthUser
  hydrated: boolean
  login: (email: string, password: string) => { ok: true } | { ok: false; error: string }
  logout: () => void
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  canAdmin: boolean
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [session, setSession] = React.useState<AuthSession | null>(null)
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    setSession(loadSession())
    setHydrated(true)
  }, [])

  const login = React.useCallback((email: string, password: string) => {
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      return { ok: false as const, error: "Email and password are required." }
    }

    const nextSession = authenticateCredentials(trimmedEmail, password)
    if (!nextSession) {
      return {
        ok: false as const,
        error: "Invalid email or password, or portal access is disabled.",
      }
    }

    saveSession(nextSession)
    setSession(nextSession)
    return { ok: true as const }
  }, [])

  const logout = React.useCallback(() => {
    clearSession()
    setSession(null)
    router.push("/home")
  }, [router])

  const activeSession = session ?? GUEST_SESSION
  const permissions = activeSession.permissions
  const isAuthenticated = session !== null

  const value = React.useMemo<AuthContextValue>(
    () => ({
      session,
      activeSession,
      isAuthenticated,
      user: sessionToNavUser(activeSession),
      hydrated,
      login,
      logout,
      canView: canView(permissions),
      canEdit: canEdit(permissions),
      canDelete: canDelete(permissions),
      canAdmin: canAdmin(permissions),
    }),
    [session, activeSession, isAuthenticated, hydrated, login, logout, permissions]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}
