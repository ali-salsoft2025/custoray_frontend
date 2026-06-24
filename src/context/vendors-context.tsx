"use client"

import * as React from "react"
import {
  type VendorRow,
  VENDORS_STORAGE_KEY,
  initialVendors,
  parsePersistedVendors,
} from "@/lib/vendors"

type VendorsContextValue = {
  vendors: VendorRow[]
  setVendors: React.Dispatch<React.SetStateAction<VendorRow[]>>
  getVendor: (id: number) => VendorRow | undefined
  addVendor: (vendor: Omit<VendorRow, "id">) => VendorRow
  updateVendor: (id: number, patch: Partial<VendorRow>) => void
  removeVendor: (id: number) => void
  duplicateVendor: (id: number) => VendorRow | null
}

const VendorsContext = React.createContext<VendorsContextValue | null>(null)

export function VendorsProvider({ children }: { children: React.ReactNode }) {
  const [vendors, setVendors] = React.useState<VendorRow[]>(() => [...initialVendors])
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    const saved = parsePersistedVendors(
      typeof window !== "undefined"
        ? window.localStorage.getItem(VENDORS_STORAGE_KEY)
        : null
    )
    if (saved) setVendors(saved)
    setHydrated(true)
  }, [])

  React.useEffect(() => {
    if (!hydrated || typeof window === "undefined") return
    window.localStorage.setItem(VENDORS_STORAGE_KEY, JSON.stringify(vendors))
  }, [vendors, hydrated])

  const getVendor = React.useCallback(
    (id: number) => vendors.find((v) => v.id === id),
    [vendors]
  )

  const addVendor = React.useCallback((vendor: Omit<VendorRow, "id">) => {
    let created = { ...vendor, id: 0 } as VendorRow
    setVendors((prev) => {
      const maxId = prev.reduce((m, x) => Math.max(m, x.id), 0)
      created = { ...vendor, id: maxId + 1 }
      return [...prev, created]
    })
    return created
  }, [])

  const updateVendor = React.useCallback((id: number, patch: Partial<VendorRow>) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...patch, id: v.id } : v))
    )
  }, [])

  const removeVendor = React.useCallback((id: number) => {
    setVendors((prev) => prev.filter((v) => v.id !== id))
  }, [])

  const duplicateVendor = React.useCallback((id: number) => {
    let copy: VendorRow | null = null
    setVendors((prev) => {
      const source = prev.find((v) => v.id === id)
      if (!source) return prev
      const maxId = prev.reduce((m, x) => Math.max(m, x.id), 0)
      copy = {
        ...source,
        id: maxId + 1,
        name: `${source.name} (copy)`,
        openingBalance: "0",
        totalPurchases: "0",
        totalPayments: "0",
        imageUrl: "",
      }
      return [...prev, copy]
    })
    return copy
  }, [])

  const value = React.useMemo(
    () => ({
      vendors,
      setVendors,
      getVendor,
      addVendor,
      updateVendor,
      removeVendor,
      duplicateVendor,
    }),
    [vendors, getVendor, addVendor, updateVendor, removeVendor, duplicateVendor]
  )

  return <VendorsContext.Provider value={value}>{children}</VendorsContext.Provider>
}

export function useVendors() {
  const ctx = React.useContext(VendorsContext)
  if (!ctx) {
    throw new Error("useVendors must be used within VendorsProvider")
  }
  return ctx
}
