"use client"

import { useEffect, useState, type ReactNode } from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { toast } from "sonner"

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
  statusLabel,
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
      toast.error("Login email is required.")
      return
    }
    if (!portalPassword.trim()) {
      toast.error("Password is required.")
      return
    }
    updateEmployee(employee.id, {
      portalEnabled: true,
      portalEmail: email,
      portalPassword: portalPassword.trim(),
    })
    setEditingCredentials(false)
    toast.success("Login credentials updated.")
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
            {employee.designation !== "—" ? employee.designation : "Employee"} · ID{" "}
            {employee.id}
          </p>
        </div>
      </div>
      <dl className="space-y-3">
        {detailRow("Work email", employee.email || "—")}
        {detailRow("Phone", employee.phone)}
        {detailRow("Department", employee.department)}
        {detailRow("Job title", employee.designation)}
        {detailRow("Start date", employee.hireDate)}
        {detailRow("Monthly salary", formatMoney(employee.baseSalary))}
        {detailRow(
          "Status",
          <Badge variant="outline" className={statusBadgeClass(employee.status)}>
            {statusLabel(employee.status)}
          </Badge>
        )}
        {detailRow(
          "Portal login",
          employee.portalEnabled ? (
            <Badge
              variant="outline"
              className="border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
            >
              Enabled
            </Badge>
          ) : (
            <Badge variant="outline">Disabled</Badge>
          )
        )}
        {detailRow("Access summary", permissionSummary(employee.permissions))}
      </dl>

      {canAdmin && employee.portalEnabled ? (
        <div className="space-y-3 rounded-lg border border-border/60 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">Login credentials</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Admins can view and update portal email and password.
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
                Edit
              </Button>
            ) : null}
          </div>

          {editingCredentials ? (
            <div className="space-y-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor={`cred-email-${employee.id}`}>Login email</Label>
                <Input
                  id={`cred-email-${employee.id}`}
                  type="email"
                  value={portalEmail}
                  onChange={(e) => setPortalEmail(e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`cred-password-${employee.id}`}>Password</Label>
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
                  Save credentials
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetCredentials}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <dl className="space-y-3">
              {detailRow("Login email", employee.portalEmail || "—")}
              {detailRow(
                "Password",
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
                      showPassword ? "Hide password" : "Show password"
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
          {detailRow("Login email", employee.portalEmail || "—")}
        </dl>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-semibold">Module access</p>
        {permissions.admin ? (
          <p className="text-muted-foreground text-sm">
            Admin — full access to all modules.
          </p>
        ) : modulesWithAccess.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No module permissions assigned.
          </p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {modulesWithAccess.map((id) => {
              const m = permissions.modules[id]
              const parts = [
                m.add ? "Add" : null,
                m.edit ? "Edit" : null,
                m.delete ? "Delete" : null,
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
