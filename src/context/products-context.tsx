"use client"

import * as React from "react"
import {
  type ProductRow,
  PRODUCTS_STORAGE_KEY,
  initialProducts,
  nextSku,
  parsePersistedProducts,
} from "@/lib/products"

type ProductsContextValue = {
  products: ProductRow[]
  setProducts: React.Dispatch<React.SetStateAction<ProductRow[]>>
  getProduct: (id: number) => ProductRow | undefined
  addProduct: (product: Omit<ProductRow, "id" | "srNo">) => ProductRow
  updateProduct: (id: number, patch: Partial<ProductRow>) => void
  removeProduct: (id: number) => void
}

const ProductsContext = React.createContext<ProductsContextValue | null>(null)

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = React.useState<ProductRow[]>(() => [...initialProducts])
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    const saved = parsePersistedProducts(
      typeof window !== "undefined"
        ? window.localStorage.getItem(PRODUCTS_STORAGE_KEY)
        : null
    )
    if (saved) setProducts(saved)
    setHydrated(true)
  }, [])

  React.useEffect(() => {
    if (!hydrated || typeof window === "undefined") return
    window.localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products))
  }, [products, hydrated])

  const getProduct = React.useCallback(
    (id: number) => products.find((p) => p.id === id),
    [products]
  )

  const addProduct = React.useCallback((product: Omit<ProductRow, "id" | "srNo">) => {
    let created = { ...product, id: 0, srNo: 0 } as ProductRow
    setProducts((prev) => {
      const maxId = prev.reduce((m, x) => Math.max(m, x.id), 0)
      created = {
        ...product,
        id: maxId + 1,
        srNo: maxId + 1,
        sku: product.sku.trim() || nextSku(prev),
      }
      return [...prev, created]
    })
    return created
  }, [])

  const updateProduct = React.useCallback((id: number, patch: Partial<ProductRow>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch, id: p.id, srNo: p.srNo } : p))
    )
  }, [])

  const removeProduct = React.useCallback((id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const value = React.useMemo(
    () => ({
      products,
      setProducts,
      getProduct,
      addProduct,
      updateProduct,
      removeProduct,
    }),
    [products, getProduct, addProduct, updateProduct, removeProduct]
  )

  return (
    <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>
  )
}

export function useProducts() {
  const ctx = React.useContext(ProductsContext)
  if (!ctx) {
    throw new Error("useProducts must be used within ProductsProvider")
  }
  return ctx
}
