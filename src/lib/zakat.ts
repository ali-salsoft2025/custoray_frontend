import { z } from "zod"

import {
  computeBalance as computeCustomerBalance,
  type CustomerRow,
} from "@/lib/customers"
import type { ProductRow } from "@/lib/products"
import {
  computeBalance as computeVendorBalance,
  type VendorRow,
} from "@/lib/vendors"

export const ZAKAT_SETTINGS_STORAGE_KEY = "custoray-zakat-settings-v2"
export const ZAKAT_HISTORY_STORAGE_KEY = "custoray-zakat-history-v1"
export const LUNAR_YEAR_DAYS = 354

export const zakatSettingsSchema = z.object({
  lastPaidDate: z.string(),
  inventoryValuation: z.enum(["cost", "selling"]),
  rate: z.number().min(0).max(100),
  nisab: z.number().min(0),
  remindersEnabled: z.boolean(),
  notificationDays: z.number().int().min(1).max(365),
  cashBalance: z.number().min(0),
  bankBalance: z.number().min(0),
  expensesPayable: z.number().min(0),
  shortTermLoans: z.number().min(0),
  assetAdjustment: z.number().min(0),
  liabilityAdjustment: z.number().min(0),
})

export type ZakatSettings = z.infer<typeof zakatSettingsSchema>

export const DEFAULT_ZAKAT_SETTINGS: ZakatSettings = {
  lastPaidDate: "",
  inventoryValuation: "cost",
  rate: 2.5,
  nisab: 0,
  remindersEnabled: true,
  notificationDays: 30,
  cashBalance: 0,
  bankBalance: 0,
  expensesPayable: 0,
  shortTermLoans: 0,
  assetAdjustment: 0,
  liabilityAdjustment: 0,
}

export type ZakatInventoryLine = {
  productId: number
  sku: string
  name: string
  category: string
  quantity: number
  unitValue: number
  totalValue: number
}

export type ZakatAssets = {
  cash: number
  bank: number
  inventory: number
  receivables: number
  manualAdjustment: number
  total: number
}

export type ZakatLiabilities = {
  supplierPayables: number
  expensesPayable: number
  shortTermLoans: number
  manualAdjustment: number
  total: number
}

export type ZakatCalculation = {
  calculatedAt: string
  inventoryLines: ZakatInventoryLine[]
  inventoryUnits: number
  assets: ZakatAssets
  liabilities: ZakatLiabilities
  netAssets: number
  rate: number
  nisab: number
  reachesNisab: boolean
  estimatedZakat: number
}

const historyRecordSchema = z.object({
  id: z.number(),
  calculationDate: z.string(),
  paymentDate: z.string(),
  amountPaid: z.number(),
  reference: z.string(),
  notes: z.string(),
  snapshot: z.object({
    assets: z.object({
      cash: z.number(),
      bank: z.number(),
      inventory: z.number(),
      receivables: z.number(),
      manualAdjustment: z.number(),
      total: z.number(),
    }),
    liabilities: z.object({
      supplierPayables: z.number(),
      expensesPayable: z.number(),
      shortTermLoans: z.number(),
      manualAdjustment: z.number(),
      total: z.number(),
    }),
    netAssets: z.number(),
    rate: z.number(),
    nisab: z.number(),
    estimatedZakat: z.number(),
    inventoryValuation: z.enum(["cost", "selling"]),
  }),
})

export type ZakatHistoryRecord = z.infer<typeof historyRecordSchema>

export type FinalizeZakatInput = {
  paymentDate: string
  amountPaid: number
  reference: string
  notes: string
}

export function nonNegativeNumber(value: string | number): number {
  const parsed =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/[^0-9.-]/g, ""))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

export function formatZakatMoney(value: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(nonNegativeNumber(value))
}

export function formatZakatDate(value: string): string {
  if (!value) return "Not recorded"
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

export function addLunarYear(value: string): string {
  if (!value) return ""
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return ""
  date.setDate(date.getDate() + LUNAR_YEAR_DAYS)
  return date.toISOString().slice(0, 10)
}

export function daysSince(value: string, now = new Date()): number | null {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  return Math.max(
    0,
    Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000))
  )
}

