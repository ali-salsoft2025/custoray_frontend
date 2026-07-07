"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { cn } from "@/lib/utils"

type SidebarNavPendingContextValue = {
  pendingHref: string | null
  setPendingHref: (href: string | null) => void
}

const SidebarNavPendingContext =
  React.createContext<SidebarNavPendingContextValue | null>(null)

export function SidebarNavPendingProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [pendingHref, setPendingHref] = React.useState<string | null>(null)

  React.useEffect(() => {
    setPendingHref(null)
  }, [pathname])

  React.useEffect(() => {
    if (!pendingHref) return
    const timeout = window.setTimeout(() => setPendingHref(null), 10000)
    return () => window.clearTimeout(timeout)
  }, [pendingHref])

  const value = React.useMemo(
    () => ({ pendingHref, setPendingHref }),
    [pendingHref]
  )

  return (
    <SidebarNavPendingContext.Provider value={value}>
      {children}
    </SidebarNavPendingContext.Provider>
  )
}

function useSidebarNavPending() {
  const ctx = React.useContext(SidebarNavPendingContext)
  if (!ctx) {
    throw new Error(
      "useSidebarNavPending must be used within SidebarNavPendingProvider"
    )
  }
  return ctx
}

export function NavLoadingSpinner({ className }: { className?: string }) {
  return <LoadingSpinner size="xs" className={className} label="Loading page" />
}

export function useNavItemPending(href: string) {
  const { pendingHref } = useSidebarNavPending()
  return pendingHref === href
}

export function NavPendingIndicator({ href }: { href: string }) {
  const isPending = useNavItemPending(href)
  if (!isPending) return null

  return (
    <span className="text-primary ml-auto shrink-0" aria-label="Loading">
      <NavLoadingSpinner />
    </span>
  )
}

export function SidebarNavLink({
  href,
  className,
  children,
  onClick,
  ...props
}: React.ComponentProps<typeof Link>) {
  const pathname = usePathname()
  const { setPendingHref } = useSidebarNavPending()
  const targetHref = typeof href === "string" ? href : href.pathname ?? ""

  return (
    <Link
      href={href}
      className={cn("flex w-full min-w-0 items-center gap-2", className)}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented) return
        if (!targetHref || targetHref === "#") return
        if (targetHref === pathname) return
        setPendingHref(targetHref)
      }}
      {...props}
    >
      {children}
    </Link>
  )
}
