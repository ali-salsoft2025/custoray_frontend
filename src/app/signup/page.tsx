"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"

import { SignupWizard } from "@/components/signup/signup-wizard"

function SignupPageInner() {
  const params = useSearchParams()
  return <SignupWizard planCode={params.get("plan") ?? undefined} />
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageInner />
    </Suspense>
  )
}
