"use client"

import { type Icon, IconChevronRight } from "@tabler/icons-react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import {
  NavPendingIndicator,
  SidebarNavLink,
} from "@/components/sidebar-nav-pending"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"

type NavGeneralItem = {
  name: string
  url: string
  icon: Icon
  items?: {
    title: string
    url: string
  }[]
}

function NavGeneralSubLinkItem({
  subItem,
  pathname,
}: {
  subItem: { title: string; url: string }
  pathname: string | null
}) {
  const isSubActive =
    pathname === subItem.url ||
    (subItem.url !== "/home" &&
      subItem.url !== "#" &&
      pathname?.startsWith(subItem.url))
  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild isActive={isSubActive}>
        <SidebarNavLink href={subItem.url}>
          <span className="min-w-0 truncate">{subItem.title}</span>
          <NavPendingIndicator href={subItem.url} />
        </SidebarNavLink>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  )
}

function NavGeneralLinkItem({
  item,
  isActive,
}: {
  item: NavGeneralItem
  isActive: boolean
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <SidebarNavLink href={item.url}>
          <item.icon className="size-[1.125rem] shrink-0" />
          <span className="min-w-0 truncate">{item.name}</span>
          <NavPendingIndicator href={item.url} />
        </SidebarNavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function NavGeneralCollapsibleItem({
  item,
  pathname,
}: {
  item: NavGeneralItem
  pathname: string | null
}) {
  const { state, isMobile, toggleSidebar } = useSidebar()
  const isActive =
    pathname === item.url ||
    (item.url !== "/home" && item.url !== "#" && pathname?.startsWith(item.url))
  const [open, setOpen] = useState(isActive)

  useEffect(() => {
    if (isActive) setOpen(true)
  }, [isActive])

  const handleOpenChange = (next: boolean) => {
    if (state === "collapsed" && !isMobile) {
      toggleSidebar()
      setOpen(true)
      return
    }
    setOpen(next)
  }

  return (
    <SidebarMenuItem>
      <Collapsible
        open={open}
        onOpenChange={handleOpenChange}
        className="group/collapsible-item w-full"
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={isActive} type="button">
            <item.icon />
            <span>{item.name}</span>
            <IconChevronRight className="ms-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible-item:rotate-90 rtl:rotate-180 group-data-[state=open]/collapsible-item:rtl:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items?.map((subItem) => (
              <NavGeneralSubLinkItem
                key={subItem.title}
                subItem={subItem}
                pathname={pathname}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  )
}

export function NavGeneral({
  items,
  title,
}: {
  items: NavGeneralItem[]
  title: string
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive =
            pathname === item.url ||
            (item.url !== "/home" &&
              item.url !== "#" &&
              pathname?.startsWith(item.url))

          if (item.items && item.items.length > 0) {
            return (
              <NavGeneralCollapsibleItem key={item.name} item={item} pathname={pathname} />
            )
          }

          return (
            <NavGeneralLinkItem key={item.name} item={item} isActive={isActive} />
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
