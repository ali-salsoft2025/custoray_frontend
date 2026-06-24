"use client"

import { formatDate, formatMoney, type ReturnLineReportRow } from "@/lib/returns-report"

export function ReturnLineDetail({ line }: { line: ReturnLineReportRow }) {
  return (
    <dl className="grid grid-cols-1 gap-4 text-sm">
      <div className="flex flex-col gap-1">
        <dt className="text-muted-foreground">Item</dt>
        <dd className="font-medium">{line.productName}</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-muted-foreground">Return #</dt>
        <dd>{line.returnNumber}</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-muted-foreground">Reference</dt>
        <dd>{line.referenceNumber}</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-muted-foreground">
          {line.type === "sales" ? "Customer" : "Vendor"}
        </dt>
        <dd>{line.partyName}</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-muted-foreground">Date</dt>
        <dd>{formatDate(line.returnDate)}</dd>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <dt className="text-muted-foreground">Quantity</dt>
          <dd className="tabular-nums">{line.quantity}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-muted-foreground">Line total</dt>
          <dd className="tabular-nums">{formatMoney(line.lineTotal)}</dd>
        </div>
      </div>
      {Number(line.refundDue) > 0 ? (
        <div className="flex flex-col gap-1">
          <dt className="text-muted-foreground">Refund due (on return)</dt>
          <dd className="font-medium text-emerald-700 tabular-nums dark:text-emerald-400">
            {formatMoney(line.refundDue)}
          </dd>
        </div>
      ) : null}
      {Number(line.balanceDue) > 0 ? (
        <div className="flex flex-col gap-1">
          <dt className="text-muted-foreground">Balance due (on return)</dt>
          <dd className="font-medium text-amber-700 tabular-nums dark:text-amber-400">
            {formatMoney(line.balanceDue)}
          </dd>
        </div>
      ) : null}
    </dl>
  )
}
