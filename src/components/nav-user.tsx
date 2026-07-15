"use client"

import Link from "next/link"
import {
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogIn,
  LogOut,
  Settings,
  UserCircle,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/context/auth-context"
import { permissionSummary } from "@/lib/employee-permissions"
import { cn } from "@/lib/utils"

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export function NavUser({ className }: { className?: string }) {
  const { user, logout, isAuthenticated } = useAuth()

  const accessLabel = isAuthenticated
    ? user.isAdmin
      ? "Admin"
      : permissionSummary(user.permissions)
    : "Demo mode"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex min-w-0 items-center gap-2.5 rounded-2xl ps-1 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 sm:ps-2",
            className
          )}
        >
          <Avatar className="size-9 shrink-0 rounded-full shadow-[0_1px_4px_0_rgba(0,0,0,0.16)]">
            <AvatarImage src={user.avatar} alt={user.name} className="rounded-full" />
            <AvatarFallback className="rounded-full text-xs font-semibold">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden min-w-0 max-w-[10rem] flex-col sm:flex lg:max-w-[14rem]">
            <span className="truncate text-sm font-semibold leading-tight">
              {user.name}
            </span>
            <span className="text-muted-foreground truncate text-xs leading-tight">
              {accessLabel}
            </span>
          </div>
          <ChevronsUpDown
            className="text-muted-foreground hidden size-4 shrink-0 sm:block"
            strokeWidth={2}
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-56 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-full shadow-[0_1px_4px_0_rgba(0,0,0,0.16)]">
              <AvatarImage src={user.avatar} alt={user.name} className="rounded-full" />
              <AvatarFallback className="rounded-full">{initials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="text-muted-foreground truncate text-xs">
                {user.email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <UserCircle className="size-4" strokeWidth={2} aria-hidden />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard className="size-4" strokeWidth={2} aria-hidden />
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell className="size-4" strokeWidth={2} aria-hidden />
            Notifications
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings className="size-4" strokeWidth={2} aria-hidden />
              Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {isAuthenticated ? (
          <DropdownMenuItem onClick={logout}>
            <LogOut className="size-4" strokeWidth={2} aria-hidden />
            Log out
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link href="/">
              <LogIn className="size-4" strokeWidth={2} aria-hidden />
              Sign in
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
