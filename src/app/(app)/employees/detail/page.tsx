"use client"

import { usePathname } from "next/navigation"

import { EmployeeProfilePage } from "@/components/employees/employee-profile-page"
import { pathMatch } from "@/lib/route-ids"

export default function EmployeeDetailPage() {
  const pathname = usePathname()
  const id = pathMatch(pathname, /^\/employees\/(\d+)$/)
  return <EmployeeProfilePage employeeId={Number(id)} />
}
