"use client"

import Link from "next/link"
import { IconShieldCheck } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"

export function EmployeesAdminGuard({ children }: { children: React.ReactNode }) {
  const { canAdmin } = useAuth()
  const { t } = useTranslation("employees")

  if (!canAdmin) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-4 py-8 text-center">
        <div className="bg-muted/50 mx-auto flex size-14 items-center justify-center rounded-2xl">
          <IconShieldCheck className="text-muted-foreground size-7" stroke={1.5} />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{t("guard.title")}</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {t("guard.body")}
          </p>
        </div>
        <Button type="button" variant="outline" asChild className="mx-auto w-fit">
          <Link href="/home">{t("guard.back")}</Link>
        </Button>
      </div>
    )
  }

  return <>{children}</>
}
