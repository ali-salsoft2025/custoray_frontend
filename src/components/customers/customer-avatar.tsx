import { IconUser } from "@tabler/icons-react"

import { cn } from "@/lib/utils"

type CustomerAvatarProps = {
  name: string
  imageUrl?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "size-8",
  md: "size-10",
  lg: "size-24",
} as const

const iconClasses = {
  sm: "size-4",
  md: "size-5",
  lg: "size-10",
} as const

export function CustomerAvatar({
  name,
  imageUrl,
  size = "md",
  className,
}: CustomerAvatarProps) {
  const src = imageUrl?.trim()

  if (src) {
    return (
      <div
        className={cn(
          "border-border bg-muted shrink-0 overflow-hidden rounded-full border",
          sizeClasses[size],
          className
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={name || "Customer"} className="size-full object-cover" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "border-border bg-muted text-muted-foreground flex shrink-0 items-center justify-center rounded-full border",
        sizeClasses[size],
        className
      )}
      aria-hidden={!name}
    >
      <IconUser className={iconClasses[size]} />
    </div>
  )
}
