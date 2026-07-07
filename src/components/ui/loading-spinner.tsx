"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/** Brand loader gif — place your animated file at public/assets/loader.gif */
export const LOADER_GIF_SRC = "/assets/loader.gif"
export const LOADER_SVG_SRC = "/assets/loader.svg"

const sizeMap = {
  xs: "size-3",
  sm: "size-4",
  md: "size-8",
  lg: "size-12",
  xl: "size-16",
} as const

export type LoadingSpinnerSize = keyof typeof sizeMap

function LoaderArcSvg({
  className,
  sizeClass,
}: {
  className?: string
  sizeClass: string
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("animate-spin", sizeClass, className)}
      aria-hidden
    >
      <path
        d="M24 6a18 18 0 0 1 15.59 9.02"
        stroke="#C0FF3E"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export type LoadingSpinnerProps = {
  size?: LoadingSpinnerSize
  className?: string
  label?: string
}

export function LoadingSpinner({
  size = "md",
  className,
  label = "Loading",
}: LoadingSpinnerProps) {
  const sizeClass = sizeMap[size]
  const [source, setSource] = React.useState<"gif" | "svg">("gif")

  if (source === "gif") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={LOADER_GIF_SRC}
        alt=""
        aria-label={label}
        role="status"
        className={cn(sizeClass, "object-contain", className)}
        onError={() => setSource("svg")}
      />
    )
  }

  return (
    <span role="status" aria-label={label} className={cn("inline-flex", className)}>
      <LoaderArcSvg sizeClass={sizeClass} />
    </span>
  )
}
