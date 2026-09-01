"use client"

import { Suspense, use } from "react"

import { PublicStorefront } from "@/components/qr-storefront/public-storefront"
import { PageLoader } from "@/components/ui/page-loader"

export default function StorefrontPage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const { storeId } = use(params)
  return (
    <Suspense fallback={<PageLoader fullScreen message="Opening storefront…" />}>
      <PublicStorefront storeId={decodeURIComponent(storeId)} />
    </Suspense>
  )
}
