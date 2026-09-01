"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Bell,
  ChevronDown,
  CreditCard,
  Settings2,
  UserCircle,
  Users,
  type LucideIcon,
} from "lucide-react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

const GENERAL_HREFS = ["/settings", "/settings/appearance", "/settings/language"]

const GENERAL_ITEMS = [
  { href: "/settings", label: "Company" },
  { href: "/settings/appearance", label: "Appearance" },
  { href: "/settings/language", label: "Language & region" },
] as const

const TOP_ITEMS = [
  { href: "/settings/account", label: "Account", icon: UserCircle },
  { href: "/settings/team", label: "Team", icon: Users },
  { href: "/settings/billing", label: "Plans & billing", icon: CreditCard },
  { href: "/settings/notifications", label: "Notifications", icon: Bell },
] as const

function isActive(pathname: string, href: string) {
  if (href === "/settings") return pathname === "/settings"
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  nested,
}: {
  href: string
  label: string
  icon?: LucideIcon
  active: boolean
  nested?: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg text-sm transition-colors cursor-pointer",
        nested ? "px-2 py-1.5" : "px-2.5 py-2",
        active
          ? "text-foreground font-semibold"
          : "text-muted-foreground hover:text-foreground font-medium"
      )}
    >
      {Icon ? <Icon className="size-4 shrink-0" /> : null}
      {label}
    </Link>
  )
}

export function SettingsNav() {
  const pathname = usePathname() ?? ""
  const generalActive = GENERAL_HREFS.some((href) => isActive(pathname, href))
  const [generalOpen, setGeneralOpen] = useState(generalActive)

  useEffect(() => {
    if (generalActive) setGeneralOpen(true)
  }, [generalActive])

  return (
    <nav className="flex flex-col gap-0.5">
      <Collapsible open={generalOpen} onOpenChange={setGeneralOpen}>
        <CollapsibleTrigger
          className={cn(
            "hover:text-foreground text-muted-foreground flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium"
          )}
        >
          <Settings2 className="size-4 shrink-0" />
          <span className="flex-1 text-left">General</span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 transition-transform",
              generalOpen ? "rotate-0" : "-rotate-90"
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-0.5 ml-4 flex flex-col border-l pl-3">
          {GENERAL_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              active={isActive(pathname, item.href)}
              nested
            />
          ))}
        </CollapsibleContent>
      </Collapsible>

      {TOP_ITEMS.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          active={isActive(pathname, item.href)}
        />
      ))}
    </nav>
  )
}
