"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef } from "react"
import { toast } from "sonner"

import { useAuth } from "@/context/auth-context"
import { apiConfirmCheckout } from "@/lib/api/auth"

export function useCheckoutReturn(options?: { redirectWhenActive?: string }) {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { refreshAccess } = useAuth()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    const checkout = params.get("checkout")
    if (!checkout) return
    ran.current = true
    const sessionId = params.get("session_id")

    void (async () => {
      let redirected = false
      try {
        if (checkout === "success") {
          if (sessionId) await apiConfirmCheckout(sessionId)
          const access = await refreshAccess()
          toast.success("Subscription is active")
          if (options?.redirectWhenActive && access?.allowed) {
            redirected = true
            router.replace(options.redirectWhenActive)
          }
        } else if (checkout === "cancel") {
          toast.message("Checkout cancelled")
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not confirm payment")
      }
      if (!redirected) router.replace(pathname)
    })()
  }, [options?.redirectWhenActive, params, pathname, refreshAccess, router])
}
