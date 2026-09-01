"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="top-right"
      closeButton
      offset={16}
      gap={10}
      duration={4000}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast w-[min(100%,22.5rem)] rounded-xl border bg-white text-zinc-900 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.2)]",
          title: "text-[13px] font-semibold tracking-tight",
          description: "text-[12px] leading-snug text-zinc-500",
          icon: "size-5",
          actionButton:
            "rounded-md bg-zinc-900 text-white text-xs font-medium",
          cancelButton:
            "rounded-md bg-zinc-100 text-zinc-700 text-xs font-medium",
          closeButton:
            "border-zinc-200/80 bg-white text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700",
          success:
            "!bg-emerald-50 !border-emerald-200 !text-emerald-950 [&_[data-icon]]:text-emerald-600 [&_[data-description]]:text-emerald-800/70",
          error:
            "!bg-rose-50 !border-rose-200 !text-rose-950 [&_[data-icon]]:text-rose-600 [&_[data-description]]:text-rose-800/70",
          warning:
            "!bg-amber-50 !border-amber-200 !text-amber-950 [&_[data-icon]]:text-amber-600 [&_[data-description]]:text-amber-800/70",
          info:
            "!bg-sky-50 !border-sky-200 !text-sky-950 [&_[data-icon]]:text-sky-600 [&_[data-description]]:text-sky-800/70",
        },
      }}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#18181b",
          "--normal-border": "#e4e4e7",
          "--success-bg": "#ecfdf5",
          "--success-text": "#064e3b",
          "--success-border": "#a7f3d0",
          "--error-bg": "#fff1f2",
          "--error-text": "#881337",
          "--error-border": "#fecdd3",
          "--warning-bg": "#fffbeb",
          "--warning-text": "#78350f",
          "--warning-border": "#fde68a",
          "--info-bg": "#f0f9ff",
          "--info-text": "#0c4a6e",
          "--info-border": "#bae6fd",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
