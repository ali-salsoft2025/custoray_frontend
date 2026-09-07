import { computeBalance as computeCustomerBalance, type CustomerRow } from "@/lib/customers"
import type { TermListEntry } from "@/lib/fiscal-terms"
import { formatShortDate } from "@/lib/fiscal-terms"
import type { OrderRow } from "@/lib/orders"
import type { PaymentRow } from "@/lib/payments"
import type { ProductRow } from "@/lib/products"
import type { PurchaseRow } from "@/lib/purchases"
import type { ReturnRow } from "@/lib/returns"
import type { TaxManualEntry } from "@/lib/tax-settings"
import { formatTaxMoney, type TaxMoneyProfile } from "@/lib/tax-region-config"
import { computeBalance as computeVendorBalance, type VendorRow } from "@/lib/vendors"
import i18n from "@/i18n"

export type TaxDateRange = {
  start: string
  end: string
  label: string
}

export type TaxProfitAndLoss = {
  grossRevenue: number
  salesReturns: number
  netRevenue: number
  manualIncome: number
  purchases: number
  purchaseReturns: number
  netPurchases: number
  manualExpenses: number
  grossProfitEstimate: number
  estimatedTax: number
  showTaxEstimate: boolean
}

export type TaxBalanceSheet = {
  accountsReceivable: number
  inventoryValue: number
  cashMovement: number
  manualAssets: number
  totalAssets: number
  accountsPayable: number
  manualLiabilities: number
  estimatedEquity: number
}

export type TaxMonthlyRow = {
  month: string
  label: string
  revenue: number
  expenses: number
  net: number
}

export type TaxPartyRow = {
  name: string
  total: number
  count: number
}

export type TaxYearSummary = {
  profitAndLoss: TaxProfitAndLoss
  balanceSheet: TaxBalanceSheet
  counts: {
    salesInvoices: number
    purchaseOrders: number
    salesReturns: number
    purchaseReturns: number
    customerPayments: number
    vendorPayments: number
    pendingSales: number
    pendingPurchases: number
  }
  monthly: TaxMonthlyRow[]
  topCustomers: TaxPartyRow[]
  topVendors: TaxPartyRow[]
}

export type TaxReportBundle = {
  range: TaxDateRange
  profitAndLoss: TaxProfitAndLoss
  balanceSheet: TaxBalanceSheet
  yearSummary: TaxYearSummary
  manualEntries: TaxManualEntry[]
}

function sumManualByCategory(entries: TaxManualEntry[], category: TaxManualEntry["category"]) {
  return entries
    .filter((entry) => entry.category === category)
    .reduce((acc, entry) => acc + (Number(entry.amount) || 0), 0)
}

export function applyManualEntries(
  pl: TaxProfitAndLoss,
  bs: TaxBalanceSheet,
  entries: TaxManualEntry[],
  estimatedTaxRatePercent: number
): { profitAndLoss: TaxProfitAndLoss; balanceSheet: TaxBalanceSheet } {
  const manualIncome = sumManualByCategory(entries, "extra_income")
  const manualExpenses = sumManualByCategory(entries, "extra_expense")
  const manualAssets = sumManualByCategory(entries, "other_asset")
  const manualLiabilities = sumManualByCategory(entries, "other_liability")

  const adjustedNetRevenue = pl.netRevenue + manualIncome
  const adjustedNetPurchases = pl.netPurchases + manualExpenses
  const showTaxEstimate = estimatedTaxRatePercent > 0

  const adjustedPl: TaxProfitAndLoss = {
    ...pl,
    manualIncome,
    manualExpenses,
    netRevenue: adjustedNetRevenue,
    netPurchases: adjustedNetPurchases,
    grossProfitEstimate: adjustedNetRevenue - adjustedNetPurchases,
    showTaxEstimate,
    estimatedTax: showTaxEstimate
      ? (adjustedNetRevenue * estimatedTaxRatePercent) / 100
      : 0,
  }

  const totalAssets =
    bs.accountsReceivable +
    bs.inventoryValue +
    Math.max(bs.cashMovement, 0) +
    manualAssets
  const accountsPayable = bs.accountsPayable + manualLiabilities

  return {
    profitAndLoss: adjustedPl,
    balanceSheet: {
      ...bs,
      manualAssets,
      manualLiabilities,
      totalAssets,
      accountsPayable,
      estimatedEquity: totalAssets - accountsPayable,
    },
  }
}

