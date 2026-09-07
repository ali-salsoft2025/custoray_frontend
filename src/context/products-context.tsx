"use client"

import * as React from "react"
import {
  type ProductRow,
  PRODUCTS_STORAGE_KEY,
  initialProducts,
  loadStoredProducts,
  nextSku,
} from "@/lib/products"
import { recordProductPriceChanges } from "@/lib/product-price-history"
import { apiListProducts } from "@/lib/api/business"

const USE_API = process.env.NEXT_PUBLIC_API_PRODUCTS === "true"

function mapApiProduct(p: Awaited<ReturnType<typeof apiListProducts>>["items"][0], index: number): ProductRow {
  const lifecycle =
    p.lifecycle === "inactive" || p.lifecycle === "archived" ? p.lifecycle : "active"
  return {
    id: index + 1,
    srNo: p.srNo ?? index + 1,
    sku: p.sku,
    name: p.name,
    brand: p.brand?.name ?? "",
    category: p.category?.name ?? "General",
    variant: p.variant?.name ?? "Others",
    status: p.status,
    productStatus: p.productStatus === "active" ? "active" : "none",
    lifecycle,
    stock: Number(p.stock) || 0,
    orders: p.ordersCount ?? 0,
    costPrice: String(p.costPrice ?? "0"),
    salePrice: String(p.salePrice ?? "0"),
    imageUrls: Array.isArray(p.imageUrls) ? p.imageUrls.filter((url) => typeof url === "string") : [],
  }
}

type ProductsContextValue = {
  products: ProductRow[]
  setProducts: React.Dispatch<React.SetStateAction<ProductRow[]>>
  getProduct: (id: number) => ProductRow | undefined
  addProduct: (product: Omit<ProductRow, "id" | "srNo">) => ProductRow
  updateProduct: (id: number, patch: Partial<ProductRow>) => void
  removeProduct: (id: number) => void
  loading: boolean
}

const ProductsContext = React.createContext<ProductsContextValue | null>(null)

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = React.useState<ProductRow[]>(() => [...initialProducts])
  const [hydrated, setHydrated] = React.useState(false)
  const [loading, setLoading] = React.useState(USE_API)

  React.useEffect(() => {
    if (USE_API) {
      apiListProducts({ limit: 500 })
        .then((res) => {
          const mapped = (res.items ?? []).map(mapApiProduct)
          setProducts(mapped.length > 0 ? mapped : loadStoredProducts())
        })
        .catch(() => {
          setProducts(loadStoredProducts())
        })
        .finally(() => {
          setLoading(false)
          setHydrated(true)
        })
      return
    }
    setProducts(loadStoredProducts())
    setHydrated(true)
  }, [])

  React.useEffect(() => {
    if (!hydrated || typeof window === "undefined" || USE_API) return
    window.localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products))
  }, [products, hydrated])

  const productsRef = React.useRef(products)
  productsRef.current = products

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
    recordProductPriceChanges(null, created)
    return created
  }, [])

  const updateProduct = React.useCallback((id: number, patch: Partial<ProductRow>) => {
    const current = productsRef.current.find((p) => p.id === id)
    if (!current) return
    const next = { ...current, ...patch, id: current.id, srNo: current.srNo }
    if (
      patch.salePrice !== undefined ||
      patch.costPrice !== undefined ||
      (patch.sku !== undefined && patch.sku !== current.sku)
    ) {
      recordProductPriceChanges(current, next)
    }
    setProducts((prev) => prev.map((p) => (p.id === id ? next : p)))
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
      loading,
    }),
    [products, getProduct, addProduct, updateProduct, removeProduct, loading]
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
