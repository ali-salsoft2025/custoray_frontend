"use client"

import { useTranslation } from "react-i18next"

import { formatDate, formatMoney, type ReturnLineReportRow } from "@/lib/returns-report"

export function ReturnLineDetail({ line }: { line: ReturnLineReportRow }) {
  const { t } = useTranslation("returns")

  return (
    <dl className="grid grid-cols-1 gap-4 text-sm">
      <div className="flex flex-col gap-1">
        <dt className="text-muted-foreground">{t("detail.item")}</dt>
        <dd className="font-medium">{line.productName}</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-muted-foreground">{t("detail.returnNumber")}</dt>
        <dd>{line.returnNumber}</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-muted-foreground">{t("detail.reference")}</dt>
        <dd>{line.referenceNumber}</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-muted-foreground">
          {line.type === "sales" ? t("detail.customer") : t("detail.vendor")}
        </dt>
        <dd>{line.partyName}</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-muted-foreground">{t("detail.date")}</dt>
        <dd>{formatDate(line.returnDate)}</dd>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <dt className="text-muted-foreground">{t("detail.quantity")}</dt>
          <dd className="tabular-nums">{line.quantity}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-muted-foreground">{t("detail.lineTotal")}</dt>
          <dd className="tabular-nums">{formatMoney(line.lineTotal)}</dd>
        </div>
      </div>
      {Number(line.refundDue) > 0 ? (
        <div className="flex flex-col gap-1">
          <dt className="text-muted-foreground">{t("detail.refundDueOnReturn")}</dt>
          <dd className="font-medium text-emerald-700 tabular-nums dark:text-emerald-400">
            {formatMoney(line.refundDue)}
          </dd>
        </div>
      ) : null}
      {Number(line.balanceDue) > 0 ? (
        <div className="flex flex-col gap-1">
          <dt className="text-muted-foreground">{t("detail.balanceDueOnReturn")}</dt>
          <dd className="font-medium text-amber-700 tabular-nums dark:text-amber-400">
            {formatMoney(line.balanceDue)}
          </dd>
        </div>
      ) : null}
    </dl>
  )
}
