"use client"

import { IconCircleCheck, IconTrash } from "@tabler/icons-react"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import {
  DataTable,
  defaultColumns,
  type DataTableTab,
  schema,
} from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { confirmDeleteAction } from "@/lib/confirm-action"
import { toast } from "sonner"
import data from "./data.json"
import type { z } from "zod"

type DocRow = z.infer<typeof schema>

const sectionTabs: DataTableTab[] = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
]

function sectionTabFilter(row: DocRow, tab: string) {
  if (tab === "archived") return row.lifecycle === "archived"
  return row.lifecycle !== "archived"
}

export default function DashboardPage() {
  return (
    <>
      <SectionCards />
      <ChartAreaInteractive />
      <DataTable
        data={data}
        columns={defaultColumns}
        showSearch={false}
        showFilters={false}
        showImportButton={false}
        showExportButton={false}
        showAddButton={false}
        bulkActions={[
          {
            id: "approve",
            label: "Approve selected",
            icon: <IconCircleCheck className="size-4" />,
            onClick: (selected) => {
              toast.message(`Approved ${selected.length} section(s) (demo).`)
            },
          },
          {
            id: "delete",
            label: "Delete selected",
            icon: <IconTrash className="size-4" />,
            variant: "destructive",
            onClick: async (selected) => {
              if (
                !(await confirmDeleteAction({
                  count: selected.length,
                  entityLabel: "section",
                }))
              ) {
                return
              }
              toast.message(`Would delete ${selected.length} section(s).`)
            },
          },
        ]}
        tabs={sectionTabs}
        defaultTab="active"
        tabFilter={sectionTabFilter}
      />
    </>
  )
}