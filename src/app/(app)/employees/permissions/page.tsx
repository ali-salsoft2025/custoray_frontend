"use client"

import { Suspense } from "react"
import { useTranslation } from "react-i18next"

import { EmployeePermissionsPanel } from "@/components/employees/employee-permissions-panel"
import { PageLoader } from "@/components/ui/page-loader"

export default function EmployeePermissionsPage() {
  const { t } = useTranslation("employees")
  return (
    <Suspense fallback={<PageLoader message={t("permissionsPage.loading")} />}>
      <EmployeePermissionsPanel />
    </Suspense>
  )
}
