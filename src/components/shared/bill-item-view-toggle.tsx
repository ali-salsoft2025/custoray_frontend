"use client"

import { IconFileInvoice, IconListDetails } from "@tabler/icons-react"

import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { billItemViewModeLabel, type BillItemViewMode } from "@/lib/app-preferences"
import { cn } from "@/lib/utils"

export type BillItemViewOption = {
  value: BillItemViewMode
  description: string
}

type BillItemViewToggleProps = {
  value: BillItemViewMode
  onValueChange: (value: BillItemViewMode) => void
  className?: string
  variant?: "icons" | "labeled"
  ariaLabel?: string
  billDescription: string
  itemDescription: string
}

const selectedToggleClass =
  "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary data-[state=on]:hover:bg-primary/90 data-[state=on]:hover:text-primary-foreground data-[state=on]:shadow-sm"

export function BillItemViewToggle({
  value,
  onValueChange,
  className,
  variant = "icons",
  ariaLabel = "View mode",
  billDescription,
  itemDescription,
}: BillItemViewToggleProps) {
  const labeled = variant === "labeled"

  const viewOptions = [
    {
      value: "bill" as const,
      icon: IconFileInvoice,
      description: billDescription,
    },
    {
      value: "item" as const,
      icon: IconListDetails,
      description: itemDescription,
    },
  ]

  return (
    <div className={cn("space-y-2", className)}>
      {labeled ? (
        <Label className="text-muted-foreground block text-[11px] font-semibold tracking-wide uppercase">
          View mode
        </Label>
      ) : null}
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={value}
        onValueChange={(next) => {
          if (next === "bill" || next === "item") onValueChange(next)
        }}
        aria-label={ariaLabel}
        className="bg-background w-full"
      >
        {viewOptions.map(({ value: mode, icon: Icon, description }) => {
          if (labeled) {
            return (
              <ToggleGroupItem
                key={mode}
                value={mode}
                aria-label={billItemViewModeLabel(mode)}
                className={cn("h-9 flex-1 gap-1.5 px-3 font-medium", selectedToggleClass)}
              >
                <Icon className="size-4 shrink-0" />
                <span className="text-xs font-medium">{billItemViewModeLabel(mode)}</span>
              </ToggleGroupItem>
            )
          }

          return (
            <Tooltip key={mode}>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value={mode}
                  aria-label={billItemViewModeLabel(mode)}
                  className={cn("size-9 flex-1 px-0", selectedToggleClass)}
                >
                  <Icon className="size-4 shrink-0" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent side="bottom">{description}</TooltipContent>
            </Tooltip>
          )
        })}
      </ToggleGroup>
      {labeled ? (
        <p className="text-muted-foreground text-[11px] leading-relaxed">
          {viewOptions.find((option) => option.value === value)?.description}
        </p>
      ) : null}
    </div>
  )
}

export function BillItemViewTableOption({
  value,
  onValueChange,
  billDescription,
  itemDescription,
  ariaLabel,
}: {
  value: BillItemViewMode
  onValueChange: (value: BillItemViewMode) => void
  billDescription: string
  itemDescription: string
  ariaLabel?: string
}) {
  return (
    <BillItemViewToggle
      value={value}
      onValueChange={onValueChange}
      variant="labeled"
      billDescription={billDescription}
      itemDescription={itemDescription}
      ariaLabel={ariaLabel}
    />
  )
}
