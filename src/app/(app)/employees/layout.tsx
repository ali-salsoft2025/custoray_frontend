import { EmployeesAdminGuard } from "@/components/employees/employees-admin-guard"

export default function EmployeesSectionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <EmployeesAdminGuard>{children}</EmployeesAdminGuard>
}
