"use client"

import * as React from "react"
import { CustomersProvider } from "@/context/customers-context"
import { VendorsProvider } from "@/context/vendors-context"
import { OrdersProvider } from "@/context/orders-context"
import { PurchasesProvider } from "@/context/purchases-context"
import { ReturnsProvider } from "@/context/returns-context"
import { PaymentsProvider } from "@/context/payments-context"
import { ProductsProvider } from "@/context/products-context"
import { FiscalTermProvider } from "@/context/fiscal-term-context"
import { Toaster } from "@/components/ui/sonner"

export function DashboardProviders({ children }: { children: React.ReactNode }) {
  return (
    <FiscalTermProvider>
      <CustomersProvider>
        <VendorsProvider>
          <OrdersProvider>
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
          </OrdersProvider>
        </VendorsProvider>
      </CustomersProvider>
    </FiscalTermProvider>
  )
}
