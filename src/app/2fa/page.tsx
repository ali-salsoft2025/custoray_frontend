import { Suspense } from "react"

import { TwoFactorForm } from "@/components/twoFactorForm"

export default function TwoFactorPage() {
  return (
    <Suspense fallback={null}>
      <TwoFactorForm />
    </Suspense>
  )
}
