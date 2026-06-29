import * as XLSX from "xlsx"

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

function metaRows(meta: TaxExportMeta): Record<string, string>[] {
  const rows: Record<string, string>[] = [
    { Field: "Company", Value: meta.companyName },
    { Field: "Currency", Value: meta.currency },
    { Field: "Period", Value: meta.termLabel },
    { Field: "Generated", Value: meta.generatedAt },
  ]
  if (meta.businessTaxId) {
    rows.push({ Field: "Tax ID", Value: meta.businessTaxId })
  }
  if (meta.accountantNotes) {
    rows.push({ Field: "Notes", Value: meta.accountantNotes })
  }
  return rows
}

export function downloadTaxReportXls(
  filename: string,
  meta: TaxExportMeta,
  lines: TaxReportLine[]
) {
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(metaRows(meta)), "Info")
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      lines.map((row) => ({
        Section: row.section,
        Line: row.line,
        Amount: row.amount,
        Note: row.note ?? "",
      }))
    ),
    "Report"
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
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(metaRows(input.meta)), "Info")
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      input.profitAndLoss.map((row) => ({
        Section: row.section,
        Line: row.line,
        Amount: row.amount,
        Note: row.note ?? "",
      }))
    ),
    "Money in vs out"
  )
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      input.balanceSheet.map((row) => ({
        Section: row.section,
        Line: row.line,
        Amount: row.amount,
        Note: row.note ?? "",
      }))
    ),
    "Own and owe"
  )
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      input.yearSummary.map((row) => ({
        Section: row.section,
        Line: row.line,
        Amount: row.amount,
        Note: row.note ?? "",
      }))
    ),
    "Year summary"
  )
  if (input.manualEntries.length > 0) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(input.manualEntries),
      "Manual entries"
    )
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(input.monthly), "Monthly")
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      input.sales.map((row) => ({
        Invoice: row.invoiceNumber,
        Date: row.orderDate,
        Customer: row.customerName,
        Status: row.status,
        Total: row.totalAmount,
        Paid: row.paidAmount,
      }))
    ),
    "Sales detail"
  )
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      input.purchases.map((row) => ({
        PO: row.purchaseNumber,
        Date: row.purchaseDate,
        Vendor: row.vendorName,
        Status: row.status,
        Total: row.totalAmount,
        Paid: row.paidAmount,
      }))
    ),
    "Purchase detail"
  )
  const out = XLSX.write(wb, { type: "array", bookType: "xls" })
  downloadBlob(
    "tax-accountant-pack.xls",
    new Blob([out], { type: "application/vnd.ms-excel" })
  )
}

export { manualEntryCategoryLabel }
