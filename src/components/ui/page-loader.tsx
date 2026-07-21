import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { cn } from "@/lib/utils"

export function PageLoader({
  message,
  className,
  fullScreen = false,
}: {
  message?: string
  className?: string
  /** Cover the entire viewport (e.g. initial app load). */
  fullScreen?: boolean
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-5 p-8",
        fullScreen
          ? "bg-background/90 fixed inset-0 z-50 backdrop-blur-sm"
          : "min-h-[40vh] flex-1",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <LoadingSpinner
        size="xl"
        className="size-25 -translate-y-3"
        label={message ?? "Loading page"}
      />
    </div>
  )
}
