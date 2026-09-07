"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"

import { CustomerAvatar } from "@/components/customers/customer-avatar"
import { EmployeePermissionsMatrix } from "@/components/employees/employee-permissions-matrix"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { Separator } from "@/components/ui/separator"
import { useDepartments } from "@/context/employee-departments-context"
import { normalizePermissions, NO_PERMISSIONS } from "@/lib/employee-permissions"
import {
  type EmployeeFormValues,
  type EmployeeRow,
} from "@/lib/employees"

export type EmployeeFormHandle = {
  goNextOrSubmit: () => void
  goBack: () => void
  getStep: () => 1 | 2
  isPortalStepNeeded: () => boolean
}

type EmployeeFormProps = {
  formId: string
  mode: "add" | "edit"
  employee: EmployeeRow
  onSubmit: (values: EmployeeFormValues) => void
  onStepChange?: (step: 1 | 2) => void
  onPortalEnabledChange?: (enabled: boolean) => void
}

function toValues(employee: EmployeeRow, mode: "add" | "edit"): EmployeeFormValues {
  return {
    name: employee.name,
    email: employee.email,
    phone: employee.phone === "—" ? "" : employee.phone,
    department: employee.department === "—" ? "" : employee.department,
    designation: employee.designation === "—" ? "" : employee.designation,
    status: employee.status,
    hireDate: employee.hireDate,
    baseSalary: employee.baseSalary,
    portalEnabled: employee.portalEnabled,
    portalEmail: employee.portalEmail,
    // Admins can view and update existing portal passwords when editing.
    portalPassword: mode === "edit" ? employee.portalPassword : "",
    permissions: normalizePermissions(employee.permissions),
  }
}

