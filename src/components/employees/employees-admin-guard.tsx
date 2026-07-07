"use client"

import Link from "next/link"
import { IconShieldCheck } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"

export function EmployeesAdminGuard({ children }: { children: React.ReactNode }) {
  const { canAdmin } = useAuth()

  if (!canAdmin) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-4 py-8 text-center">
        <div className="bg-muted/50 mx-auto flex size-14 items-center justify-center rounded-2xl">
          <IconShieldCheck className="text-muted-foreground size-7" stroke={1.5} />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Admin access required</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Only business admins can manage employees, permissions, payroll, and leave.
            Ask your admin if you need access.
          </p>
        </div>
        <Button type="button" variant="outline" asChild className="mx-auto w-fit">
          <Link href="/home">Back to dashboard</Link>
        </Button>
      </div>
    )
  }

  return <>{children}</>
}