function sumAmounts(values: string[]): number {
  return values.reduce((acc, value) => {
    const parsed = Number(value)
    return acc + (Number.isFinite(parsed) ? parsed : 0)
  }, 0)
}

function toIsoDate(iso: string): string {
  return iso.slice(0, 10)
}

export function getTermDateRange(
  term: TermListEntry,
  plannedEndIso: string
): TaxDateRange {
  const start = toIsoDate(term.startedAt)
  const end = term.isActive
    ? toIsoDate(plannedEndIso)
    : term.closedAt
      ? toIsoDate(term.closedAt)
      : toIsoDate(plannedEndIso)

  const startLabel = formatShortDate(term.startedAt)
  const endLabel = term.isActive
    ? formatShortDate(plannedEndIso)
    : term.closedAt
      ? formatShortDate(term.closedAt)
      : formatShortDate(plannedEndIso)

  return {
    start,
    end,
    label: `${startLabel} – ${endLabel}`,
  }
}

export function filterByDateRange<T>(
  rows: T[],
  getDate: (row: T) => string,
  range: TaxDateRange
): T[] {
  return rows.filter((row) => {
    const date = toIsoDate(getDate(row))
    return date >= range.start && date <= range.end
  })
}

function completedOrdersInRange(orders: OrderRow[], range: TaxDateRange) {
  return filterByDateRange(
    orders.filter((order) => order.status === "completed"),
    (order) => order.orderDate,
    range
  )
}

function completedPurchasesInRange(purchases: PurchaseRow[], range: TaxDateRange) {
  return filterByDateRange(
    purchases.filter((purchase) => purchase.status === "completed"),
    (purchase) => purchase.purchaseDate,
    range
  )
}

function completedReturnsInRange(
  returns: ReturnRow[],
  range: TaxDateRange,
  type?: ReturnRow["type"]
) {
  return filterByDateRange(
    returns.filter(
      (row) => row.status === "completed" && (type ? row.type === type : true)
    ),
    (row) => row.returnDate,
    range
  )
}

function completedPaymentsInRange(
  payments: PaymentRow[],
  range: TaxDateRange,
  type?: PaymentRow["type"]
) {
  return filterByDateRange(
    payments.filter(
      (payment) =>
        payment.status === "completed" && (type ? payment.type === type : true)
    ),
    (payment) => payment.paymentDate,
    range
  )
}

export function computeProfitAndLoss(
  orders: OrderRow[],
  purchases: PurchaseRow[],
  returns: ReturnRow[],
  estimatedTaxRatePercent: number,
  range: TaxDateRange
): TaxProfitAndLoss {
  const sales = completedOrdersInRange(orders, range)
  const salesReturnRows = completedReturnsInRange(returns, range, "sales")
  const purchaseRows = completedPurchasesInRange(purchases, range)
  const purchaseReturnRows = completedReturnsInRange(returns, range, "purchase")

  const grossRevenue = sumAmounts(sales.map((row) => row.totalAmount))
  const salesReturns = sumAmounts(salesReturnRows.map((row) => row.totalAmount))
  const netRevenue = grossRevenue - salesReturns
  const purchaseTotal = sumAmounts(purchaseRows.map((row) => row.totalAmount))
  const purchaseReturns = sumAmounts(purchaseReturnRows.map((row) => row.totalAmount))
  const netPurchases = purchaseTotal - purchaseReturns
  const grossProfitEstimate = netRevenue - netPurchases
  const showTaxEstimate = estimatedTaxRatePercent > 0
  const estimatedTax = showTaxEstimate
    ? (netRevenue * estimatedTaxRatePercent) / 100
    : 0

  return {
    grossRevenue,
    salesReturns,
    netRevenue,
    manualIncome: 0,
    purchases: purchaseTotal,
    purchaseReturns,
    netPurchases,
    manualExpenses: 0,
    grossProfitEstimate,
    estimatedTax,
    showTaxEstimate,
  }
}

export function computeInventoryValue(products: ProductRow[]): number {
  return products.reduce((acc, product) => {
    const cost = Number(product.costPrice)
    const stock = Number.isFinite(product.stock) ? product.stock : 0
    return acc + (Number.isFinite(cost) ? cost : 0) * stock
  }, 0)
}

