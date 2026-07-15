"use client";
import * as React from "react"
import Image from "next/image"
import {
  AlertCircle,
  Banknote,
  BarChart3,
  BookMarked,
  BookOpen,
  Box,
  Briefcase,
  Building2,
  Calendar,
  CalendarDays,
  CircleArrowDown,
  CircleArrowUp,
  ClipboardCheck,
  Clock,
  Coins,
  Database,
  FileBarChart,
  FileChartColumn,
  FileCheck,
  FilePlus,
  FileSpreadsheet,
  FileText,
  FileUp,
  Files,
  Folder,
  Folders,
  History,
  IdCard,
  LayoutDashboard,
  LayoutTemplate,
  LineChart,
  List,
  Monitor,
  NotebookPen,
  Package,
  Percent,
  PieChart,
  Receipt,
  ReceiptText,
  RotateCcw,
  Settings,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Store,
  Tag,
  User,
  UserCheck,
  UserCircle,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react"
import { NavMain } from "@/components/nav-main"
import {
  SidebarNavLink,
  SidebarNavPendingProvider,
} from "@/components/sidebar-nav-pending"
import { Sidebar, SidebarContent, SidebarHeader, useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

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
        { title: "Leave", url: "/employees/leaves", icon: CalendarDays },
        { title: "Departments", url: "/employees/departments", icon: Building2 },
      ],
    },
    {
      title: "Zakat",
      url: "#",
      icon: Coins,
    },
    {
      title: "Reports",
      url: "#",
      icon: FileBarChart,
      items: [
        { title: "Sales Reports", url: "#", icon: LineChart },
        { title: "Purchase Reports", url: "#", icon: BarChart3 },
        { title: "Inventory Reports", url: "#", icon: FileChartColumn },
        { title: "Financial Reports", url: "#", icon: PieChart },
        { title: "Tax Reports", url: "#", icon: ReceiptText },
        { title: "Employee Reports", url: "#", icon: UserCircle },
        { title: "Payment Reports", url: "#", icon: Banknote },
        { title: "POS Reports", url: "#", icon: ShoppingCart },
        { title: "Ledger Reports", url: "#", icon: BookOpen },
        { title: "Custom Reports", url: "#", icon: FileSpreadsheet },
      ],
    },
    {
      title: "Ledger",
      url: "#",
      icon: BookOpen,
      items: [
        { title: "Ledger", url: "#", icon: BookOpen },
        { title: "General Ledger", url: "#", icon: BookMarked },
        { title: "Account Ledger", url: "#", icon: List },
        { title: "Ledger Reports", url: "#", icon: FileBarChart },
        { title: "Journal", url: "#", icon: NotebookPen },
        { title: "Journal Entries", url: "#", icon: FilePlus },
        { title: "Journal Vouchers", url: "#", icon: Receipt },
        { title: "Journal Reports", url: "#", icon: FileText },
        { title: "Accounts", url: "#", icon: Database },
        { title: "Chart of Accounts", url: "#", icon: PieChart },
        { title: "Account Groups", url: "#", icon: Folder },
        { title: "Account Settings", url: "#", icon: Settings2 },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ],
}

function SidebarBrand() {
  const { state } = useSidebar()
  const collapsed = state === "collapsed"

  return (
    <SidebarHeader className={cn(collapsed && "items-center")}>
      <SidebarNavLink
        href="/home"
        aria-label="Custoray home"
        className={cn(
          "hover:bg-sidebar-accent/60 flex items-center rounded-lg px-2 py-1.5 transition-colors",
          collapsed && "mx-auto size-8 justify-center p-0"
        )}
      >
        <SidebarLogo collapsed={collapsed} />
      </SidebarNavLink>
    </SidebarHeader>
  )
}

function SidebarLogo({ collapsed }: { collapsed: boolean }) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === "dark"
  const logoSrc = collapsed
    ? "/assets/logo-6.png"
    : isDark
      ? "/assets/logo-3.png"
      : "/assets/logo-2.png"

  return (
    <Image
      src={logoSrc}
      alt="Custoray"
      width={320}
      height={96}
      className={cn(
        "object-contain",
        collapsed ? "size-8" : "h-10 w-auto max-w-full"
      )}
      sizes={collapsed ? "32px" : "(max-width: 768px) 100vw, 280px"}
      priority
    />
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
      </Sidebar>
    </SidebarNavPendingProvider>
  )
}
