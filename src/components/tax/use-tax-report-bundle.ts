"use client"

import * as React from "react"

import { useCustomers } from "@/context/customers-context"
import { useFiscalTerms } from "@/context/fiscal-term-context"
import { useOrders } from "@/context/orders-context"
import { usePayments } from "@/context/payments-context"
import { useProducts } from "@/context/products-context"
import { usePurchases } from "@/context/purchases-context"
import { useReturns } from "@/context/returns-context"
import { useTaxSettings } from "@/context/tax-settings-context"
import { useVendors } from "@/context/vendors-context"
import { computeTaxReportBundle, type TaxReportBundle } from "@/lib/tax-reports"

export function useTaxReportBundle(): TaxReportBundle | null {
  const { viewing, plannedEndIso } = useFiscalTerms()
  const { settings } = useTaxSettings()
  const { orders } = useOrders()
  const { purchases } = usePurchases()
  const { returns } = useReturns()
  const { payments } = usePayments()
  const { customers } = useCustomers()
  const { vendors } = useVendors()
  const { products } = useProducts()

  return React.useMemo(() => {
    if (!viewing) return null
    return computeTaxReportBundle({
      orders,
      purchases,
      returns,
      payments,
      customers,
      vendors,
      products,
      estimatedTaxRatePercent: settings.estimatedTaxRatePercent,
      manualEntries: settings.manualEntries,
      term: viewing,
      plannedEndIso,
    })
  }, [
    customers,
    orders,
    payments,
    plannedEndIso,
    products,
    purchases,
    returns,
    settings.estimatedTaxRatePercent,
    settings.manualEntries,
    vendors,
    viewing,
  ])
}