export function computeBalanceSheet(
  customers: CustomerRow[],
  vendors: VendorRow[],
  products: ProductRow[],
  payments: PaymentRow[],
  range: TaxDateRange
): TaxBalanceSheet {
  const accountsReceivable = customers.reduce((acc, customer) => {
    const balance = Number(computeCustomerBalance(customer))
    return acc + (Number.isFinite(balance) && balance > 0 ? balance : 0)
  }, 0)

  const accountsPayable = vendors.reduce((acc, vendor) => {
    const balance = Number(computeVendorBalance(vendor))
    return acc + (Number.isFinite(balance) && balance > 0 ? balance : 0)
  }, 0)

  const customerPayments = completedPaymentsInRange(payments, range, "customer")
  const vendorPayments = completedPaymentsInRange(payments, range, "vendor")
  const cashIn = sumAmounts(customerPayments.map((row) => row.amount))
  const cashOut = sumAmounts(vendorPayments.map((row) => row.amount))
  const cashMovement = cashIn - cashOut
  const inventoryValue = computeInventoryValue(products)
  const totalAssets = accountsReceivable + inventoryValue + Math.max(cashMovement, 0)
  const estimatedEquity = totalAssets - accountsPayable

  return {
    accountsReceivable,
    inventoryValue,
    cashMovement,
    manualAssets: 0,
    totalAssets,
    accountsPayable,
    manualLiabilities: 0,
    estimatedEquity,
  }
}

function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7)
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-")
  const date = new Date(Number(year), Number(month) - 1, 1)
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(date)
}

function buildMonthlyBreakdown(
  orders: OrderRow[],
  purchases: PurchaseRow[],
  range: TaxDateRange
): TaxMonthlyRow[] {
  const buckets = new Map<string, { revenue: number; expenses: number }>()

  for (const order of completedOrdersInRange(orders, range)) {
    const key = monthKey(order.orderDate)
    const current = buckets.get(key) ?? { revenue: 0, expenses: 0 }
    current.revenue += Number(order.totalAmount) || 0
    buckets.set(key, current)
  }

  for (const purchase of completedPurchasesInRange(purchases, range)) {
    const key = monthKey(purchase.purchaseDate)
    const current = buckets.get(key) ?? { revenue: 0, expenses: 0 }
    current.expenses += Number(purchase.totalAmount) || 0
    buckets.set(key, current)
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, values]) => ({
      month,
      label: monthLabel(month),
      revenue: values.revenue,
      expenses: values.expenses,
      net: values.revenue - values.expenses,
    }))
}

