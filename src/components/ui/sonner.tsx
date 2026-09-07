"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme()

  return (
    <Sonner
      theme={(resolvedTheme === "dark" ? "dark" : "light") as ToasterProps["theme"]}
      position="top-right"
      closeButton
      offset={16}
      gap={10}
      duration={4000}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast w-[min(100%,22.5rem)] rounded-xl border border-border bg-background text-foreground shadow-lg",
          title: "text-[13px] font-semibold tracking-tight text-foreground",
          description: "text-[12px] leading-snug text-muted-foreground",
          icon: "size-5",
          actionButton:
            "rounded-md bg-primary text-primary-foreground text-xs font-medium",
          cancelButton:
            "rounded-md bg-muted text-muted-foreground text-xs font-medium",
          closeButton:
            "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
          success:
            "!bg-emerald-50 !border-emerald-200/80 !text-emerald-950 dark:!bg-emerald-950/40 dark:!border-emerald-800 dark:!text-emerald-100 [&_[data-icon]]:text-emerald-600 dark:[&_[data-icon]]:text-emerald-400 [&_[data-description]]:text-emerald-800/70 dark:[&_[data-description]]:text-emerald-200/70",
          error:
            "!bg-rose-50 !border-rose-200/80 !text-rose-950 dark:!bg-rose-950/40 dark:!border-rose-800 dark:!text-rose-100 [&_[data-icon]]:text-rose-600 dark:[&_[data-icon]]:text-rose-400 [&_[data-description]]:text-rose-800/70 dark:[&_[data-description]]:text-rose-200/70",
          warning:
            "!bg-amber-50 !border-amber-200/80 !text-amber-950 dark:!bg-amber-950/40 dark:!border-amber-800 dark:!text-amber-100 [&_[data-icon]]:text-amber-600 dark:[&_[data-icon]]:text-amber-400 [&_[data-description]]:text-amber-800/70 dark:[&_[data-description]]:text-amber-200/70",
          info:
            "!bg-sky-50 !border-sky-200/80 !text-sky-950 dark:!bg-sky-950/40 dark:!border-sky-800 dark:!text-sky-100 [&_[data-icon]]:text-sky-600 dark:[&_[data-icon]]:text-sky-400 [&_[data-description]]:text-sky-800/70 dark:[&_[data-description]]:text-sky-200/70",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
