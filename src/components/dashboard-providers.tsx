"use client"

import * as React from "react"
import { CustomersProvider } from "@/context/customers-context"
import { VendorsProvider } from "@/context/vendors-context"
import { OrdersProvider } from "@/context/orders-context"
import { PosSettingsProvider } from "@/context/pos-settings-context"
import { PurchasesProvider } from "@/context/purchases-context"
import { ReturnsProvider } from "@/context/returns-context"
import { PaymentsProvider } from "@/context/payments-context"
import { ProductsProvider } from "@/context/products-context"
import { FiscalTermProvider } from "@/context/fiscal-term-context"
import { TaxSettingsProvider } from "@/context/tax-settings-context"
import { Toaster } from "@/components/ui/sonner"

export function DashboardProviders({ children }: { children: React.ReactNode }) {
  return (
    <FiscalTermProvider>
      <TaxSettingsProvider>
      <CustomersProvider>
        <VendorsProvider>
          <OrdersProvider>
            <PosSettingsProvider>
              <PurchasesProvider>
                <ReturnsProvider>
                  <PaymentsProvider>
                    <ProductsProvider>
                      {children}
                      <Toaster richColors position="top-center" />
                    </ProductsProvider>
                  </PaymentsProvider>
                </ReturnsProvider>
              </PurchasesProvider>
            </PosSettingsProvider>
          </OrdersProvider>
        </VendorsProvider>
      </CustomersProvider>
      </TaxSettingsProvider>
    </FiscalTermProvider>
  )
}
