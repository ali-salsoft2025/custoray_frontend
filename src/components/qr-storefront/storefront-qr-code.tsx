"use client"

import * as React from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import i18n from "@/i18n"
import { qrImageUrl } from "@/lib/storefront"
import { cn } from "@/lib/utils"

type StorefrontQrCodeProps = {
  url: string
  storeName: string
  subtitle?: string
  className?: string
}

export function StorefrontQrCode({
  url,
  storeName,
  subtitle,
  className,
}: StorefrontQrCodeProps) {
  const { t } = useTranslation("storefront")
  const src = qrImageUrl(url, 400)

  return (
    <div
      id="storefront-qr-print"
      className={cn(
        "flex flex-col items-center gap-4 rounded-2xl bg-white p-6 text-center text-zinc-900 ring-1 ring-black/8",
        "transition-shadow duration-300",
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={t("qrAlt", { storeName })}
        className="size-56 sm:size-64 transition-opacity duration-300"
        width={256}
        height={256}
      />
      <div className="space-y-1">
        <p className="text-base font-semibold tracking-tight">{storeName}</p>
        {subtitle ? (
          <p className="text-sm font-medium text-zinc-700">{subtitle}</p>
        ) : null}
        <p className="text-xs text-zinc-500">{t("scanToBrowse")}</p>
      </div>
    </div>
  )
}

export async function downloadStorefrontQr(url: string, storeName: string) {
  const filename = `${storeName.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "store"}-qr.png`
  const src = qrImageUrl(url, 512)

  try {
    const response = await fetch(src)
    if (!response.ok) throw new Error("QR download failed")
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = objectUrl
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(objectUrl)
    toast.success(i18n.t("qrDownloaded", { ns: "storefront" }))
  } catch {
    window.open(src, "_blank", "noopener,noreferrer")
    toast.message(i18n.t("qrOpenedTab", { ns: "storefront" }))
  }
}
