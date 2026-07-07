"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  IconBuilding,
  IconCalendarEvent,
  IconShieldLock,
  IconUserPlus,
  IconUsers,
  IconWallet,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"

const navItems = [
  { href: "/employees", label: "Team", icon: IconUsers, exact: true },
  { href: "/employees/new", label: "Add employee", icon: IconUserPlus },
  { href: "/employees/permissions", label: "Permissions", icon: IconShieldLock },
  { href: "/employees/payroll", label: "Payroll", icon: IconWallet },
  { href: "/employees/leaves", label: "Leave", icon: IconCalendarEvent },
  { href: "/employees/departments", label: "Departments", icon: IconBuilding },
]

function isActive(pathname: string, href: string, exact?: boolean) {
  if (href === "/employees" && exact) {
    return pathname === "/employees"
  }
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function EmployeesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-5 py-5 ring-1 ring-primary/10">
        <p className="text-primary text-xs font-semibold uppercase tracking-wide">
          Human resources
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">Employees</h2>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
          Manage your team, portal access, salaries, leave requests, and departments.
        </p>
      </div>

      <nav
        className="flex flex-wrap gap-2 border-b border-border/60 pb-3"
        aria-label="Employee sections"
      >
        {navItems.map((item) => {
          const active = isActive(pathname, item.href, item.exact)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <Icon className="size-4" stroke={1.75} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {children}
    </div>
  )
}
