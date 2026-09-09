"use client"

import { Suspense } from "react"
import { usePathname } from "next/navigation"
import { useTranslation } from "react-i18next"

import { PublicStorefront } from "@/components/qr-storefront/public-storefront"
import { PageLoader } from "@/components/ui/page-loader"
import { firstSegmentAfter } from "@/lib/route-ids"

export default function StorefrontPage() {
  const pathname = usePathname()
  const storeId = firstSegmentAfter(pathname, "/store")
  const { t } = useTranslation("storefront")
  return (
    <Suspense fallback={<PageLoader fullScreen message={t("opening")} />}>
      <PublicStorefront storeId={storeId} />
    </Suspense>
  )
}
