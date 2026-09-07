import * as XLSX from "xlsx"

import i18n from "@/i18n"
import { downloadBlob } from "@/lib/csv"
import { loadCompanySettings } from "@/lib/company-settings"
import type { OrderRow } from "@/lib/orders"
import type { PurchaseRow } from "@/lib/purchases"
import { getTaxDisplayProfile } from "@/lib/tax-region-config"
import type { TaxReportLine, TaxDateRange } from "@/lib/tax-reports"
import type { TaxSettings } from "@/lib/tax-settings"
import { manualEntryCategoryLabel } from "@/lib/tax-settings"

export type TaxExportMeta = {
  companyName: string
  currency: string
  termLabel: string
  businessTaxId: string
  accountantNotes: string
  generatedAt: string
}

export function buildTaxExportMeta(
  settings: TaxSettings,
  range: TaxDateRange
): TaxExportMeta {
  const company = loadCompanySettings()
  const profile = getTaxDisplayProfile(settings)
  return {
    companyName: company.name,
    currency: profile.currency,
    termLabel: range.label,
    businessTaxId: settings.businessTaxId.trim(),
    accountantNotes: settings.accountantNotes.trim(),
    generatedAt: new Date().toISOString(),
  }
}

function tx(key: string) {
  return i18n.t(key, { ns: "tax" })
}

function metaRows(meta: TaxExportMeta): Record<string, string>[] {
  const rows: Record<string, string>[] = [
    { [tx("export.field")]: tx("export.company"), [tx("export.value")]: meta.companyName },
    { [tx("export.field")]: tx("export.currency"), [tx("export.value")]: meta.currency },
    { [tx("export.field")]: tx("export.period"), [tx("export.value")]: meta.termLabel },
    { [tx("export.field")]: tx("export.generated"), [tx("export.value")]: meta.generatedAt },
  ]
  if (meta.businessTaxId) {
    rows.push({ [tx("export.field")]: tx("export.taxId"), [tx("export.value")]: meta.businessTaxId })
  }
  if (meta.accountantNotes) {
    rows.push({ [tx("export.field")]: tx("export.notes"), [tx("export.value")]: meta.accountantNotes })
  }
  return rows
}

function reportRows(lines: TaxReportLine[]) {
  return lines.map((row) => ({
    [tx("export.section")]: row.section,
    [tx("export.line")]: row.line,
    [tx("export.amount")]: row.amount,
    [tx("export.note")]: row.note ?? "",
  }))
}

export function downloadTaxReportXls(
  filename: string,
  meta: TaxExportMeta,
  lines: TaxReportLine[]
) {
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(metaRows(meta)), tx("export.sheetInfo"))
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(reportRows(lines)),
    tx("export.sheetReport")
  )
  const out = XLSX.write(wb, { type: "array", bookType: "xls" })
  downloadBlob(filename, new Blob([out], { type: "application/vnd.ms-excel" }))
}

export function downloadAccountantPack(input: {
  meta: TaxExportMeta
  profitAndLoss: TaxReportLine[]
  balanceSheet: TaxReportLine[]
  yearSummary: TaxReportLine[]
  monthly: Record<string, string | number>[]
  manualEntries: Record<string, string>[]
  sales: OrderRow[]
  purchases: PurchaseRow[]
}) {
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(metaRows(input.meta)),
    tx("export.sheetInfo")
  )
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(reportRows(input.profitAndLoss)),
    tx("export.sheetMoneyInOut")
  )
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(reportRows(input.balanceSheet)),
    tx("export.sheetOwnOwe")
  )
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(reportRows(input.yearSummary)),
    tx("export.sheetYearSummary")
  )
  if (input.manualEntries.length > 0) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(input.manualEntries),
      tx("export.sheetManual")
    )
  }
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(input.monthly),
    tx("export.sheetMonthly")
  )
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      input.sales.map((row) => ({
        [tx("export.invoice")]: row.invoiceNumber,
        [tx("export.date")]: row.orderDate,
        [tx("export.customer")]: row.customerName,
        [tx("export.status")]: row.status,
        [tx("export.total")]: row.totalAmount,
        [tx("export.paid")]: row.paidAmount,
      }))
    ),
    tx("export.sheetSales")
  )
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      input.purchases.map((row) => ({
        [tx("export.po")]: row.purchaseNumber,
        [tx("export.date")]: row.purchaseDate,
        [tx("export.vendor")]: row.vendorName,
        [tx("export.status")]: row.status,
        [tx("export.total")]: row.totalAmount,
        [tx("export.paid")]: row.paidAmount,
      }))
    ),
    tx("export.sheetPurchases")
  )
  const out = XLSX.write(wb, { type: "array", bookType: "xls" })
  downloadBlob(
    "tax-accountant-pack.xls",
    new Blob([out], { type: "application/vnd.ms-excel" })
  )
}

export { manualEntryCategoryLabel }