export function buildInventoryLines(
  products: ProductRow[],
  valuation: ZakatSettings["inventoryValuation"]
): ZakatInventoryLine[] {
  return products
    .filter((product) => product.lifecycle === "active" && product.stock > 0)
    .map((product) => {
      const quantity = nonNegativeNumber(product.stock)
      const unitValue = nonNegativeNumber(
        valuation === "cost" ? product.costPrice : product.salePrice
      )
      return {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        category: product.category,
        quantity,
        unitValue,
        totalValue: quantity * unitValue,
      }
    })
    .filter((line) => line.totalValue > 0)
    .sort((a, b) => b.totalValue - a.totalValue)
}

export function computeBusinessZakat(input: {
  products: ProductRow[]
  customers: CustomerRow[]
  vendors: VendorRow[]
  settings: ZakatSettings
  calculatedAt?: string
}): ZakatCalculation {
  const { products, customers, vendors, settings } = input
  const inventoryLines = buildInventoryLines(
    products,
    settings.inventoryValuation
  )
  const inventory = inventoryLines.reduce(
    (total, line) => total + line.totalValue,
    0
  )
  const receivables = customers.reduce((total, customer) => {
    const balance = Number(computeCustomerBalance(customer))
    return total + (Number.isFinite(balance) && balance > 0 ? balance : 0)
  }, 0)
  const supplierPayables = vendors.reduce((total, vendor) => {
    const balance = Number(computeVendorBalance(vendor))
    return total + (Number.isFinite(balance) && balance > 0 ? balance : 0)
  }, 0)
  const assets: ZakatAssets = {
    cash: nonNegativeNumber(settings.cashBalance),
    bank: nonNegativeNumber(settings.bankBalance),
    inventory,
    receivables,
    manualAdjustment: nonNegativeNumber(settings.assetAdjustment),
    total: 0,
  }
  assets.total =
    assets.cash +
    assets.bank +
    assets.inventory +
    assets.receivables +
    assets.manualAdjustment

  const liabilities: ZakatLiabilities = {
    supplierPayables,
    expensesPayable: nonNegativeNumber(settings.expensesPayable),
    shortTermLoans: nonNegativeNumber(settings.shortTermLoans),
    manualAdjustment: nonNegativeNumber(settings.liabilityAdjustment),
    total: 0,
  }
  liabilities.total =
    liabilities.supplierPayables +
    liabilities.expensesPayable +
    liabilities.shortTermLoans +
    liabilities.manualAdjustment

  const netAssets = Math.max(assets.total - liabilities.total, 0)
  const rate = Math.min(100, nonNegativeNumber(settings.rate))
  const nisab = nonNegativeNumber(settings.nisab)

  return {
    calculatedAt: input.calculatedAt ?? new Date().toISOString(),
    inventoryLines,
    inventoryUnits: inventoryLines.reduce(
      (total, line) => total + line.quantity,
      0
    ),
    assets,
    liabilities,
    netAssets,
    rate,
    nisab,
    reachesNisab: nisab > 0 && netAssets >= nisab,
    estimatedZakat: netAssets * (rate / 100),
  }
}

export function createHistoryRecord(
  id: number,
  calculation: ZakatCalculation,
  settings: ZakatSettings,
  payment: FinalizeZakatInput
): ZakatHistoryRecord {
  return {
    id,
    calculationDate: calculation.calculatedAt,
    paymentDate: payment.paymentDate,
    amountPaid: nonNegativeNumber(payment.amountPaid),
    reference: payment.reference.trim(),
    notes: payment.notes.trim(),
    snapshot: {
      assets: { ...calculation.assets },
      liabilities: { ...calculation.liabilities },
      netAssets: calculation.netAssets,
      rate: calculation.rate,
      nisab: calculation.nisab,
      estimatedZakat: calculation.estimatedZakat,
      inventoryValuation: settings.inventoryValuation,
    },
  }
}

export function parseZakatSettings(raw: string | null): ZakatSettings | null {
  if (!raw) return null
  try {
    const result = zakatSettingsSchema.safeParse(JSON.parse(raw))
    return result.success ? result.data : null
  } catch {
    return null
  }
}

export function parseZakatHistory(
  raw: string | null
): ZakatHistoryRecord[] | null {
  if (!raw) return null
  try {
    const result = z.array(historyRecordSchema).safeParse(JSON.parse(raw))
    return result.success ? result.data : null
  } catch {
    return null
  }
}
