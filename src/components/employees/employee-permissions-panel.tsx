"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  IconArrowLeft,
  IconCheck,
  IconCopy,
  IconExternalLink,
  IconSearch,
  IconShieldCheck,
  IconX,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import { CustomerAvatar } from "@/components/customers/customer-avatar"
import { EmployeePermissionsMatrix } from "@/components/employees/employee-permissions-matrix"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEmployees } from "@/context/employees-context"
import {
  countGrantedModules,
  normalizePermissions,
  permissionPreset,
  permissionSummary,
  PERMISSION_PRESET_IDS,
  permissionPresetLabel,
  permissionsEqual,
  type EmployeePermissions,
  type PermissionPresetId,
} from "@/lib/employee-permissions"
import { type EmployeeRow } from "@/lib/employees"
import { cn } from "@/lib/utils"

function EmployeeListRow({
  employee,
  selected,
  onSelect,
}: {
  employee: EmployeeRow
  selected: boolean
  onSelect: () => void
}) {
  const { t } = useTranslation("employees")
  const { t: tn } = useTranslation("nav")
  const summary = permissionSummary(employee.permissions)
  const modules = countGrantedModules(employee.permissions)
  const preview =
    summary === tn("userMenu.admin")
      ? t("permissionsPage.fullAdminAccess")
      : summary === tn("userMenu.noAccess")
        ? t("permissionsPage.noModulesAssigned")
        : t("permissionsPage.modulesSummary", { count: modules, summary })

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
        selected
          ? "before:bg-primary before:absolute before:inset-y-0 before:left-0 before:w-0.5"
          : "hover:bg-muted/50"
      )}
    >
      <CustomerAvatar name={employee.name} size="sm" />
      <div className="min-w-0 flex-1 border-b border-border/40 pb-3">
        <p
          className={cn(
            "truncate text-sm font-medium leading-tight",
            selected && "text-primary"
          )}
        >
          {employee.name}
        </p>
        <p className="text-muted-foreground mt-0.5 truncate text-xs leading-snug">
          {preview}
        </p>
      </div>
    </button>
  )
}