function topPartiesByAmount(
  rows: { name: string; amount: string }[]
): TaxPartyRow[] {
  const map = new Map<string, { total: number; count: number }>()
  for (const row of rows) {
    const current = map.get(row.name) ?? { total: 0, count: 0 }
    current.total += Number(row.amount) || 0
    current.count += 1
    map.set(row.name, current)
  }
  return [...map.entries()]
    .map(([name, stats]) => ({ name, total: stats.total, count: stats.count }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
}

export function computeYearSummary(
  orders: OrderRow[],
  purchases: PurchaseRow[],
  returns: ReturnRow[],
  payments: PaymentRow[],
  customers: CustomerRow[],
  vendors: VendorRow[],
  products: ProductRow[],
  estimatedTaxRatePercent: number,
  range: TaxDateRange
): TaxYearSummary {
  const profitAndLoss = computeProfitAndLoss(
    orders,
    purchases,
    returns,
    estimatedTaxRatePercent,
    range
  )
  const balanceSheet = computeBalanceSheet(
    customers,
    vendors,
    products,
    payments,
    range
  )

  const salesInRange = filterByDateRange(orders, (row) => row.orderDate, range)
  const purchasesInRange = filterByDateRange(
    purchases,
    (row) => row.purchaseDate,
    range
  )
  const returnsInRange = filterByDateRange(returns, (row) => row.returnDate, range)
  const customerPayments = completedPaymentsInRange(payments, range, "customer")
  const vendorPayments = completedPaymentsInRange(payments, range, "vendor")

  return {
    profitAndLoss,
    balanceSheet,
    counts: {
      salesInvoices: salesInRange.length,
      purchaseOrders: purchasesInRange.length,
      salesReturns: returnsInRange.filter((row) => row.type === "sales").length,
      purchaseReturns: returnsInRange.filter((row) => row.type === "purchase").length,
      customerPayments: customerPayments.length,
      vendorPayments: vendorPayments.length,
      pendingSales: salesInRange.filter((row) => row.status === "pending").length,
      pendingPurchases: purchasesInRange.filter((row) => row.status === "pending")
        .length,
    },
    monthly: buildMonthlyBreakdown(orders, purchases, range),
    topCustomers: topPartiesByAmount(
      completedOrdersInRange(orders, range).map((row) => ({
        name: row.customerName,
        amount: row.totalAmount,
      }))
    ),
    topVendors: topPartiesByAmount(
      completedPurchasesInRange(purchases, range).map((row) => ({
        name: row.vendorName,
        amount: row.totalAmount,
      }))
    ),
  }
}

export function computeTaxReportBundle(
  input: {
    orders: OrderRow[]
    purchases: PurchaseRow[]
    returns: ReturnRow[]
    payments: PaymentRow[]
    customers: CustomerRow[]
    vendors: VendorRow[]
    products: ProductRow[]
    estimatedTaxRatePercent: number
    manualEntries: TaxManualEntry[]
    term: TermListEntry
    plannedEndIso: string
  }
): TaxReportBundle {
  const range = getTermDateRange(input.term, input.plannedEndIso)
  const basePl = computeProfitAndLoss(
    input.orders,
    input.purchases,
    input.returns,
    input.estimatedTaxRatePercent,
    range
  )
  const baseBs = computeBalanceSheet(
    input.customers,
    input.vendors,
    input.products,
    input.payments,
    range
  )
  const { profitAndLoss, balanceSheet } = applyManualEntries(
    basePl,
    baseBs,
    input.manualEntries,
    input.estimatedTaxRatePercent
  )

  const yearSummaryBase = computeYearSummary(
    input.orders,
    input.purchases,
    input.returns,
    input.payments,
    input.customers,
    input.vendors,
    input.products,
    input.estimatedTaxRatePercent,
    range
  )

  return {
    range,
    profitAndLoss,
    balanceSheet,
    yearSummary: {
      ...yearSummaryBase,
      profitAndLoss,
      balanceSheet,
    },
    manualEntries: input.manualEntries,
  }
}

export type TaxReportLine = {
  section: string
  line: string
  amount: string
  note?: string
}

export function profitAndLossToRows(
  pl: TaxProfitAndLoss,
  profile: TaxMoneyProfile,
  salesTaxLabel: string,
  manualEntries: TaxManualEntry[] = []
): TaxReportLine[] {
  const t = (key: string, options?: Record<string, unknown>) =>
    i18n.t(key, { ns: "tax", ...options })
  const fmt = (value: number) => formatTaxMoney(value, profile)
  const rows: TaxReportLine[] = [
    {
      section: t("rows.moneyIn"),
      line: t("rows.salesFromRecords"),
      amount: fmt(pl.grossRevenue),
      note: t("rows.completedSalesNote"),
    },
    {
      section: t("rows.moneyIn"),
      line: t("rows.salesReturns"),
      amount: fmt(-pl.salesReturns),
    },
  ]

  for (const entry of manualEntries.filter((e) => e.category === "extra_income")) {
    rows.push({
      section: t("rows.moneyIn"),
      line: entry.label,
      amount: fmt(Number(entry.amount) || 0),
      note: entry.note || t("rows.addedByYou"),
    })
  }

  rows.push({
    section: t("rows.moneyIn"),
    line: t("rows.totalMoneyIn"),
    amount: fmt(pl.netRevenue),
  })

  rows.push(
    {
      section: t("rows.moneyOut"),
      line: t("rows.purchasesFromRecords"),
      amount: fmt(pl.purchases),
      note: t("rows.completedPurchasesNote"),
    },
    {
      section: t("rows.moneyOut"),
      line: t("rows.purchaseReturns"),
      amount: fmt(-pl.purchaseReturns),
    }
  )

  for (const entry of manualEntries.filter((e) => e.category === "extra_expense")) {
    rows.push({
      section: t("rows.moneyOut"),
      line: entry.label,
      amount: fmt(Number(entry.amount) || 0),
      note: entry.note || t("rows.addedByYou"),
    })
  }

  rows.push(
    {
      section: t("rows.moneyOut"),
      line: t("rows.totalMoneyOut"),
      amount: fmt(pl.netPurchases),
    },
    {
      section: t("rows.bottomLine"),
      line: t("rows.whatYouKept"),
      amount: fmt(pl.grossProfitEstimate),
      note: t("rows.shareWithAccountant"),
    }
  )

  if (pl.showTaxEstimate) {
    rows.push({
      section: t("rows.bottomLine"),
      line: t("rows.taxEstimate", { label: salesTaxLabel }),
      amount: fmt(pl.estimatedTax),
      note: t("rows.taxEstimateNote"),
    })
  }
  return rows
}

export function balanceSheetToRows(
  bs: TaxBalanceSheet,
  profile: TaxMoneyProfile,
  manualEntries: TaxManualEntry[] = []
): TaxReportLine[] {
  const t = (key: string, options?: Record<string, unknown>) =>
    i18n.t(key, { ns: "tax", ...options })
  const fmt = (value: number) => formatTaxMoney(value, profile)
  const rows: TaxReportLine[] = [
    {
      section: t("rows.whatYouHave"),
      line: t("rows.customersOweYou"),
      amount: fmt(bs.accountsReceivable),
    },
    {
      section: t("rows.whatYouHave"),
      line: t("rows.inventoryValue"),
      amount: fmt(bs.inventoryValue),
      note: t("rows.stockTimesCost"),
    },
    {
      section: t("rows.whatYouHave"),
      line: t("rows.cashMovement"),
      amount: fmt(bs.cashMovement),
      note: t("rows.paymentsNetNote"),
    },
  ]

  for (const entry of manualEntries.filter((e) => e.category === "other_asset")) {
    rows.push({
      section: t("rows.whatYouHave"),
      line: entry.label,
      amount: fmt(Number(entry.amount) || 0),
      note: entry.note || t("rows.addedByYou"),
    })
  }

  rows.push({
    section: t("rows.whatYouHave"),
    line: t("rows.totalEstimate"),
    amount: fmt(bs.totalAssets),
  })

  rows.push({
    section: t("rows.whatYouOwe"),
    line: t("rows.outstandingVendorBills"),
    amount: fmt(bs.accountsPayable - bs.manualLiabilities),
  })

  for (const entry of manualEntries.filter((e) => e.category === "other_liability")) {
    rows.push({
      section: t("rows.whatYouOwe"),
      line: entry.label,
      amount: fmt(Number(entry.amount) || 0),
      note: entry.note || t("rows.addedByYou"),
    })
  }

  rows.push(
    {
      section: t("rows.whatYouOwe"),
      line: t("rows.totalOwed"),
      amount: fmt(bs.accountsPayable),
    },
    {
      section: t("rows.bottomLine"),
      line: t("rows.estimatedNetWorth"),
      amount: fmt(bs.estimatedEquity),
      note: t("rows.haveMinusOwe"),
    }
  )

  return rows
}

export function yearSummaryToRows(
  summary: TaxYearSummary,
  profile: TaxMoneyProfile
): TaxReportLine[] {
  const t = (key: string) => i18n.t(key, { ns: "tax" })
  const fmt = (value: number) => formatTaxMoney(value, profile)
  const { counts, profitAndLoss: pl } = summary
  return [
    { section: t("rows.overview"), line: t("rows.netRevenue"), amount: fmt(pl.netRevenue) },
    {
      section: t("rows.overview"),
      line: t("rows.grossProfitEstimate"),
      amount: fmt(pl.grossProfitEstimate),
    },
    {
      section: t("rows.overview"),
      line: t("rows.estimatedEquity"),
      amount: fmt(summary.balanceSheet.estimatedEquity),
    },
    { section: t("rows.counts"), line: t("rows.salesInvoices"), amount: String(counts.salesInvoices) },
    { section: t("rows.counts"), line: t("rows.purchaseOrders"), amount: String(counts.purchaseOrders) },
    { section: t("rows.counts"), line: t("rows.salesReturnsCount"), amount: String(counts.salesReturns) },
    {
      section: t("rows.counts"),
      line: t("rows.purchaseReturnsCount"),
      amount: String(counts.purchaseReturns),
    },
    {
      section: t("rows.counts"),
      line: t("rows.customerPayments"),
      amount: String(counts.customerPayments),
    },
    {
      section: t("rows.counts"),
      line: t("rows.vendorPayments"),
      amount: String(counts.vendorPayments),
    },
    { section: t("rows.pending"), line: t("rows.pendingSales"), amount: String(counts.pendingSales) },
    {
      section: t("rows.pending"),
      line: t("rows.pendingPurchases"),
      amount: String(counts.pendingPurchases),
    },
  ]
}
