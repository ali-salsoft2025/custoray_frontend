"use client"

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
      <div className="flex flex-wrap items-center justify-between gap-2">
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

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-[9rem] px-3">Module</TableHead>
              {(["add", "edit", "delete"] as const).map((action) => (
                <TableHead key={action} className="w-20 px-2 text-center capitalize">
                  <div className="flex flex-col items-center gap-1.5 py-1">
                    <span>{action}</span>
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
              <TableHead className="w-16 px-2 text-center">All</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MODULE_IDS.map((moduleId) => {
              const row = effective.modules[moduleId]
              return (
                <TableRow key={moduleId}>
                  <TableCell className="px-3 py-2.5 font-medium">
                    {MODULE_LABELS[moduleId]}
                  </TableCell>
                  {(["add", "edit", "delete"] as const).map((action) => (
                    <TableCell key={action} className="px-2 py-2.5 text-center">
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
                  <TableCell className="px-2 py-2.5 text-center">
                    <div className="flex justify-center">
                      <Checkbox
                        aria-label={`${MODULE_LABELS[moduleId]} all`}
                        checked={isModuleFullySelected(value, moduleId)}
                        disabled={locked}
                        onCheckedChange={(checked) =>
                          onChange(setModuleAll(value, moduleId, checked === true))
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
