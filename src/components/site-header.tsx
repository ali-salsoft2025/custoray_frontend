"use client"

import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ToggleButton } from "@/components/ui/toggle-button"
import { TermSwitcher } from "@/components/term-switcher"

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
  return "Documents"
}

export function SiteHeader() {
  const pathname = usePathname()
  const headerTitle = titleForPath(pathname)

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="min-w-0 flex-1 truncate text-base font-medium">{headerTitle}</h1>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <TermSwitcher />
          <ToggleButton layout="toolbar" />
        </div>
      </div>
    </header>
  )
}
