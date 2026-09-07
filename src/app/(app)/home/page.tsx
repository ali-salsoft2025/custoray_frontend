"use client"

import { IconCircleCheck, IconTrash } from "@tabler/icons-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import {
  DataTable,
  getDefaultColumns,
  type DataTableTab,
  schema,
} from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { confirmDeleteAction } from "@/lib/confirm-action"
import { toast } from "sonner"
import data from "./data.json"
import type { z } from "zod"

type DocRow = z.infer<typeof schema>

function sectionTabFilter(row: DocRow, tab: string) {
  if (tab === "archived") return row.lifecycle === "archived"
  return row.lifecycle !== "archived"
}

export default function DashboardPage() {
  const { t, i18n } = useTranslation("common")

  const sectionTabs: DataTableTab[] = useMemo(
    () => [
      { value: "active", label: t("tabs.active") },
      { value: "archived", label: t("tabs.archived") },
    ],
    [t]
  )

  const columns = useMemo(() => getDefaultColumns(), [i18n.language])

  return (
    <div key={i18n.language} className="flex flex-col gap-4">
      <SectionCards />
      <ChartAreaInteractive />
      <DataTable
        data={data}
        columns={columns}
        showSearch={false}
        showFilters={false}
        showImportButton={false}
        showExportButton={false}
        showAddButton={false}
        bulkActions={[
          {
            id: "approve",
            label: t("actions.approveSelected"),
            icon: <IconCircleCheck className="size-4" />,
            onClick: (selected) => {
              toast.message(t("toast.approvedCount", { count: selected.length }))
            },
          },
          {
            id: "delete",
            label: t("actions.deleteSelected"),
            icon: <IconTrash className="size-4" />,
            variant: "destructive",
            onClick: async (selected) => {
              if (
                !(await confirmDeleteAction({
                  count: selected.length,
                  entityLabel: t("entity.section"),
                }))
              ) {
                return
              }
              toast.message(t("toast.wouldDeleteCount", { count: selected.length }))
            },
          },
        ]}
        tabs={sectionTabs}
        defaultTab="active"
        tabFilter={sectionTabFilter}
      />
    </div>
  )
}
