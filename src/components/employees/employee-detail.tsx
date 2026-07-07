import type { ReactNode } from "react"

import { CustomerAvatar } from "@/components/customers/customer-avatar"
import { Badge } from "@/components/ui/badge"
import { permissionSummary } from "@/lib/employee-permissions"
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
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <CustomerAvatar name={employee.name} size="lg" />
        <div className="min-w-0">
          <p className="text-foreground truncate text-base font-semibold">{employee.name}</p>
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
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
              Enabled
            </Badge>
          ) : (
            <Badge variant="outline">Disabled</Badge>
          )
        )}
        {employee.portalEnabled
          ? detailRow("Login email", employee.portalEmail)
          : null}
        {detailRow("Permissions", permissionSummary(employee.permissions))}
      </dl>
    </div>
  )
}
