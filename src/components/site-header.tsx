"use client"

import { usePathname } from "next/navigation"
import { useTranslation } from "react-i18next"

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

function titleKeyForPath(pathname: string | null): string {
  if (!pathname) return "header.documents"
  if (pathname === "/home") return "header.dashboard"
  if (pathname === "/customers") return "header.customers"
  if (pathname.startsWith("/customers/")) {
    if (pathname.endsWith("/new")) return "header.addCustomer"
    if (pathname.endsWith("/edit")) return "header.editCustomer"
    if (pathname.endsWith("/timeline")) return "header.customerTimeline"
    return "header.customerDetails"
  }
  if (pathname === "/vendors") return "header.vendors"
  if (pathname === "/invoices") return "header.salesInvoice"
  if (pathname === "/documents/sales-invoice") return "header.salesInvoice"
  if (pathname === "/documents/purchase-invoice") return "header.purchaseInvoice"
  if (pathname === "/documents/invoice-templates") return "header.invoiceTemplates"
  if (pathname.startsWith("/documents/invoice-templates/preview/")) return "header.templatePreview"
  if (pathname.startsWith("/documents")) return "header.documents"
  if (pathname === "/purchases") return "header.purchases"
  if (pathname === "/sales") return "header.salesReport"
  if (pathname === "/reports/sales") return "header.salesReports"
  if (pathname === "/reports/purchases") return "header.purchaseReports"
  if (pathname === "/reports/inventory") return "header.inventoryReports"
  if (pathname === "/reports/payments") return "header.paymentReports"
  if (pathname === "/returns") return "header.returns"
  if (pathname === "/payments") return "header.payments"
  if (pathname === "/payments/customer") return "header.customerPayments"
  if (pathname === "/payments/vendor") return "header.vendorPayments"
  if (pathname === "/pos") return "header.posRegister"
  if (pathname === "/pos/new-sale") return "header.posRegister"
  if (pathname === "/pos/sales") return "header.salesHistory"
  if (pathname === "/pos/reports") return "header.posReports"
  if (pathname === "/pos/settings") return "header.posSettings"
  if (pathname.startsWith("/pos")) return "header.pos"
  if (pathname === "/qr-storefront" || pathname.startsWith("/qr-storefront/")) {
    return "header.qrStorefront"
  }
  if (pathname === "/inventory") return "header.inventory"
  if (pathname.startsWith("/inventory/")) {
    if (pathname.includes("year-closing")) return "header.yearClosing"
    if (pathname.includes("/terms/")) return "header.termDetails"
    if (pathname.includes("/products")) return "header.products"
    if (pathname.includes("/brands") || pathname.includes("/brand")) return "header.brands"
    if (pathname.includes("/categories")) return "header.categories"
    if (pathname.includes("/variants")) return "header.variants"
    return "header.inventory"
  }
  if (pathname === "/plans" || pathname.startsWith("/settings")) return "header.settings"
  if (pathname === "/employees") return "header.employees"
  if (pathname === "/employees/new") return "header.addEmployee"
  if (pathname === "/employees/permissions") return "header.permissions"
  if (pathname === "/employees/payroll") return "header.payroll"
  if (pathname === "/employees/attendance") return "header.attendance"
  if (pathname === "/employees/leaves") return "header.leaveManagement"
  if (pathname === "/employees/departments") return "header.departments"
  if (pathname.startsWith("/employees/") && pathname.endsWith("/edit")) return "header.editEmployee"
  if (pathname.startsWith("/employees/")) return "header.employeeProfile"
  if (pathname === "/zakat") return "header.zakatOverview"
  if (pathname === "/zakat/assets") return "header.zakatAssets"
  if (pathname === "/zakat/liabilities") return "header.zakatLiabilities"
  if (pathname === "/zakat/history") return "header.zakatHistory"
  if (pathname === "/zakat/settings") return "header.zakatSettings"
  if (pathname === "/zakat/calculator") return "header.zakatOverview"
  if (pathname.startsWith("/zakat")) return "header.zakat"
  if (pathname === "/tax") return "header.taxHelper"
  if (pathname === "/tax/profit-loss") return "header.profitLoss"
  if (pathname === "/tax/balance-sheet") return "header.balanceSheet"
  if (pathname === "/tax/year-summary") return "header.yearSummary"
  if (pathname === "/tax/settings") return "header.taxSettings"
  if (pathname.startsWith("/tax")) return "header.taxHelper"
  return "header.documents"
}

export function SiteHeader() {
  const pathname = usePathname()
  const { t } = useTranslation("nav")
  const headerTitle = t(titleKeyForPath(pathname))

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
