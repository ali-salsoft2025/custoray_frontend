"use client"

import * as React from "react"
import {
  IconRotateClockwise,
  IconSearch,
  IconShoppingCart,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { CustomerQuickAddSheet } from "@/components/customers/customer-quick-add-sheet"
import { InvoicePdfButton } from "@/components/invoices/invoice-pdf-button"
import { PosCartPanel } from "@/components/pos/pos-cart-panel"
import { applyPosDiscount } from "@/components/pos/pos-cart-checkout"
import { PosCatalogTabs } from "@/components/pos/pos-catalog-tabs"
import { PosCustomerSelect } from "@/components/pos/pos-customer-select"
import { PosInvoicePanel } from "@/components/pos/pos-invoice-panel"
import { PosRecentSales } from "@/components/pos/pos-recent-sales"
import { PosProductCard } from "@/components/pos/pos-product-card"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { useCustomers } from "@/context/customers-context"
import { useOrders } from "@/context/orders-context"
import { useProducts } from "@/context/products-context"
import { useReturns } from "@/context/returns-context"
import { confirmReturnAction } from "@/lib/confirm-action"
import { formatMoney } from "@/lib/customers"
import { buildReturnFromOrder } from "@/lib/returns"
import { type OrderRow } from "@/lib/orders"
import {
  buildPosOrderFromCart,
  cartSubtotal,
  computePosTotals,
  isPosOrder,
  nextPosInvoiceNumber,
  posCatalogProducts,
  type PosCartLine,
} from "@/lib/pos"
import { canReturnDocument } from "@/lib/return-eligibility"
import type { CustomerRow } from "@/lib/customers"
import type { ProductRow } from "@/lib/products"
import { cn } from "@/lib/utils"

function formatPosMoney(value: string) {
  return formatMoney(value).replace(/^\$/, "Rs ")
}

const WALK_IN_CUSTOMER_ID = "walk-in"

const panelClass =
  "rounded-2xl bg-card shadow-sm shadow-black/[0.04] ring-1 ring-border/40"

const searchInputClass =
  "h-9 rounded-full text-sm shadow-sm focus-visible:ring-0 focus-visible:ring-offset-0 hover:ring-0 focus:ring-0 focus:outline-none min-w-0 flex-1"

export function PosTerminal() {
  const { products, getProduct, updateProduct } = useProducts()
  const { customers } = useCustomers()
  const { orders, addOrder, getOrder, updateOrder } = useOrders()
  const { addReturn } = useReturns()

  const [mode, setMode] = React.useState<"sale" | "return">("sale")
  const [search, setSearch] = React.useState("")
  const [brand, setBrand] = React.useState<string>("all")
  const [cart, setCart] = React.useState<PosCartLine[]>([])
  const [selectedProductId, setSelectedProductId] = React.useState<number | null>(null)
  const [discountAmount, setDiscountAmount] = React.useState("0.00")
  const [discountDraft, setDiscountDraft] = React.useState("")
  const [customerId, setCustomerId] = React.useState(WALK_IN_CUSTOMER_ID)
  const [customerQuickAddOpen, setCustomerQuickAddOpen] = React.useState(false)
  const [paymentMethod, setPaymentMethod] =
    React.useState<OrderRow["paymentMethod"]>("Cash")
  const [lastSale, setLastSale] = React.useState<OrderRow | null>(null)
  const [returnSearch, setReturnSearch] = React.useState("")
  const [processing, setProcessing] = React.useState(false)

  const catalog = React.useMemo(() => posCatalogProducts(products), [products])

  const customerName = React.useMemo(() => {
    if (customerId === WALK_IN_CUSTOMER_ID) return "Walk-in"
    const customer = customers.find((item) => String(item.id) === customerId)
    return customer?.name ?? "Walk-in"
  }, [customerId, customers])

  const customerOptions = React.useMemo(
    () => [
      { value: WALK_IN_CUSTOMER_ID, label: "Walk-in", description: "No customer record" },
      ...customers.map((customer) => ({
        value: String(customer.id),
        label: customer.name,
        description: customer.phone !== "—" ? customer.phone : customer.description,
      })),
    ],
    [customers]
  )

  const cartQtyByProductId = React.useMemo(() => {
    const map = new Map<number, number>()
    for (const line of cart) {
      map.set(line.productId, line.quantity)
    }
    return map
  }, [cart])

  const brands = React.useMemo(() => {
    const set = new Set(
      catalog
        .map((product) => product.brand)
        .filter((name) => Boolean(name) && name !== "—")
    )
    return ["all", ...Array.from(set).sort()]
  }, [catalog])

  const filteredProducts = React.useMemo(() => {
    const query = search.trim().toLowerCase()
    return catalog.filter((product) => {
      if (brand !== "all" && product.brand !== brand) return false
      if (!query) return true
      return (
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      )
    })
  }, [brand, catalog, search])

  const subtotal = React.useMemo(() => cartSubtotal(cart), [cart])
  const checkoutTotals = React.useMemo(
    () => computePosTotals(subtotal, discountAmount),
    [discountAmount, subtotal]
  )

  const posOrders = React.useMemo(() => {
    return orders
      .filter(isPosOrder)
      .sort((a, b) => {
        const dateCompare = b.orderDate.localeCompare(a.orderDate)
        if (dateCompare !== 0) return dateCompare
        return b.id - a.id
      })
  }, [orders])

  const nextInvoice = React.useMemo(
    () => nextPosInvoiceNumber(orders),
    [orders]
  )

  const recentSales = React.useMemo(() => posOrders.slice(0, 6), [posOrders])

  const lastCreatedInvoice = posOrders[0] ?? null

  const filteredReturnOrders = React.useMemo(() => {
    const query = returnSearch.trim().toLowerCase()
    if (!query) return posOrders.slice(0, 30)
    return posOrders
      .filter(
        (order) =>
          order.invoiceNumber.toLowerCase().includes(query) ||
          order.customerName.toLowerCase().includes(query)
      )
      .slice(0, 30)
  }, [posOrders, returnSearch])

  const addToCart = React.useCallback((product: ProductRow) => {
    if (product.stock <= 0) {
      toast.error(`${product.name} is out of stock.`)
      return
    }

    setCart((prev) => {
      const existing = prev.find((line) => line.productId === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error(`Only ${product.stock} in stock for ${product.name}.`)
          return prev
        }
        return prev.map((line) =>
          line.productId === product.id
            ? { ...line, quantity: line.quantity + 1, maxStock: product.stock }
            : line
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity: 1,
          unitPrice: product.salePrice,
          maxStock: product.stock,
        },
      ]
    })
    setSelectedProductId(product.id)
  }, [])

  const setLineQuantity = React.useCallback((productId: number, quantity: number) => {
    setCart((prev) =>
      prev
        .map((line) => {
          if (line.productId !== productId) return line
          if (quantity <= 0) return null
          if (quantity > line.maxStock) {
            toast.error(`Only ${line.maxStock} in stock.`)
            return line
          }
          return { ...line, quantity }
        })
        .filter((line): line is PosCartLine => line !== null)
    )
  }, [])

  const setLineFinalPrice = React.useCallback(
    (productId: number, finalLineTotal: string | undefined) => {
      setCart((prev) =>
        prev.map((line) =>
          line.productId === productId ? { ...line, finalLineTotal } : line
        )
      )
    },
    []
  )

  const removeFromCart = React.useCallback((productId: number) => {
    setCart((prev) => {
      const next = prev.filter((line) => line.productId !== productId)
      setSelectedProductId((current) => {
        if (current !== productId) return current
        return next[next.length - 1]?.productId ?? null
      })
      return next
    })
  }, [])

  const clearCart = React.useCallback(() => {
    setCart([])
    setSelectedProductId(null)
    setDiscountAmount("0.00")
    setDiscountDraft("")
  }, [])

  const clearCustomer = React.useCallback(() => {
    setCustomerId(WALK_IN_CUSTOMER_ID)
  }, [])

  const resetAfterSale = React.useCallback(() => {
    setCart([])
    setSelectedProductId(null)
    setDiscountAmount("0.00")
    setDiscountDraft("")
    setCustomerId(WALK_IN_CUSTOMER_ID)
    setPaymentMethod("Cash")
  }, [])

  const applyDiscount = React.useCallback(() => {
    const applied = applyPosDiscount(subtotal, discountDraft)
    setDiscountAmount(applied)
    setDiscountDraft(applied === "0.00" ? "" : applied)
  }, [discountDraft, subtotal])

  const clearDiscount = React.useCallback(() => {
    setDiscountAmount("0.00")
    setDiscountDraft("")
  }, [])

  const handleCustomerCreated = React.useCallback((customer: CustomerRow) => {
    setCustomerId(String(customer.id))
  }, [])

  const restoreStockForReturn = React.useCallback(
    (order: OrderRow, lineIds?: number[]) => {
      const lineFilter = lineIds?.length
        ? (line: OrderRow["lines"][number]) => lineIds.includes(line.id)
        : () => true

      const qtyByProductId = new Map<number, number>()
      for (const line of order.lines.filter(lineFilter)) {
        const product = products.find((item) => item.name === line.productName)
        if (product) {
          qtyByProductId.set(
            product.id,
            (qtyByProductId.get(product.id) ?? 0) + line.quantity
          )
        }
      }

      for (const [productId, quantity] of qtyByProductId) {
        const product = products.find((item) => item.id === productId)
        if (product) {
          updateProduct(productId, { stock: product.stock + quantity })
        }
      }
    },
    [products, updateProduct]
  )

  const completeSale = React.useCallback(async () => {
    if (cart.length === 0) {
      toast.error("Add at least one product to the cart.")
      return
    }

    for (const line of cart) {
      const product = getProduct(line.productId)
      if (!product || product.stock < line.quantity) {
        toast.error(`${line.productName} no longer has enough stock.`)
        return
      }
    }

    setProcessing(true)
    try {
      const invoiceNumber = nextPosInvoiceNumber(orders)
      const payload = buildPosOrderFromCart(cart, {
        customerName,
        paymentMethod,
        invoiceNumber,
        discountAmount: checkoutTotals.discount,
      })
      const created = addOrder(payload)

      for (const line of cart) {
        const product = getProduct(line.productId)
        if (product) {
          updateProduct(line.productId, {
            stock: Math.max(0, product.stock - line.quantity),
          })
        }
      }

      setLastSale(created)
      resetAfterSale()
      toast.success(`Sale ${created.invoiceNumber} completed.`)
    } finally {
      setProcessing(false)
    }
  }, [
    addOrder,
    cart,
    checkoutTotals.discount,
    resetAfterSale,
    customerName,
    getProduct,
    orders,
    paymentMethod,
    updateProduct,
  ])

  const handleReturnOrder = React.useCallback(
    async (order: OrderRow, lineIds?: number[]) => {
      if (!canReturnDocument(order)) {
        toast.error("This sale cannot be returned.")
        return
      }

      const draft = buildReturnFromOrder(order, { lineIds })
      if (draft.lines.length === 0 || Number(draft.totalAmount) <= 0) {
        toast.error("Nothing left to return on this invoice.")
        return
      }

      const scope = lineIds?.length === 1 ? "item" : "invoice"
      const itemName =
        scope === "item" ? draft.lines[0]?.productName : order.invoiceNumber

      if (
        !(await confirmReturnAction({
          scope,
          itemName,
          referenceNumber: order.invoiceNumber,
          totalAmount: draft.totalAmount,
          refundDue: draft.refundDue,
        }))
      ) {
        return
      }

      const created = addReturn({ ...draft, status: "completed" }, {
        getOrder,
        onApplySales: updateOrder,
      })

      restoreStockForReturn(order, lineIds)
      toast.success(`Return ${created.returnNumber} recorded.`)
    },
    [addReturn, getOrder, restoreStockForReturn, updateOrder]
  )

  return (
    <div className="flex flex-col gap-3">
      <CustomerQuickAddSheet
        open={customerQuickAddOpen}
        onOpenChange={setCustomerQuickAddOpen}
        formId="pos-customer-quick-add"
        onCreated={handleCustomerCreated}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold tracking-tight">Register</h2>

        <div className="border-border inline-flex border-b">
          {(
            [
              { value: "sale", label: "New sale", icon: IconShoppingCart },
              { value: "return", label: "Returns", icon: IconRotateClockwise },
            ] as const
          ).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={cn(
                "relative flex items-center gap-1.5 border-b-2 px-2.5 py-2 text-xs font-medium transition-colors",
                mode === value
                  ? "border-primary text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground border-transparent"
              )}
            >
              <Icon className="size-3.5" stroke={1.75} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {mode === "sale" ? (
        <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="flex min-h-[480px] flex-col gap-2.5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                <PosCustomerSelect
                  customerId={customerId}
                  customerName={customerName}
                  onCustomerChange={setCustomerId}
                  onClearCustomer={clearCustomer}
                  onAddCustomer={() => setCustomerQuickAddOpen(true)}
                  customerOptions={customerOptions}
                  walkInCustomerId={WALK_IN_CUSTOMER_ID}
                  className="w-full shrink-0 sm:w-[200px] lg:w-[220px]"
                />
                <SearchInput
                  placeholder="Search products…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  icon={<IconSearch className="size-3.5" />}
                  className={cn(searchInputClass, "min-w-0 flex-1")}
                />
              </div>
              <p className="text-muted-foreground shrink-0 text-xs tabular-nums">
                {filteredProducts.length} items
              </p>
            </div>

            <PosCatalogTabs
              brand={brand}
              onBrandChange={setBrand}
              brands={brands}
            />

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5">
                {filteredProducts.map((product) => (
                  <PosProductCard
                    key={product.id}
                    product={product}
                    inCartQty={cartQtyByProductId.get(product.id) ?? 0}
                    formatPrice={formatPosMoney}
                    onAdd={addToCart}
                  />
                ))}
              </div>
            ) : (
              <div className={cn(panelClass, "flex flex-col items-center justify-center gap-2 py-16 text-center")}>
                <div className="bg-muted/60 text-muted-foreground flex size-12 items-center justify-center rounded-2xl">
                  <IconShoppingCart className="size-5" />
                </div>
                <p className="text-sm font-medium">No products match</p>
                <p className="text-muted-foreground max-w-xs text-sm">
                  Try another search or filter. Only active inventory items appear here.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 xl:sticky xl:top-4 xl:self-start">
            <PosInvoicePanel
              nextInvoiceNumber={nextInvoice}
              lastCreated={lastCreatedInvoice}
              justCreated={lastSale}
              formatMoney={formatPosMoney}
              onDismissJustCreated={() => setLastSale(null)}
            />

            <PosCartPanel
              cart={cart}
              selectedProductId={selectedProductId}
              onSelectLine={setSelectedProductId}
              onQuantityChange={setLineQuantity}
              onFinalPriceChange={setLineFinalPrice}
              onRemoveLine={removeFromCart}
              onClearCart={clearCart}
              formatMoney={formatPosMoney}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              discountDraft={discountDraft}
              onDiscountDraftChange={setDiscountDraft}
              onApplyDiscount={applyDiscount}
              onClearDiscount={clearDiscount}
              appliedDiscount={checkoutTotals.discount}
              subtotal={checkoutTotals.subtotal}
              total={checkoutTotals.total}
              disabled={cart.length === 0}
              processing={processing}
              onCompleteSale={completeSale}
            />
          </div>
        </div>

        <PosRecentSales recentSales={recentSales} formatMoney={formatPosMoney} />
        </div>
      ) : (
        <div className={cn(panelClass, "overflow-hidden")}>
          <div className="border-border/40 border-b px-4 py-4">
            <p className="font-medium">Return a sale</p>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Find a receipt and return items back to inventory.
            </p>
            <div className="mt-3 sm:max-w-lg">
              <SearchInput
                placeholder="Search by receipt or customer…"
                value={returnSearch}
                onChange={(event) => setReturnSearch(event.target.value)}
                icon={<IconSearch className="size-4" />}
                className={searchInputClass}
              />
            </div>
          </div>

          <div className="space-y-3 p-4">
            {filteredReturnOrders.length === 0 ? (
              <p className="text-muted-foreground py-12 text-center text-sm">
                No POS sales found.
              </p>
            ) : (
              filteredReturnOrders.map((order) => {
                const returnable = canReturnDocument(order)
                return (
                  <div
                    key={order.id}
                    className="rounded-xl bg-muted/25 p-4 ring-1 ring-border/30"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium">{order.invoiceNumber}</p>
                        <p className="text-muted-foreground mt-0.5 text-sm">
                          {order.customerName} · {order.orderDate}
                        </p>
                        <p className="mt-1 text-sm font-semibold tabular-nums">
                          {formatPosMoney(order.totalAmount)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <InvoicePdfButton order={order} size="sm" variant="outline" />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          disabled={!returnable}
                          onClick={() => handleReturnOrder(order)}
                        >
                          Return all
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      {(order.lines ?? []).map((line) => (
                        <div
                          key={line.id}
                          className="bg-background/70 flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">{line.productName}</p>
                            <p className="text-muted-foreground text-xs">
                              Qty {line.quantity} · {formatPosMoney(line.lineTotal)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="shrink-0 rounded-lg"
                            disabled={!returnable || line.quantity <= 0}
                            onClick={() => handleReturnOrder(order, [line.id])}
                          >
                            Return
                          </Button>
                        </div>
                      ))}
                    </div>

                    {!returnable ? (
                      <p className="text-muted-foreground mt-2 text-xs">
                        Not eligible — must be completed and paid.
                      </p>
                    ) : null}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