export function EmployeePermissionsPanel() {
  const { t } = useTranslation("employees")
  const { t: tc } = useTranslation("common")
  const searchParams = useSearchParams()
  const highlightId = Number(searchParams.get("employee"))
  const { employees, updateEmployee } = useEmployees()

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [draft, setDraft] = useState<EmployeePermissions | null>(null)
  const [copyFromId, setCopyFromId] = useState<string>("")
  const [mobileShowChat, setMobileShowChat] = useState(false)

  useEffect(() => {
    if (employees.length === 0) {
      setSelectedId(null)
      return
    }
    if (
      Number.isFinite(highlightId) &&
      employees.some((e) => e.id === highlightId)
    ) {
      setSelectedId(highlightId)
      setMobileShowChat(true)
      return
    }
    setSelectedId((prev) =>
      prev != null && employees.some((e) => e.id === prev)
        ? prev
        : employees[0].id
    )
  }, [employees, highlightId])

  const selected = useMemo(
    () => employees.find((e) => e.id === selectedId) ?? null,
    [employees, selectedId]
  )

  const savedPermissions = useMemo(
    () => (selected ? normalizePermissions(selected.permissions) : null),
    [selected]
  )

  useEffect(() => {
    if (!savedPermissions) {
      setDraft(null)
      return
    }
    setDraft(savedPermissions)
    setCopyFromId("")
  }, [selected?.id, savedPermissions])

  const isDirty =
    draft != null &&
    savedPermissions != null &&
    !permissionsEqual(draft, savedPermissions)

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return employees
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(query) ||
        e.email.toLowerCase().includes(query) ||
        e.department.toLowerCase().includes(query) ||
        e.designation.toLowerCase().includes(query)
    )
  }, [employees, search])

  const selectEmployee = (id: number) => {
    if (id !== selectedId && isDirty) {
      toast.message(t("permissionsPage.toastSwitchDirty"))
      return
    }
    setSelectedId(id)
    setMobileShowChat(true)
  }

  const savePermissions = () => {
    if (!selected || !draft) return
    updateEmployee(selected.id, {
      permissions: normalizePermissions(draft),
    })
    toast.success(t("permissionsPage.toastUpdated", { name: selected.name }))
  }

  const discardChanges = () => {
    if (!savedPermissions) return
    setDraft(savedPermissions)
    toast.message(t("permissionsPage.toastDiscarded"))
  }

  const applyPreset = (presetId: PermissionPresetId) => {
    setDraft(permissionPreset(presetId))
    toast.message(
      t("permissionsPage.toastAppliedPreset", {
        preset: permissionPresetLabel(presetId),
      })
    )
  }

  const copyFromEmployee = (employeeId: string) => {
    const source = employees.find((e) => e.id === Number(employeeId))
    if (!source) return
    setDraft(normalizePermissions(source.permissions))
    setCopyFromId(employeeId)
    toast.message(t("permissionsPage.toastCopied", { name: source.name }))
  }

  if (employees.length === 0) {
    return (
      <div className="bg-card flex flex-col items-center justify-center gap-3 rounded-xl border py-20 text-center">
        <IconShieldCheck className="text-muted-foreground size-10" />
        <div className="space-y-1">
          <p className="font-medium">{t("permissionsPage.noEmployeesYet")}</p>
          <p className="text-muted-foreground text-sm">
            {t("permissionsPage.noEmployeesHint")}
          </p>
        </div>
        <Button type="button" size="sm" asChild>
          <Link href="/employees">{t("permissionsPage.goToTeam")}</Link>
        </Button>
      </div>
    )
  }

  if (!selected || !draft) return null

  const copyCandidates = employees.filter((e) => e.id !== selected.id)
  const roleLine =
    [selected.designation, selected.department].filter(Boolean).join(" · ") ||
    t("permissionsPage.teamMember")

  return (
    <div className="bg-card text-card-foreground -mx-4 -my-4 flex h-[calc(100dvh-var(--header-height)-1.5rem)] min-h-[28rem] w-[calc(100%+2rem)] overflow-hidden md:-mx-6 md:-my-6 md:h-[calc(100dvh-var(--header-height)-2rem)] md:w-[calc(100%+3rem)]">
      {/* Left pane */}
      <aside
        className={cn(
          "bg-background flex w-full shrink-0 flex-col border-r md:w-[20rem] lg:w-[22rem]",
          mobileShowChat ? "hidden md:flex" : "flex"
        )}
      >
        <div className="flex items-center gap-3 border-b border-primary/15 px-4 py-3">
          <CustomerAvatar name={t("permissions")} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{t("permissions")}</p>
            <p className="text-muted-foreground truncate text-xs">
              {t("permissionsPage.teamMembers", { count: employees.length })}
            </p>
          </div>
        </div>

        <div className="border-b px-3 py-2">
          <label className="bg-muted relative flex items-center rounded-lg">
            <IconSearch className="text-muted-foreground pointer-events-none absolute left-3 size-4" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("permissionsPage.searchPlaceholder")}
              aria-label={t("permissionsPage.searchPlaceholder")}
              className="placeholder:text-muted-foreground h-9 w-full rounded-lg bg-transparent py-2 pr-3 pl-9 text-sm outline-none"
            />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredEmployees.length === 0 ? (
            <p className="text-muted-foreground px-4 py-10 text-center text-sm">
              {t("permissionsPage.noEmployeesFound")}
            </p>
          ) : (
            filteredEmployees.map((employee) => (
              <EmployeeListRow
                key={employee.id}
                employee={employee}
                selected={employee.id === selected.id}
                onSelect={() => selectEmployee(employee.id)}
              />
            ))
          )}
        </div>
      </aside>

      {/* Right pane */}
      <section
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          mobileShowChat ? "flex" : "hidden md:flex"
        )}
      >
        <header className="flex items-center gap-3 border-b border-primary/15 px-3 py-2.5 md:px-5">
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground -ms-1 rounded-full p-1.5 md:hidden"
            onClick={() => {
              if (isDirty) {
                toast.message(t("permissionsPage.toastSaveFirst"))
                return
              }
              setMobileShowChat(false)
            }}
            aria-label={t("permissionsPage.backToList")}
          >
            <IconArrowLeft className="size-5" />
          </button>
          <CustomerAvatar name={selected.name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">
              {selected.name}
            </p>
            <p className="text-muted-foreground truncate text-xs">
              {roleLine}
              {" · "}
              {permissionSummary(draft)}
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link href={`/employees/${selected.id}`}>
              <IconExternalLink className="size-4" />
              <span className="hidden sm:inline">{t("profilePage.profile")}</span>
            </Link>
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="flex w-full flex-col gap-4 p-4 md:p-6">
            <div className="bg-card w-full rounded-xl border border-primary/15 px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm leading-relaxed">
                    {t("permissionsPage.setWhatCan", { name: selected.name })}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Badge variant="outline" className="text-[10px]">
                      {selected.portalEnabled
                        ? t("permissionsPage.portalOn")
                        : t("permissionsPage.portalOff")}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {permissionSummary(draft)}
                    </Badge>
                  </div>
                </div>
              </div>
              {!selected.portalEnabled ? (
                <p className="text-muted-foreground mt-3 border-t pt-3 text-xs leading-relaxed">
                  {t("permissionsPage.portalOffHint")}
                </p>
              ) : null}
            </div>

            <div className="bg-card w-full rounded-xl border border-primary/15 px-4 py-4">
              <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
                {t("permissionsPage.quickActions")}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="space-y-1.5 sm:min-w-[11rem]">
                  <Label className="text-xs">{t("permissionsPage.preset")}</Label>
                  <Select
                    onValueChange={(value) =>
                      applyPreset(value as PermissionPresetId)
                    }
                  >
                    <SelectTrigger className="w-full sm:w-[12rem]" size="sm">
                      <SelectValue placeholder={t("permissionsPage.applyPreset")} />
                    </SelectTrigger>
                    <SelectContent>
                      {PERMISSION_PRESET_IDS.map((id) => (
                        <SelectItem key={id} value={id}>
                          {permissionPresetLabel(id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {copyCandidates.length > 0 ? (
                  <div className="space-y-1.5 sm:min-w-[14rem] sm:flex-1">
                    <Label className="text-xs">{t("permissionsPage.copyFrom")}</Label>
                    <Select value={copyFromId} onValueChange={copyFromEmployee}>
                      <SelectTrigger className="w-full" size="sm">
                        <SelectValue placeholder={t("permissionsPage.anotherEmployee")} />
                      </SelectTrigger>
                      <SelectContent>
                        {copyCandidates.map((employee) => (
                          <SelectItem
                            key={employee.id}
                            value={String(employee.id)}
                          >
                            {employee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
              </div>
              <p className="text-muted-foreground mt-3 flex items-center gap-1.5 text-xs">
                <IconCopy className="size-3.5 shrink-0" />
                {t("permissionsPage.draftHint")}
              </p>
            </div>

            <div className="bg-card w-full rounded-xl border border-primary/15 px-4 py-4">
              <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
                {t("permissionsPage.moduleAccess")}
              </p>
              <EmployeePermissionsMatrix value={draft} onChange={setDraft} />
            </div>
          </div>
        </div>

        <footer className="border-t border-primary/15 px-4 py-3 md:px-6">
          {isDirty ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-sm">
                {t("permissionsPage.unsavedChanges", { name: selected.name })}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={discardChanges}
                >
                  <IconX className="size-4" />
                  {t("permissionsPage.discard")}
                </Button>
                <Button type="button" size="sm" onClick={savePermissions}>
                  <IconCheck className="size-4" />
                  {tc("actions.save")}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground py-0.5 text-center text-sm">
              {t("permissionsPage.allSaved")}
            </p>
          )}
        </footer>
      </section>
    </div>
  )
}
