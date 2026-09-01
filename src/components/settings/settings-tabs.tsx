"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const TABS = [
  { href: "/settings", label: "Company" },
  { href: "/settings/account", label: "Account" },
  { href: "/settings/team", label: "Team" },
  { href: "/settings/preferences", label: "Preferences" },
  { href: "/settings/billing", label: "Billing" },
] as const

function isActive(pathname: string, href: string) {
  if (href === "/settings") return pathname === "/settings"
  if (href === "/settings/preferences") {
    return (
      pathname === href ||
      pathname.startsWith("/settings/preferences/") ||
      pathname.startsWith("/settings/appearance") ||
      pathname.startsWith("/settings/notifications")
    )
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function SettingsTabs() {
  const pathname = usePathname() ?? ""

  return (
    <nav className="border-border w-full overflow-x-auto border-b">
      <div className="-mb-px flex min-w-max gap-x-1">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative z-10 shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground border-transparent"
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
