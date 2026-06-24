"use client"

import * as React from "react"
import {
  type CustomerRow,
  CUSTOMERS_STORAGE_KEY,
  initialCustomers,
  parsePersistedCustomers,
} from "@/lib/customers"

type CustomersContextValue = {
  customers: CustomerRow[]
  setCustomers: React.Dispatch<React.SetStateAction<CustomerRow[]>>
  getCustomer: (id: number) => CustomerRow | undefined
  addCustomer: (customer: Omit<CustomerRow, "id">) => CustomerRow
  updateCustomer: (id: number, patch: Partial<CustomerRow>) => void
  removeCustomer: (id: number) => void
  duplicateCustomer: (id: number) => CustomerRow | null
}

const CustomersContext = React.createContext<CustomersContextValue | null>(null)

export function CustomersProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = React.useState<CustomerRow[]>(() => [
    ...initialCustomers,
  ])
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    const saved = parsePersistedCustomers(
      typeof window !== "undefined"
        ? window.localStorage.getItem(CUSTOMERS_STORAGE_KEY)
        : null
    )
    if (saved) setCustomers(saved)
    setHydrated(true)
  }, [])

  React.useEffect(() => {
    if (!hydrated || typeof window === "undefined") return
    window.localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customers))
  }, [customers, hydrated])

  const getCustomer = React.useCallback(
    (id: number) => customers.find((c) => c.id === id),
    [customers]
  )

  const addCustomer = React.useCallback((customer: Omit<CustomerRow, "id">) => {
    let created = { ...customer, id: 0 } as CustomerRow
    setCustomers((prev) => {
      const maxId = prev.reduce((m, x) => Math.max(m, x.id), 0)
      created = { ...customer, id: maxId + 1 }
      return [...prev, created]
    })
    return created
  }, [])

  const updateCustomer = React.useCallback((id: number, patch: Partial<CustomerRow>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch, id: c.id } : c))
    )
  }, [])

  const removeCustomer = React.useCallback((id: number) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const duplicateCustomer = React.useCallback((id: number) => {
    let copy: CustomerRow | null = null
    setCustomers((prev) => {
      const source = prev.find((c) => c.id === id)
      if (!source) return prev
      const maxId = prev.reduce((m, x) => Math.max(m, x.id), 0)
      copy = {
        ...source,
        id: maxId + 1,
        name: `${source.name} (copy)`,
        openingBalance: "0",
        totalSales: "0",
        totalPayments: "0",
        imageUrl: "",
      }
      return [...prev, copy]
    })
    return copy
  }, [])

  const value = React.useMemo(
    () => ({
      customers,
      setCustomers,
      getCustomer,
      addCustomer,
      updateCustomer,
      removeCustomer,
      duplicateCustomer,
    }),
    [
      customers,
      getCustomer,
      addCustomer,
      updateCustomer,
      removeCustomer,
      duplicateCustomer,
    ]
  )

  return (
    <CustomersContext.Provider value={value}>{children}</CustomersContext.Provider>
  )
}

export function useCustomers() {
  const ctx = React.useContext(CustomersContext)
  if (!ctx) {
    throw new Error("useCustomers must be used within CustomersProvider")
  }
  return ctx
}
