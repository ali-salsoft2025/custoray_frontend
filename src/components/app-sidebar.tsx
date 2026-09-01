"use client";
import * as React from "react"
import {
  Banknote,
  BarChart3,
  Box,
  Building2,
  Calendar,
  CalendarDays,
  CircleArrowDown,
  CircleArrowUp,
  Coins,
  FileBarChart,
  FileChartColumn,
  FileCheck,
  FileText,
  Folders,
  History,
  LayoutDashboard,
  LayoutTemplate,
  LineChart,
  Package,
  QrCode,
  Receipt,
  RotateCcw,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  Tag,
  UserCircle,
  Users,
  Wallet,
} from "lucide-react"
import { NavMain } from "@/components/nav-main"
import { SidebarNavPendingProvider } from "@/components/sidebar-nav-pending"
import { CompanySwitcher } from "@/components/company-switcher"
import { PlanStatusCard } from "@/components/saas/plan-status-card"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/home",
      icon: LayoutDashboard,
    },
    {
      title: "Inventory",
      url: "/inventory",
      icon: Package,
      items: [
        { title: "Products", url: "/inventory/products", icon: Package },
        { title: "Brands", url: "/inventory/brands", icon: Tag },
        { title: "Variants", url: "/inventory/variants", icon: Box },
        { title: "Categories", url: "/inventory/categories", icon: Folders },
      ],
    },
    {
      title: "Customers",
      url: "/customers",
      icon: Users,
    },
    {
      title: "Vendors",
      url: "/vendors",
      icon: Store,
    },
    {
      title: "Sales",
      url: "/sales",
      icon: BarChart3,
    },
    {
      title: "Purchase",
      url: "/purchases",
      icon: Wallet,
    },
    {
      title: "Returns",
      url: "/returns",
      icon: RotateCcw,
    },
    {
      title: "Payments",
      url: "/payments/customer",
      icon: Banknote,
      items: [
        { title: "Customer Payments", url: "/payments/customer", icon: CircleArrowUp },
        { title: "Vendor Payments", url: "/payments/vendor", icon: CircleArrowDown },
      ],
    },
    {
      title: "Documents",
      url: "/documents/sales-invoice",
      icon: FileText,
      items: [
        { title: "Sales Invoice", url: "/documents/sales-invoice", icon: Receipt },
        { title: "Purchase Invoice", url: "/documents/purchase-invoice", icon: FileCheck },
        { title: "Invoice Templates", url: "/documents/invoice-templates", icon: LayoutTemplate },
      ],
    },
    {
      title: "POS",
      url: "/pos",
      icon: ShoppingCart,
      items: [
        { title: "Register", url: "/pos", icon: ShoppingCart },
        { title: "Sales History", url: "/pos/sales", icon: History },
        { title: "Returns History", url: "/pos/returns", icon: RotateCcw },
        { title: "Reports", url: "/pos/reports", icon: FileBarChart },
        { title: "Settings", url: "/pos/settings", icon: Settings },
      ],
    },
    {
      title: "Employees",
      url: "/employees",
      icon: UserCircle,
      items: [
        { title: "Team", url: "/employees", icon: Users },
        { title: "Permissions", url: "/employees/permissions", icon: ShieldCheck },
        { title: "Payroll", url: "/employees/payroll", icon: Wallet },
        { title: "Attendance", url: "/employees/attendance", icon: Calendar },
        { title: "Leave", url: "/employees/leaves", icon: CalendarDays },
        { title: "Departments", url: "/employees/departments", icon: Building2 },
      ],
    },
    {
      title: "Zakat",
      url: "/zakat",
      icon: Coins,
      items: [
        { title: "Overview", url: "/zakat", icon: BarChart3 },
        { title: "Assets", url: "/zakat/assets", icon: Box },
        { title: "Liabilities", url: "/zakat/liabilities", icon: Wallet },
        { title: "History", url: "/zakat/history", icon: History },
        { title: "Settings", url: "/zakat/settings", icon: Settings },
      ],
    },
    {
      title: "Reports",
      url: "#",
      icon: FileBarChart,
      items: [
        { title: "Sales Reports", url: "/reports/sales", icon: LineChart },
        { title: "Purchase Reports", url: "/reports/purchases", icon: BarChart3 },
        { title: "Inventory Reports", url: "/reports/inventory", icon: FileChartColumn },
        { title: "Payment Reports", url: "/reports/payments", icon: Banknote },
      ],
    },
    {
      title: "QR Storefront",
      url: "/qr-storefront",
      icon: QrCode,
    },
  ],
}

function SidebarBrand() {
  const { state } = useSidebar()
  const collapsed = state === "collapsed"

  return (
    <SidebarHeader
      className={cn(collapsed && "items-center px-1.5 pt-4 pb-2")}
    >
      <CompanySwitcher />
    </SidebarHeader>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { canAdmin } = useAuth()
  const navItems = React.useMemo(
    () =>
      data.navMain.filter(
        (item) => item.title !== "Employees" || canAdmin
      ),
    [canAdmin]
  )
  // Check if RTL is enabled
  const [isRtl, setIsRtl] = React.useState(false)
  
  React.useEffect(() => {
    const checkRtl = () => {
      setIsRtl(document.documentElement.getAttribute('dir') === 'rtl')
    }
    
    checkRtl()
    // Watch for changes to dir attribute
    const observer = new MutationObserver(checkRtl)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['dir']
    })
    
    return () => observer.disconnect()
  }, [])
  
  return (
    <SidebarNavPendingProvider>
      <Sidebar collapsible="icon" side={isRtl ? "right" : "left"} {...props}>
        <SidebarBrand />
        <SidebarContent className="hide-scrollbar overflow-y-auto h-full">
          <NavMain items={navItems} />
        </SidebarContent>
        <SidebarFooter>
          <PlanStatusCard />
        </SidebarFooter>
      </Sidebar>
    </SidebarNavPendingProvider>
  )
}
