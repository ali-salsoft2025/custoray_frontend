"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ToggleButton({
  className,
  layout = "fixed-corner",
  variant = "outline",
}: {
  className?: string
  /** `toolbar`: sits in flex header row. `fixed-corner`: floating on auth pages. */
  layout?: "fixed-corner" | "toolbar"
  variant?: "outline" | "ghost"
}) {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === "dark"

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  return (
    <Button
      variant={variant}
      size="icon"
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        layout === "fixed-corner" && "fixed top-4 right-4 z-50",
        layout === "toolbar" && "shrink-0",
        className
      )}
    >
      {isDark ? (
        <Moon className="size-4" aria-hidden />
      ) : (
        <Sun className="size-4" aria-hidden />
      )}
    </Button>
  )
}
