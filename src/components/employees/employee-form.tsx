"use client"

import * as React from "react"
import type { FormEvent } from "react"

import { CustomerAvatar } from "@/components/customers/customer-avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { Separator } from "@/components/ui/separator"
import { useDepartments } from "@/context/employee-departments-context"
import type { EmployeeRow } from "@/lib/employees"

type EmployeeFormProps = {
  formId: string
  employee: EmployeeRow
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
}

function PermissionCheckbox({
  id,
  name,
  label,
  description,
  defaultChecked,
  disabled,
}: {
  id: string
  name: string
  label: string
  description: string
  defaultChecked?: boolean
  disabled?: boolean
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
      <Checkbox
        id={id}
        name={name}
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="mt-0.5"
      />
      <div className="space-y-0.5">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <p className="text-muted-foreground text-xs leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

export function EmployeeForm({ formId, employee, onSubmit }: EmployeeFormProps) {
  const { departments } = useDepartments()
  const [portalEnabled, setPortalEnabled] = React.useState(employee.portalEnabled)
  const [adminChecked, setAdminChecked] = React.useState(employee.permissions.admin)

  return (
    <form id={formId} className="flex flex-col gap-5 text-sm" onSubmit={onSubmit}>
      <section className="space-y-4">
        <div>
          <p className="text-sm font-semibold">Basic info</p>
          <p className="text-muted-foreground text-xs">
            Who this person is and how to reach them.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CustomerAvatar name={employee.name || "Employee"} size="lg" />
          <p className="text-muted-foreground text-xs leading-relaxed">
            Profile photo can be added later.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${formId}-name`}>Full name</Label>
          <Input
            id={`${formId}-name`}
            name="name"
            required
            defaultValue={employee.name}
            placeholder="e.g. Sara Ahmed"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${formId}-email`}>Work email</Label>
            <Input
              id={`${formId}-email`}
              name="email"
              type="email"
              defaultValue={employee.email}
              placeholder="sara@company.com"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${formId}-phone`}>Phone</Label>
            <Input
              id={`${formId}-phone`}
              name="phone"
              defaultValue={employee.phone === "—" ? "" : employee.phone}
              placeholder="+92 300 1234567"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${formId}-department`}>Department</Label>
            <select
              id={`${formId}-department`}
              name="department"
              defaultValue={
                departments.some((d) => d.name === employee.department)
                  ? employee.department
                  : employee.department !== "—"
                    ? employee.department
                    : ""
              }
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            >
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${formId}-designation`}>Job title</Label>
            <Input
              id={`${formId}-designation`}
              name="designation"
              defaultValue={employee.designation === "—" ? "" : employee.designation}
              placeholder="Manager, Clerk…"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${formId}-hireDate`}>Start date</Label>
            <Input
              id={`${formId}-hireDate`}
              name="hireDate"
              type="date"
              defaultValue={employee.hireDate}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${formId}-baseSalary`}>Monthly salary</Label>
            <Input
              id={`${formId}-baseSalary`}
              name="baseSalary"
              defaultValue={employee.baseSalary}
              placeholder="0.00"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${formId}-status`}>Status</Label>
            <select
              id={`${formId}-status`}
              name="status"
              defaultValue={employee.status}
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <div>
          <p className="text-sm font-semibold">Portal access</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Give this employee their own login to the business portal.
          </p>
        </div>
        <div className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
          <Checkbox
            id={`${formId}-portalEnabled`}
            name="portalEnabled"
            checked={portalEnabled}
            onCheckedChange={(value) => setPortalEnabled(value === true)}
            className="mt-0.5"
          />
          <div className="space-y-0.5">
            <Label htmlFor={`${formId}-portalEnabled`} className="text-sm font-medium">
              Allow portal login
            </Label>
            <p className="text-muted-foreground text-xs leading-relaxed">
              When off, they cannot sign in even if credentials exist.
            </p>
          </div>
        </div>
        {portalEnabled ? (
          <div className="space-y-4 rounded-lg bg-muted/30 p-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-portalEmail`}>Login email</Label>
              <Input
                id={`${formId}-portalEmail`}
                name="portalEmail"
                type="email"
                required={portalEnabled}
                defaultValue={employee.portalEmail}
                placeholder="sara@custoray.demo"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-portalPassword`}>
                {employee.portalPassword ? "Password" : "Set password"}
              </Label>
              <PasswordInput
                id={`${formId}-portalPassword`}
                name="portalPassword"
                autoComplete="new-password"
                placeholder={
                  employee.portalPassword ? "Leave blank to keep current" : "Choose a password"
                }
              />
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Demo only — stored locally until a real backend is connected.
              </p>
            </div>
          </div>
        ) : null}
      </section>

      <Separator />

      <section className="space-y-3">
        <div>
          <p className="text-sm font-semibold">Permissions</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Control what they can do after signing in. Admin includes everything.
          </p>
        </div>
        <div className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
          <Checkbox
            id={`${formId}-perm-admin`}
            name="perm_admin"
            checked={adminChecked}
            onCheckedChange={(value) => setAdminChecked(value === true)}
            className="mt-0.5"
          />
          <div className="space-y-0.5">
            <Label htmlFor={`${formId}-perm-admin`} className="text-sm font-medium">
              Admin
            </Label>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Full access — manage employees, settings, and all records.
            </p>
          </div>
        </div>
        <PermissionCheckbox
          id={`${formId}-perm-view`}
          name="perm_view"
          label="View"
          description="See customers, sales, inventory, and reports."
          defaultChecked={employee.permissions.view || employee.permissions.admin}
          disabled={adminChecked}
        />
        <PermissionCheckbox
          id={`${formId}-perm-edit`}
          name="perm_edit"
          label="Edit"
          description="Create and update records (orders, products, payments, etc.)."
          defaultChecked={employee.permissions.edit || employee.permissions.admin}
          disabled={adminChecked}
        />
        <PermissionCheckbox
          id={`${formId}-perm-delete`}
          name="perm_delete"
          label="Delete"
          description="Remove records when needed."
          defaultChecked={employee.permissions.delete || employee.permissions.admin}
          disabled={adminChecked}
        />
      </section>
    </form>
  )
}
