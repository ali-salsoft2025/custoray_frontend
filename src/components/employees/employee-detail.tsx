"use client"

import { useEffect, useState, type ReactNode } from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import { CustomerAvatar } from "@/components/customers/customer-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { useAuth } from "@/context/auth-context"
import { useEmployees } from "@/context/employees-context"
import {
  MODULE_IDS,
  MODULE_LABELS,
  effectivePermissions,
  permissionSummary,
} from "@/lib/employee-permissions"
import { formatMoney } from "@/lib/employee-payroll"
import {
  statusBadgeClass,
  type EmployeeRow,
} from "@/lib/employees"

function detailRow(label: string, value: ReactNode) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground min-w-0 font-medium">{value}</dd>
    </div>
  )
}

export function EmployeeDetail({ employee }: { employee: EmployeeRow }) {
  const { canAdmin } = useAuth()
  const { updateEmployee } = useEmployees()
  const { t } = useTranslation("employees")
  const { t: tc } = useTranslation("common")
  const permissions = effectivePermissions(employee.permissions)
  const modulesWithAccess = MODULE_IDS.filter((id) => {
    const m = permissions.modules[id]
    return m.add || m.edit || m.delete
  })

  const [portalEmail, setPortalEmail] = useState(employee.portalEmail)
  const [portalPassword, setPortalPassword] = useState(employee.portalPassword)
  const [editingCredentials, setEditingCredentials] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    setPortalEmail(employee.portalEmail)
    setPortalPassword(employee.portalPassword)
    setEditingCredentials(false)
    setShowPassword(false)
  }, [employee.id, employee.portalEmail, employee.portalPassword])

  const credentialsDirty =
    portalEmail.trim().toLowerCase() !== employee.portalEmail ||
    portalPassword !== employee.portalPassword

  const resetCredentials = () => {
    setPortalEmail(employee.portalEmail)
    setPortalPassword(employee.portalPassword)
    setEditingCredentials(false)
  }

  const saveCredentials = () => {
    if (!canAdmin) return
    const email = portalEmail.trim().toLowerCase()
    if (!email) {
      toast.error(t("detail.toastEmailRequired"))
      return
    }
    if (!portalPassword.trim()) {
      toast.error(t("detail.toastPasswordRequired"))
      return
    }
    updateEmployee(employee.id, {
      portalEnabled: true,
      portalEmail: email,
      portalPassword: portalPassword.trim(),
    })
    setEditingCredentials(false)
    toast.success(t("detail.toastCredentialsUpdated"))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <CustomerAvatar name={employee.name} size="lg" />
        <div className="min-w-0">
          <p className="text-foreground truncate text-base font-semibold">
            {employee.name}
          </p>
          <p className="text-muted-foreground text-xs">
            {employee.designation !== "—" ? employee.designation : t("form.employeeFallback")} · ID{" "}
            {employee.id}
          </p>
        </div>
      </div>
      <dl className="space-y-3">
        {detailRow(t("form.workEmail"), employee.email || "—")}
        {detailRow(t("form.phone"), employee.phone)}
        {detailRow(t("columns.department"), employee.department)}
        {detailRow(t("form.jobTitle"), employee.designation)}
        {detailRow(t("form.startDate"), employee.hireDate)}
        {detailRow(t("form.monthlySalary"), formatMoney(employee.baseSalary))}
        {detailRow(
          t("columns.status"),
          <Badge variant="outline" className={statusBadgeClass(employee.status)}>
            {t(`status.${employee.status}`)}
          </Badge>
        )}
        {detailRow(
          t("detail.portalLogin"),
          employee.portalEnabled ? (
            <Badge
              variant="outline"
              className="border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
            >
              {t("status.enabled")}
            </Badge>
          ) : (
            <Badge variant="outline">{t("status.disabled")}</Badge>
          )
        )}
        {detailRow(t("detail.accessSummary"), permissionSummary(employee.permissions))}
      </dl>

      {canAdmin && employee.portalEnabled ? (
        <div className="space-y-3 rounded-lg border border-border/60 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{t("form.loginCredentials")}</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {t("detail.loginCredentialsHint")}
              </p>
            </div>
            {!editingCredentials ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setPortalEmail(employee.portalEmail)
                  setPortalPassword(employee.portalPassword)
                  setEditingCredentials(true)
                }}
              >
                {tc("actions.edit")}
              </Button>
            ) : null}
          </div>

          {editingCredentials ? (
            <div className="space-y-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor={`cred-email-${employee.id}`}>{t("form.loginEmail")}</Label>
                <Input
                  id={`cred-email-${employee.id}`}
                  type="email"
                  value={portalEmail}
                  onChange={(e) => setPortalEmail(e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`cred-password-${employee.id}`}>{t("form.password")}</Label>
                <PasswordInput
                  id={`cred-password-${employee.id}`}
                  value={portalPassword}
                  onChange={(e) => setPortalPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={saveCredentials}
                  disabled={!credentialsDirty}
                >
                  {t("detail.saveCredentials")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetCredentials}
                >
                  {tc("actions.cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <dl className="space-y-3">
              {detailRow(t("form.loginEmail"), employee.portalEmail || "—")}
              {detailRow(
                t("form.password"),
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">
                    {showPassword
                      ? employee.portalPassword || "—"
                      : "•".repeat(
                          Math.max(8, employee.portalPassword.length || 8)
                        )}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? t("detail.hidePassword") : t("detail.showPassword")
                    }
                  >
                    {showPassword ? (
                      <EyeOffIcon className="size-4" />
                    ) : (
                      <EyeIcon className="size-4" />
                    )}
                  </Button>
                </div>
              )}
            </dl>
          )}
        </div>
      ) : null}

      {!canAdmin && employee.portalEnabled ? (
        <dl className="space-y-3">
          {detailRow(t("form.loginEmail"), employee.portalEmail || "—")}
        </dl>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-semibold">{t("detail.moduleAccess")}</p>
        {permissions.admin ? (
          <p className="text-muted-foreground text-sm">
            {t("detail.adminFullAccess")}
          </p>
        ) : modulesWithAccess.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {t("detail.noModulePermissions")}
          </p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {modulesWithAccess.map((id) => {
              const m = permissions.modules[id]
              const parts = [
                m.add ? t("matrix.add") : null,
                m.edit ? t("matrix.edit") : null,
                m.delete ? t("matrix.delete") : null,
              ].filter(Boolean)
              return (
                <li
                  key={id}
                  className="flex items-center justify-between gap-3 border-b border-border/40 py-1.5 last:border-0"
                >
                  <span className="font-medium">{MODULE_LABELS[id]}</span>
                  <span className="text-muted-foreground text-xs">
                    {parts.join(" · ")}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
