import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"

export function AuthBrand({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center", className)}>
      <Image
        src="/assets/logo-2.png"
        alt="Custoray"
        width={140}
        height={40}
        className="h-8 w-auto object-contain object-left"
        priority
      />
    </Link>
  )
}