export const EmployeeForm = React.forwardRef<EmployeeFormHandle, EmployeeFormProps>(
  function EmployeeForm(
    { formId, mode, employee, onSubmit, onStepChange, onPortalEnabledChange },
    ref
  ) {
    const { departments } = useDepartments()
    const { t } = useTranslation("employees")
    const { t: tc } = useTranslation("common")
    const [step, setStep] = React.useState<1 | 2>(1)
    const [values, setValues] = React.useState<EmployeeFormValues>(() =>
      toValues(employee, mode)
    )
    const [error, setError] = React.useState<string | null>(null)

    React.useEffect(() => {
      setValues(toValues(employee, mode))
      setStep(1)
      setError(null)
    }, [employee, mode])

    React.useEffect(() => {
      onStepChange?.(step)
    }, [step, onStepChange])

    React.useEffect(() => {
      onPortalEnabledChange?.(values.portalEnabled)
    }, [values.portalEnabled, onPortalEnabledChange])

    const patch = (partial: Partial<EmployeeFormValues>) => {
      setValues((prev) => ({ ...prev, ...partial }))
      setError(null)
    }

    const validateStep1 = (): boolean => {
      if (!values.name.trim()) {
        setError(t("form.errors.nameRequired"))
        return false
      }
      if (mode === "edit" && values.portalEnabled) {
        if (!values.portalEmail.trim()) {
          setError(t("form.errors.loginEmailRequired"))
          return false
        }
        if (!values.portalPassword.trim()) {
          setError(t("form.errors.passwordRequired"))
          return false
        }
      }
      return true
    }

    const validateStep2 = (): boolean => {
      if (!values.portalEmail.trim()) {
        setError(t("form.errors.loginEmailRequired"))
        return false
      }
      if (!values.portalPassword.trim() && !employee.portalPassword) {
        setError(t("form.errors.setPassword"))
        return false
      }
      if (mode === "add" && !values.portalPassword.trim()) {
        setError(t("form.errors.setPassword"))
        return false
      }
      return true
    }

    const finish = () => {
      const withPortal = values.portalEnabled
      onSubmit({
        ...values,
        portalEnabled: withPortal,
        portalEmail: withPortal ? values.portalEmail : "",
        portalPassword: withPortal
          ? values.portalPassword.trim() ||
            (mode === "edit" ? employee.portalPassword : "")
          : "",
        permissions: withPortal
          ? normalizePermissions(values.permissions)
          : { ...NO_PERMISSIONS, modules: normalizePermissions(NO_PERMISSIONS).modules },
      })
    }

    const goNextOrSubmit = () => {
      if (step === 1) {
        if (!validateStep1()) return
        if (mode === "add" && values.portalEnabled) {
          if (!values.portalEmail.trim() && values.email.trim()) {
            setValues((prev) => ({
              ...prev,
              portalEmail: prev.email.trim().toLowerCase(),
            }))
          }
          setStep(2)
          return
        }
        finish()
        return
      }
      if (!validateStep2()) return
      finish()
    }

    const goBack = () => {
      setError(null)
      setStep(1)
    }

    React.useImperativeHandle(
      ref,
      () => ({
        goNextOrSubmit,
        goBack,
        getStep: () => step,
        isPortalStepNeeded: () => values.portalEnabled,
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps -- sync with latest values/step
      [step, values, mode, employee.portalPassword]
    )

    return (
      <div className="flex flex-col gap-5 text-sm">
        {mode === "add" ? (
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <span
              className={
                step === 1 ? "text-foreground font-semibold" : "font-medium"
              }
            >
              {t("form.stepBasic")}
            </span>
            <span aria-hidden>/</span>
            <span
              className={
                step === 2 ? "text-foreground font-semibold" : "font-medium"
              }
            >
              {t("form.stepLogin")}
            </span>
          </div>
        ) : null}

        {error ? (
          <p className="text-destructive rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs">
            {error}
          </p>
        ) : null}

        {step === 1 ? (
          <>
            <section className="space-y-4">
              <div>
                <p className="text-sm font-semibold">{t("form.basicInfo")}</p>
                <p className="text-muted-foreground text-xs">
                  {t("form.basicInfoHint")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <CustomerAvatar name={values.name || t("form.employeeFallback")} size="lg" />
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {t("form.photoLater")}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${formId}-name`}>{t("form.fullName")}</Label>
                <Input
                  id={`${formId}-name`}
                  value={values.name}
                  onChange={(e) => patch({ name: e.target.value })}
                  placeholder={t("form.fullNamePlaceholder")}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`${formId}-email`}>{t("form.workEmail")}</Label>
                  <Input
                    id={`${formId}-email`}
                    type="email"
                    value={values.email}
                    onChange={(e) => patch({ email: e.target.value })}
                    placeholder="sara@company.com"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`${formId}-phone`}>{t("form.phone")}</Label>
                  <Input
                    id={`${formId}-phone`}
                    value={values.phone}
                    onChange={(e) => patch({ phone: e.target.value })}
                    placeholder="+92 300 1234567"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`${formId}-department`}>{t("columns.department")}</Label>
                  <select
                    id={`${formId}-department`}
                    value={values.department}
                    onChange={(e) => patch({ department: e.target.value })}
                    className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  >
                    <option value="">{t("form.selectDepartment")}</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`${formId}-designation`}>{t("form.jobTitle")}</Label>
                  <Input
                    id={`${formId}-designation`}
                    value={values.designation}
                    onChange={(e) => patch({ designation: e.target.value })}
                    placeholder={t("form.jobTitlePlaceholder")}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`${formId}-hireDate`}>{t("form.startDate")}</Label>
                  <Input
                    id={`${formId}-hireDate`}
                    type="date"
                    min="1970-01-01"
                    max={`${new Date().getFullYear() + 5}-12-31`}
                    value={values.hireDate}
                    onChange={(e) => patch({ hireDate: e.target.value })}
                    className="relative z-10 block w-full min-w-0"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`${formId}-baseSalary`}>{t("form.monthlySalary")}</Label>
                  <Input
                    id={`${formId}-baseSalary`}
                    value={values.baseSalary}
                    onChange={(e) => patch({ baseSalary: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`${formId}-status`}>{t("columns.status")}</Label>
                  <select
                    id={`${formId}-status`}
                    value={values.status}
                    onChange={(e) =>
                      patch({ status: e.target.value as "active" | "inactive" })
                    }
                    className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  >
                    <option value="active">{tc("status.active")}</option>
                    <option value="inactive">{tc("status.inactive")}</option>
                  </select>
                </div>
              </div>
            </section>

            <Separator />

            <section className="space-y-3">
              <div>
                <p className="text-sm font-semibold">{t("form.portalAccess")}</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {mode === "add"
                    ? t("form.portalHintAdd")
                    : t("form.portalHintEdit")}
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
                <Checkbox
                  id={`${formId}-portalEnabled`}
                  checked={values.portalEnabled}
                  onCheckedChange={(checked) =>
                    patch({ portalEnabled: checked === true })
                  }
                  className="mt-0.5"
                />
                <div className="space-y-0.5">
                  <Label
                    htmlFor={`${formId}-portalEnabled`}
                    className="text-sm font-medium"
                  >
                    {t("form.allowPortal")}
                  </Label>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {t("form.allowPortalHint")}
                  </p>
                </div>
              </div>

              {mode === "edit" && values.portalEnabled ? (
                <>
                  <div className="space-y-4 rounded-lg border border-border/60 p-4">
                    <div>
                      <p className="text-sm font-medium">{t("form.loginCredentials")}</p>
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        {t("form.loginCredentialsHint")}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`${formId}-portalEmail`}>{t("form.loginEmail")}</Label>
                      <Input
                        id={`${formId}-portalEmail`}
                        type="email"
                        value={values.portalEmail}
                        onChange={(e) => patch({ portalEmail: e.target.value })}
                        placeholder="sara@custoray.demo"
                        autoComplete="username"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`${formId}-portalPassword`}>
                        {t("form.password")}
                      </Label>
                      <PasswordInput
                        id={`${formId}-portalPassword`}
                        autoComplete="new-password"
                        value={values.portalPassword}
                        onChange={(e) =>
                          patch({ portalPassword: e.target.value })
                        }
                        placeholder={t("form.portalPasswordPlaceholder")}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold">{t("form.modulePermissions")}</p>
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        {t("form.modulePermissionsHint")}
                      </p>
                    </div>
                    <EmployeePermissionsMatrix
                      value={values.permissions}
                      onChange={(permissions) => patch({ permissions })}
                    />
                  </div>
                </>
              ) : null}
            </section>
          </>
        ) : (
          <>
            <section className="space-y-4">
              <div>
                <p className="text-sm font-semibold">{t("form.createCredentials")}</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {t("form.createCredentialsHint")}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${formId}-portalEmail-step2`}>{t("form.loginEmail")}</Label>
                <Input
                  id={`${formId}-portalEmail-step2`}
                  type="email"
                  value={values.portalEmail}
                  onChange={(e) => patch({ portalEmail: e.target.value })}
                  placeholder={values.email || "sara@custoray.demo"}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${formId}-portalPassword-step2`}>{t("form.password")}</Label>
                <PasswordInput
                  id={`${formId}-portalPassword-step2`}
                  autoComplete="new-password"
                  value={values.portalPassword}
                  onChange={(e) => patch({ portalPassword: e.target.value })}
                  placeholder={t("form.choosePassword")}
                />
              </div>
            </section>

            <Separator />

            <section className="space-y-3">
              <div>
                <p className="text-sm font-semibold">{t("form.modulePermissions")}</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {t("form.modulePermissionsHintStep2")}
                </p>
              </div>
              <EmployeePermissionsMatrix
                value={values.permissions}
                onChange={(permissions) => patch({ permissions })}
              />
            </section>
          </>
        )}
      </div>
    )
  }
)

EmployeeForm.displayName = "EmployeeForm"
