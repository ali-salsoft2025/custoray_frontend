import { Suspense } from "react"

import { EmployeePermissionsPanel } from "@/components/employees/employee-permissions-panel"
import { PageLoader } from "@/components/ui/page-loader"

export default function EmployeePermissionsPage() {
  return (
    <Suspense fallback={<PageLoader message="Loading permissions…" />}>
      <EmployeePermissionsPanel />
    </Suspense>
  )
}
