"use client"

import { usePathname } from "next/navigation"

import { NavUser } from "@/components/nav-user"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ToggleButton } from "@/components/ui/toggle-button"
import { TermSwitcher } from "@/components/term-switcher"
import { cn } from "@/lib/utils"

const headerControlShadow = "shadow-[0_1px_4px_0_rgba(0,0,0,0.16)]"

const headerIconCircleBtn = cn(
  "size-9 shrink-0 rounded-full border-0 bg-white text-muted-foreground hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/35 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-primary/15 dark:hover:text-primary",
  headerControlShadow
)

const sidebarTriggerClass =
  "size-9 shrink-0 rounded-2xl border-0 bg-transparent shadow-none text-muted-foreground hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/35 dark:text-zinc-400 dark:hover:bg-primary/15 dark:hover:text-primary"

function titleForPath(pathname: string | null): string {
  if (!pathname) return "Documents"
  if (pathname === "/home") return "Dashboard"
  if (pathname === "/customers") return "Customers"
  if (pathname.startsWith("/customers/")) {
    if (pathname.endsWith("/new")) return "Add customer"
    if (pathname.endsWith("/edit")) return "Edit customer"
    return "Customer details"
  }
  if (pathname === "/vendors") return "Vendors"
  if (pathname === "/invoices") return "Sales invoice"
  if (pathname === "/documents/sales-invoice") return "Sales invoice"
  if (pathname === "/documents/purchase-invoice") return "Purchase invoice"
  if (pathname === "/documents/invoice-templates") return "Invoice templates"
  if (pathname.startsWith("/documents/invoice-templates/preview/")) return "Template preview"
  if (pathname.startsWith("/documents")) return "Documents"
  if (pathname === "/purchases") return "Purchases"
  if (pathname === "/sales") return "Sales report"
  if (pathname === "/returns") return "Returns"
  if (pathname === "/payments") return "Payments"
  if (pathname === "/payments/customer") return "Customer payments"
  if (pathname === "/payments/vendor") return "Vendor payments"
  if (pathname === "/pos") return "POS register"
  if (pathname === "/pos/new-sale") return "POS register"
  if (pathname === "/pos/sales") return "Sales history"
  if (pathname === "/pos/reports") return "POS reports"
  if (pathname === "/pos/settings") return "POS settings"
  if (pathname.startsWith("/pos")) return "POS"
  if (pathname === "/inventory") return "Inventory"
  if (pathname.startsWith("/inventory/")) {
    if (pathname.includes("year-closing")) return "Year closing"
    if (pathname.includes("/terms/")) return "Term details"
    if (pathname.includes("/products")) return "Products"
    if (pathname.includes("/brands") || pathname.includes("/brand")) return "Brands"
    if (pathname.includes("/categories")) return "Categories"
    if (pathname.includes("/variants")) return "Variants"
    return "Inventory"
  }
  if (pathname === "/settings") return "Settings"
  if (pathname === "/employees") return "Employees"
  if (pathname === "/employees/new") return "Add employee"
  if (pathname === "/employees/permissions") return "Permissions"
  if (pathname === "/employees/payroll") return "Payroll"
  if (pathname === "/employees/leaves") return "Leave management"
  if (pathname === "/employees/departments") return "Departments"
  if (pathname.startsWith("/employees/") && pathname.endsWith("/edit")) return "Edit employee"
  if (pathname.startsWith("/employees/")) return "Employee profile"
  if (pathname === "/tax") return "Tax Helper"
  if (pathname === "/tax/profit-loss") return "Profit & loss"
  if (pathname === "/tax/balance-sheet") return "Balance sheet"
  if (pathname === "/tax/year-summary") return "Year summary"
  if (pathname === "/tax/settings") return "Tax settings"
  if (pathname.startsWith("/tax")) return "Tax Helper"
  return "Documents"
}

export function SiteHeader() {
  const pathname = usePathname()
  const headerTitle = titleForPath(pathname)

  return (
    <header className="flex h-(--header-height) shrink-0 items-stretch border-b border-zinc-200/70 h-auto rounded-t-2xl transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) dark:border-zinc-800/80">
      <div className="flex w-full min-w-0 flex-1 items-center gap-3 px-4 py-3 lg:gap-4 lg:px-6">
        <SidebarTrigger className={cn(sidebarTriggerClass, "-ms-0.5")} />
        <Separator
          orientation="vertical"
          className="mx-0.5 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-foreground/70 min-w-0 flex-1 truncate text-base font-medium tracking-tight">
          {headerTitle}
        </h1>
        <div className="ms-auto flex shrink-0 items-center gap-2">
          <TermSwitcher triggerClassName={headerIconCircleBtn} />
          <ToggleButton layout="toolbar" variant="ghost" className={headerIconCircleBtn} />
          <NavUser />
        </div>
      </div>
    </header>
  )
}
