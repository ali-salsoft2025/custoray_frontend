import { EmployeesAdminGuard } from "@/components/employees/employees-admin-guard"
import { EmployeesLayout } from "@/components/employees/employees-layout"

export default function EmployeesSectionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <EmployeesAdminGuard>
      <EmployeesLayout>{children}</EmployeesLayout>
    </EmployeesAdminGuard>
  )
}
