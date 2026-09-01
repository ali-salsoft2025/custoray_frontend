import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const panelClass =
  "rounded-2xl bg-card shadow-sm shadow-black/[0.03] ring-1 ring-border/50"

function StatCardSkeleton() {
  return (
    <div className="bg-card flex flex-col gap-6 rounded-xl border py-6 shadow-xs">
      <div className="grid grid-cols-[1fr_auto] items-start gap-1.5 px-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="col-start-1 h-8 w-32" />
        <Skeleton className="col-start-2 row-span-2 row-start-1 h-6 w-16 justify-self-end rounded-full" />
      </div>
      <div className="space-y-2 px-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
  )
}

function ChartPanelSkeleton({
  className,
  chartClassName,
}: {
  className?: string
  chartClassName?: string
}) {
  return (
    <div className={cn(panelClass, "overflow-hidden p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className={cn("mt-5 w-full rounded-xl", chartClassName ?? "h-[320px]")} />
    </div>
  )
}

function RecentSalesSkeleton() {
  return (
    <div className={cn(panelClass, "overflow-hidden")}>
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-44" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="border-border/50 space-y-0 border-t px-4 py-2">
        <div className="flex gap-4 border-b py-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-3 flex-1" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 border-b py-3.5 last:border-0">
            <Skeleton className="h-4 w-20" />
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Skeleton className="size-8 shrink-0 rounded-lg" />
              <Skeleton className="h-4 w-32 max-w-full" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="ml-auto h-4 w-16" />
            <Skeleton className="h-4 w-14" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function SalesReportsSkeleton() {
  return (
    <div
      className="flex flex-col gap-6"
      aria-busy="true"
      aria-label="Loading sales reports"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="flex items-center justify-end gap-2">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>

      <ChartPanelSkeleton chartClassName="h-[320px]" />

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanelSkeleton chartClassName="h-[280px]" />
        <ChartPanelSkeleton chartClassName="h-[280px]" />
      </div>

      <RecentSalesSkeleton />
    </div>
  )
}
