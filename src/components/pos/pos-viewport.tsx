"use client"

import * as React from "react"

export function PosViewport({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:h-[calc(100vh-8rem)]">
      {children}
    </div>
  )
}
