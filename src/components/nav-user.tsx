"use client"

import { useRouter } from "next/navigation"
import type { TFunction } from "i18next"
import {
  CreditCard,
  Languages,
  LogIn,
  LogOut,
  Palette,
  Settings,
  UserCircle,
} from "lucide-react"
import { useTranslation } from "react-i18next"

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

function translateRole(role: string, t: TFunction<"nav">) {
  const normalized = role.trim().toLowerCase()
  if (normalized === "owner") return t("userMenu.owner")
  if (normalized === "admin") return t("userMenu.admin")
  if (normalized === "member") return t("userMenu.member")
  return role.trim()
}

export function NavUser({ className }: { className?: string }) {
  const router = useRouter()
  const { user, logout, isAuthenticated, activeCompany } = useAuth()
  const { t } = useTranslation("nav")

  const accessLabel = isAuthenticated
    ? user.isAdmin
      ? t("userMenu.admin")
      : permissionSummary(user.permissions)
    : t("userMenu.demoMode")

  const designation =
    translateRole(activeCompany?.role || user.designation || "", t) ||
    accessLabel

  const go = (href: string) => {
    router.push(href)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          dir="ltr"
          aria-label={t("userMenu.accountMenu")}
          className={cn(
            "flex max-w-[16rem] shrink-0 flex-row items-center gap-2 rounded-none border-0 bg-transparent p-0 text-start shadow-none hover:bg-transparent focus-visible:ring-0 sm:max-w-[20rem]",
            className
          )}
        >
          <Avatar className="size-9 shrink-0 rounded-full bg-white shadow-[0_1px_4px_0_rgba(0,0,0,0.16)] dark:bg-zinc-950">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-transparent text-xs font-semibold">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <span className="grid min-w-0 flex-1 leading-tight">
            <span className="text-foreground truncate text-sm font-medium">
              {user.name}
            </span>
            <span className="text-muted-foreground truncate text-[11px]">
              {designation}
            </span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-56 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-xs font-semibold">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-start text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="text-muted-foreground truncate text-xs">
                {designation}
              </span>
              {isAuthenticated ? (
                <span className="text-muted-foreground truncate text-[11px]">
                  {user.email}
                </span>
              ) : null}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer" onSelect={() => go("/settings/account")}>
            <UserCircle />
            {t("userMenu.account")}
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onSelect={() => go("/settings/billing")}>
            <CreditCard />
            {t("userMenu.plansBilling")}
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onSelect={() => go("/settings/appearance")}>
            <Palette />
            {t("userMenu.appearance")}
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onSelect={() => go("/settings/language")}>
            <Languages />
            {t("userMenu.language")}
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onSelect={() => go("/settings")}>
            <Settings />
            {t("userMenu.settings")}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {isAuthenticated ? (
          <DropdownMenuItem className="cursor-pointer" onSelect={() => void logout()}>
            <LogOut />
            {t("userMenu.logOut")}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem className="cursor-pointer" onSelect={() => go("/")}>
            <LogIn />
            {t("userMenu.signIn")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
