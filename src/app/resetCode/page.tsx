import { Suspense } from "react"

import { ResetCodeForm } from "@/components/resetCodeForm"

export default function ResetCodePage() {
  return (
    <Suspense fallback={null}>
      <ResetCodeForm />
    </Suspense>
  )
}
