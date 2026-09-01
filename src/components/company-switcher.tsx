"use client"

import * as React from "react"
import { Building2, ChevronsUpDown, Plus } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function CompanySwitcher() {
  const { isMobile, state } = useSidebar()
  const collapsed = state === "collapsed" && !isMobile
  const { companies, activeCompany, switchCompany, createCompany } = useAuth()
  const [createOpen, setCreateOpen] = React.useState(false)
  const [businessName, setBusinessName] = React.useState("")
  const [pending, setPending] = React.useState(false)

  if (!activeCompany) {
    return null
  }

  const handleSwitch = async (tenantId: string) => {
    if (tenantId === activeCompany.id) return
    try {
      setPending(true)
      await switchCompany(tenantId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not switch company")
      setPending(false)
    }
  }

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    const name = businessName.trim()
    if (!name) return

    try {
      setPending(true)
      await createCompany(name)
      setCreateOpen(false)
      setBusinessName("")
      toast.success("Company created")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create company")
    } finally {
      setPending(false)
    }
  }

  const logoUrl = activeCompany.logoUrl?.trim() || "/assets/logo-2.png"

  return (
    <>
      <SidebarMenu className={cn(collapsed && "items-center")}>
        <SidebarMenuItem className={cn(collapsed && "flex justify-center")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className={cn(
                  "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                  collapsed && "mx-auto justify-center"
                )}
                disabled={pending}
              >
                <span className="bg-sidebar-primary/10 flex aspect-square size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                  <img
                    src={logoUrl}
                    alt=""
                    className="size-full object-contain p-0.5"
                  />
                </span>
                <div
                  className={cn(
                    "grid flex-1 text-left text-sm leading-tight",
                    collapsed && "hidden"
                  )}
                >
                  <span className="truncate font-medium">{activeCompany.name}</span>
                  <span className="truncate text-xs">{activeCompany.plan}</span>
                </div>
                <ChevronsUpDown className={cn("ml-auto", collapsed && "hidden")} />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Companies
              </DropdownMenuLabel>
              {companies.map((company, index) => (
                <DropdownMenuItem
                  key={company.id}
                  onClick={() => void handleSwitch(company.id)}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <Building2 className="size-3.5 shrink-0" />
                  </div>
                  {company.name}
                  {index < 9 ? (
                    <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                  ) : null}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 p-2"
                onSelect={() => {
                  setBusinessName("")
                  setCreateOpen(true)
                }}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">Add company</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Add company</DialogTitle>
              <DialogDescription>
                Create another company under this account. You can switch between them anytime.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="new-company-name">Company name</Label>
              <Input
                id="new-company-name"
                className="mt-2"
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                placeholder="Acme Trading"
                autoFocus
                required
                minLength={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending || businessName.trim().length < 2}>
                {pending ? "Creating…" : "Create company"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
