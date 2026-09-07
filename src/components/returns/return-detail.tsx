"use client"

import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { formatDate, formatMoney, type ReturnRow } from "@/lib/returns"

function statusBadgeClass(status: ReturnRow["status"]) {
  if (status === "completed")
    return "border-emerald-500/30 px-1.5 text-emerald-700 dark:text-emerald-400"
  if (status === "pending")
    return "border-blue-500/30 px-1.5 text-blue-700 dark:text-blue-400"
  return "border-border px-1.5 text-muted-foreground"
}

export function ReturnDetail({ returnDoc }: { returnDoc: ReturnRow }) {
  const { t } = useTranslation("returns")
  const typeLabel =
    returnDoc.type === "sales" ? t("detail.salesReturn") : t("detail.purchaseReturn")

  return (
    <dl className="grid grid-cols-1 gap-4 text-sm">
      <div className="flex flex-col gap-1">
        <dt className="text-muted-foreground">{t("detail.type")}</dt>
        <dd>{typeLabel}</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-muted-foreground">{t("detail.reference")}</dt>
        <dd>{returnDoc.referenceNumber}</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-muted-foreground">
          {returnDoc.type === "sales" ? t("detail.customer") : t("detail.vendor")}
        </dt>
        <dd>{returnDoc.partyName}</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-muted-foreground">{t("detail.returnDate")}</dt>
        <dd>{formatDate(returnDoc.returnDate)}</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-muted-foreground">{t("detail.status")}</dt>
        <dd>
          <Badge variant="outline" className={statusBadgeClass(returnDoc.status)}>
            {t(`status.${returnDoc.status}`, { ns: "common" })}
          </Badge>
        </dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-muted-foreground">{t("detail.returnAmount")}</dt>
        <dd className="tabular-nums">{formatMoney(returnDoc.totalAmount)}</dd>
      </div>
      <div className="border-border/60 space-y-2 border-t pt-4">
        <p className="text-foreground font-medium">{t("detail.paymentImpact")}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <span className="text-muted-foreground">{t("detail.originalTotal")}</span>
          <span className="text-right tabular-nums">
            {formatMoney(returnDoc.sourceTotalBefore)}
          </span>
          <span className="text-muted-foreground">{t("detail.paid")}</span>
          <span className="text-right tabular-nums">
            {formatMoney(returnDoc.sourcePaidAmount)}
          </span>
          <span className="text-muted-foreground">{t("detail.newTotal")}</span>
          <span className="text-right tabular-nums">
            {formatMoney(returnDoc.sourceTotalAfter)}
          </span>
          {Number(returnDoc.refundDue) > 0 ? (
            <>
              <span className="text-muted-foreground">{t("detail.refundDue")}</span>
              <span className="text-right font-medium text-emerald-700 tabular-nums dark:text-emerald-400">
                {formatMoney(returnDoc.refundDue)}
              </span>
            </>
          ) : null}
          {Number(returnDoc.balanceDue) > 0 ? (
            <>
              <span className="text-muted-foreground">{t("detail.balanceDue")}</span>
              <span className="text-right font-medium text-amber-700 tabular-nums dark:text-amber-400">
                {formatMoney(returnDoc.balanceDue)}
              </span>
            </>
          ) : null}
        </div>
      </div>
      <div className="border-border/60 space-y-2 border-t pt-4">
        <p className="text-foreground font-medium">{t("detail.returnedItems")}</p>
        <ul className="space-y-2">
          {(returnDoc.lines ?? []).map((line) => (
            <li
              key={line.id}
              className="border-border/60 bg-muted/20 flex items-start justify-between gap-2 rounded-md border p-2"
            >
              <div>
                <p className="font-medium">{line.productName}</p>
                <p className="text-muted-foreground text-xs">
                  {t("detail.qtyTimes", {
                    qty: line.quantity,
                    price: formatMoney(line.unitPrice),
                  })}
                </p>
              </div>
              <span className="tabular-nums">{formatMoney(line.lineTotal)}</span>
            </li>
          ))}
        </ul>
      </div>
      {returnDoc.description !== "—" ? (
        <div className="flex flex-col gap-1">
          <dt className="text-muted-foreground">{t("detail.notes")}</dt>
          <dd>{returnDoc.description}</dd>
        </div>
      ) : null}
    </dl>
  )
}
