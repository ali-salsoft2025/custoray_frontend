"use client"

import { IconInfoCircle } from "@tabler/icons-react"

import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  FULL_PERMISSIONS,
  MODULE_IDS,
  MODULE_LABELS,
  effectivePermissions,
  fullModuleMap,
  isActionFullySelected,
  isModuleFullySelected,
  setActionAll,
  setAllPermissions,
  setModuleAction,
  setModuleAll,
  type EmployeePermissions,
  type ModulePermission,
} from "@/lib/employee-permissions"
import { cn } from "@/lib/utils"

const ACTION_LABELS: Record<keyof ModulePermission, string> = {
  add: "Add",
  edit: "Edit",
  delete: "Delete",
}

const ACTION_HINTS: Record<keyof ModulePermission, string> = {
  add: "Create new records in this module",
  edit: "View and modify existing records",
  delete: "Remove records permanently",
}

type EmployeePermissionsMatrixProps = {
  value: EmployeePermissions
  onChange: (next: EmployeePermissions) => void
  disabled?: boolean
  className?: string
}

export function EmployeePermissionsMatrix({
  value,
  onChange,
  disabled,
  className,
}: EmployeePermissionsMatrixProps) {
  const effective = effectivePermissions(value)
  const isAdmin = effective.admin
  const locked = disabled || isAdmin

  const allSelected =
    isAdmin ||
    (isActionFullySelected(value, "add") &&
      isActionFullySelected(value, "edit") &&
      isActionFullySelected(value, "delete"))

  const toggleCell = (
    moduleId: (typeof MODULE_IDS)[number],
    action: keyof ModulePermission,
    checked: boolean
  ) => {
    if (locked) return
    onChange(setModuleAction(value, moduleId, action, checked))
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <Checkbox
            id="perm-admin"
            checked={isAdmin}
            disabled={disabled}
            onCheckedChange={(checked) =>
              onChange(
                checked === true
                  ? FULL_PERMISSIONS
                  : { admin: false, modules: fullModuleMap() }
              )
            }
          />
          <label htmlFor="perm-admin" className="text-sm font-medium leading-none">
            Admin (full access)
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="perm-select-all"
            checked={allSelected}
            disabled={locked}
            onCheckedChange={(checked) =>
              onChange(setAllPermissions(value, checked === true))
            }
          />
          <label
            htmlFor="perm-select-all"
            className="text-muted-foreground text-sm leading-none"
          >
            Select all
          </label>
        </div>
      </div>

      {isAdmin ? (
        <div className="bg-muted/50 flex items-start gap-2 rounded-md px-3 py-2 text-sm">
          <IconInfoCircle className="text-muted-foreground mt-0.5 size-4 shrink-0" />
          <p className="text-muted-foreground leading-relaxed">
            Admin unlocked everything. Uncheck admin to edit modules.
          </p>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-md border border-border/60">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-[8rem] px-3">Module</TableHead>
              {(["add", "edit", "delete"] as const).map((action) => (
                <TableHead key={action} className="w-20 px-2 text-center">
                  <div className="flex flex-col items-center gap-1.5 py-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex cursor-help items-center gap-1 text-xs capitalize">
                          {ACTION_LABELS[action]}
                          <IconInfoCircle className="text-muted-foreground size-3" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        {ACTION_HINTS[action]}
                      </TooltipContent>
                    </Tooltip>
                    <Checkbox
                      aria-label={`Select all ${action}`}
                      checked={isActionFullySelected(value, action)}
                      disabled={locked}
                      onCheckedChange={(checked) =>
                        onChange(setActionAll(value, action, checked === true))
                      }
                    />
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-14 px-2 text-center text-xs">All</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MODULE_IDS.map((moduleId) => {
              const row = effective.modules[moduleId]
              const hasAny = row.add || row.edit || row.delete
              return (
                <TableRow
                  key={moduleId}
                  className={cn(hasAny && !isAdmin && "bg-muted/30")}
                >
                  <TableCell className="px-3 py-2 text-sm font-medium">
                    {MODULE_LABELS[moduleId]}
                  </TableCell>
                  {(["add", "edit", "delete"] as const).map((action) => (
                    <TableCell key={action} className="px-2 py-2 text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          aria-label={`${MODULE_LABELS[moduleId]} ${action}`}
                          checked={row[action]}
                          disabled={locked}
                          onCheckedChange={(checked) =>
                            toggleCell(moduleId, action, checked === true)
                          }
                        />
                      </div>
                    </TableCell>
                  ))}
                  <TableCell className="px-2 py-2 text-center">
                    <div className="flex justify-center">
                      <Checkbox
                        aria-label={`${MODULE_LABELS[moduleId]} all`}
                        checked={isModuleFullySelected(value, moduleId)}
                        disabled={locked}
                        onCheckedChange={(checked) =>
                          onChange(
                            setModuleAll(value, moduleId, checked === true)
                          )
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
