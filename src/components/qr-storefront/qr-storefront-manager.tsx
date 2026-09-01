"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconCopy,
  IconDownload,
  IconExternalLink,
  IconPrinter,
  IconTrash,
  IconUser,
} from "@tabler/icons-react"
import { toast } from "sonner"

import {
  downloadStorefrontQr,
  StorefrontQrCode,
} from "@/components/qr-storefront/storefront-qr-code"
import {
  sfBtn,
  sfLabel,
  sfPanel,
  sfSelectTrigger,
} from "@/components/qr-storefront/storefront-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { InfiniteScrollSelect } from "@/components/ui/infinite-scroll-select"
import { Label } from "@/components/ui/label"
import { PageLoader } from "@/components/ui/page-loader"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useCustomers } from "@/context/customers-context"
import { useOrders } from "@/context/orders-context"
import { useProducts } from "@/context/products-context"
import { confirmDeleteAction } from "@/lib/confirm-action"
import {
  DEFAULT_COMPANY_SETTINGS,
  loadCompanySettings,
} from "@/lib/company-settings"
import { statusBadgeClass, statusLabel } from "@/lib/orders"
import {
  EMPTY_STOREFRONT_PREFILL,
  STOREFRONT_ANY_VALUE,
  ensureStorefrontSettings,
  formatStorefrontMoney,
  generatePresetId,
  hasStorefrontPrefill,
  isStorefrontOrder,
  prefillSummary,
  presetDisplayName,
  presetToPrefill,
  saveStorefrontSettings,
  storefrontFacets,
  storefrontHref,
  storefrontUrl,
  type StorefrontPrefill,
  type StorefrontQrPreset,
  type StorefrontSettings,
} from "@/lib/storefront"
import { cn } from "@/lib/utils"

function copyText(value: string) {
  return navigator.clipboard.writeText(value)
}

function samePrefill(a: StorefrontPrefill, b: StorefrontPrefill) {
  return (
    a.customerId === b.customerId &&
    a.brand === b.brand &&
    a.category === b.category &&
    a.variant === b.variant &&
    a.lock === b.lock
  )
}

export function QrStorefrontManager() {
  const { orders } = useOrders()
  const { products } = useProducts()
  const { customers } = useCustomers()

  const [hydrated, setHydrated] = React.useState(false)
  const [settings, setSettings] = React.useState<StorefrontSettings | null>(null)
  const [companyName, setCompanyName] = React.useState(DEFAULT_COMPANY_SETTINGS.name)
  const [origin, setOrigin] = React.useState("")
  const [prefill, setPrefill] = React.useState<StorefrontPrefill>(EMPTY_STOREFRONT_PREFILL)

  React.useEffect(() => {
    setSettings(ensureStorefrontSettings())
    setCompanyName(loadCompanySettings().name)
    setOrigin(window.location.origin)
    setHydrated(true)

    const style = document.createElement("style")
    style.setAttribute("data-qr-print", "true")
    style.textContent = `
      @media print {
        [data-slot="sidebar"],
        [data-slot="sidebar-gap"],
        [data-slot="sidebar-container"],
        header { display: none !important; }
        [data-slot="sidebar-inset"] {
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          border: 0 !important;
        }
      }
    `
    document.head.appendChild(style)
    return () => style.remove()
  }, [])

  const persist = React.useCallback((next: StorefrontSettings) => {
    saveStorefrontSettings(next)
    setSettings(next)
  }, [])

  const facets = React.useMemo(() => storefrontFacets(products), [products])
  const activeCustomers = React.useMemo(
    () => customers.filter((customer) => customer.status === "active"),
    [customers]
  )
  const selectedCustomerName = activeCustomers.find(
    (customer) => String(customer.id) === prefill.customerId
  )?.name
  const summary = prefillSummary(prefill, selectedCustomerName)
  const livePrefill = hasStorefrontPrefill(prefill) ? prefill : undefined
  const publicUrl =
    settings && origin ? storefrontUrl(origin, settings.storeId, livePrefill) : ""
  const previewHref = settings ? storefrontHref(settings.storeId, livePrefill) : "#"
  const qrLabel = summary.join(" · ") || "Open store"

  const matchedPreset = React.useMemo(
    () =>
      settings?.presets?.find((preset) => samePrefill(presetToPrefill(preset), prefill)),
    [prefill, settings?.presets]
  )

  const recentQrOrders = React.useMemo(
    () =>
      orders
        .filter(isStorefrontOrder)
        .sort((a, b) => {
          const byDate = b.orderDate.localeCompare(a.orderDate)
          return byDate !== 0 ? byDate : b.id - a.id
        })
        .slice(0, 5),
    [orders]
  )

  const handleCopy = async () => {
    if (!publicUrl) return
    try {
      await copyText(publicUrl)
      toast.success("Link copied.")
    } catch {
      toast.error("Could not copy the link.")
    }
  }

  const handleSave = () => {
    if (!settings || !hasStorefrontPrefill(prefill)) {
      toast.error("Choose a customer or filter first.")
      return
    }
    if (matchedPreset) {
      toast.message("This QR is already saved.")
      return
    }
    const preset: StorefrontQrPreset = {
      id: generatePresetId(),
      name: "",
      ...prefill,
      createdAt: new Date().toISOString(),
    }
    persist({ ...settings, presets: [preset, ...(settings.presets ?? [])] })
    toast.success("Saved.")
  }

  const handleDelete = async (preset: StorefrontQrPreset) => {
    if (!settings) return
    const label = presetDisplayName(
      preset,
      activeCustomers.find((customer) => String(customer.id) === preset.customerId)?.name
    )
    const confirmed = await confirmDeleteAction({
      itemName: label,
      entityLabel: "QR code",
    })
    if (!confirmed) return
    persist({
      ...settings,
      presets: settings.presets.filter((item) => item.id !== preset.id),
    })
  }

  if (!hydrated || !settings) {
    return <PageLoader message="Loading storefront…" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">QR Storefront</h2>
          <p className="text-muted-foreground mt-0.5 text-sm">
            The code updates as you choose a customer or brand.
          </p>
        </div>
        <label className="flex min-h-11 items-center gap-3 text-base">
          <span className="text-muted-foreground font-medium">
            {settings.enabled ? "Open" : "Closed"}
          </span>
          <Switch
            className="scale-110"
            checked={settings.enabled}
            onCheckedChange={(enabled) => {
              persist({ ...settings, enabled })
              toast.success(enabled ? "Storefront is open." : "Storefront is closed.")
            }}
          />
        </label>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]">
        <div className={`${sfPanel} p-6 lg:sticky lg:top-20`}>
          <StorefrontQrCode
            url={publicUrl}
            storeName={companyName}
            subtitle={qrLabel}
          />
          <div className="mt-5 grid grid-cols-2 gap-2.5 print:hidden">
            <Button type="button" className={sfBtn} onClick={handleCopy}>
              <IconCopy className="size-4" />
              Copy
            </Button>
            <Button type="button" variant="outline" className={sfBtn} asChild>
              <Link href={previewHref} target="_blank" rel="noreferrer">
                <IconExternalLink className="size-4" />
                Preview
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className={sfBtn}
              onClick={() => downloadStorefrontQr(publicUrl, `${companyName} ${qrLabel}`)}
            >
              <IconDownload className="size-4" />
              Download
            </Button>
            <Button type="button" variant="outline" className={sfBtn} onClick={() => window.print()}>
              <IconPrinter className="size-4" />
              Print
            </Button>
          </div>
        </div>

        <div className={`${sfPanel} print:hidden space-y-6 p-6`}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label className={sfLabel}>Customer</Label>
              <InfiniteScrollSelect
                id="qr-live-customer"
                value={prefill.customerId}
                onValueChange={(customerId) =>
                  setPrefill((prev) => ({ ...prev, customerId }))
                }
                options={[
                  { value: "", label: "Any customer" },
                  ...activeCustomers.map((customer) => ({
                    value: String(customer.id),
                    label: customer.name,
                    description:
                      customer.phone !== "—" ? customer.phone : customer.description,
                  })),
                ]}
                placeholder="Any customer"
                searchPlaceholder="Search customers…"
                emptyMessage="No customers."
                pageSize={8}
                leadingIcon={<IconUser className="size-5" stroke={1.75} />}
                className="h-12 w-full rounded-xl px-4 text-base"
              />
            </div>
            <FacetField
              label="Brand"
              value={prefill.brand}
              options={facets.brands}
              placeholder="Any brand"
              onChange={(brand) => setPrefill((prev) => ({ ...prev, brand }))}
            />
            <FacetField
              label="Category"
              value={prefill.category}
              options={facets.categories}
              placeholder="Any category"
              onChange={(category) => setPrefill((prev) => ({ ...prev, category }))}
            />
            <FacetField
              label="Variant"
              value={prefill.variant}
              options={facets.variants}
              placeholder="Any variant"
              onChange={(variant) => setPrefill((prev) => ({ ...prev, variant }))}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/40 pt-5">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-base">
              <Checkbox
                className="size-5"
                checked={prefill.lock}
                onCheckedChange={(checked) =>
                  setPrefill((prev) => ({ ...prev, lock: checked === true }))
                }
              />
              Customer can’t change these
            </label>
            <div className="flex gap-2">
              {hasStorefrontPrefill(prefill) ? (
                <Button
                  type="button"
                  variant="ghost"
                  className={sfBtn}
                  onClick={() => setPrefill(EMPTY_STOREFRONT_PREFILL)}
                >
                  Clear
                </Button>
              ) : null}
              <Button
                type="button"
                className={sfBtn}
                disabled={!hasStorefrontPrefill(prefill) || Boolean(matchedPreset)}
                onClick={handleSave}
              >
                Save QR
              </Button>
            </div>
          </div>

          {(settings.presets ?? []).length > 0 ? (
            <div>
              <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
                Saved
              </p>
              <ul className="space-y-1.5">
                <li>
                  <button
                    type="button"
                    className={cn(
                      "w-full rounded-xl px-4 py-3.5 text-left text-base font-medium transition-colors duration-200",
                      !hasStorefrontPrefill(prefill) ? "bg-primary/10" : "hover:bg-muted/60"
                    )}
                    onClick={() => setPrefill(EMPTY_STOREFRONT_PREFILL)}
                  >
                    Open store
                  </button>
                </li>
                {settings.presets.map((preset) => {
                  const name = presetDisplayName(
                    preset,
                    activeCustomers.find(
                      (customer) => String(customer.id) === preset.customerId
                    )?.name
                  )
                  const selected = matchedPreset?.id === preset.id
                  return (
                    <li key={preset.id} className="flex items-center gap-1.5">
                      <button
                        type="button"
                        className={cn(
                          "min-w-0 flex-1 rounded-xl px-4 py-3.5 text-left text-base font-medium transition-colors duration-200",
                          selected ? "bg-primary/10" : "hover:bg-muted/60"
                        )}
                        onClick={() => setPrefill(presetToPrefill(preset))}
                      >
                        {name}
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive size-10 shrink-0"
                        onClick={() => handleDelete(preset)}
                        aria-label="Delete"
                      >
                        <IconTrash className="size-4" />
                      </Button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <div className={`${sfPanel} print:hidden p-6`}>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-base font-semibold">Orders</p>
          <Button asChild variant="ghost" className={sfBtn}>
            <Link href="/sales">Sales</Link>
          </Button>
        </div>
        {recentQrOrders.length === 0 ? (
          <p className="text-muted-foreground text-base">
            None yet — preview the QR to place a test order.
          </p>
        ) : (
          <ul className="divide-border/50 divide-y">
            {recentQrOrders.map((order) => (
              <li
                key={order.id}
                className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
              >
                <p className="min-w-0 truncate text-base">
                  <span className="font-medium">{order.invoiceNumber}</span>
                  <span className="text-muted-foreground"> · {order.customerName}</span>
                </p>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-base tabular-nums">
                    {formatStorefrontMoney(order.totalAmount)}
                  </span>
                  <Badge variant="outline" className={statusBadgeClass(order.status)}>
                    {statusLabel(order.status)}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function FacetField({
  label,
  value,
  options,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  placeholder: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label className={sfLabel}>{label}</Label>
      <Select
        value={value || STOREFRONT_ANY_VALUE}
        onValueChange={(next) => onChange(next === STOREFRONT_ANY_VALUE ? "" : next)}
      >
        <SelectTrigger className={sfSelectTrigger}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={STOREFRONT_ANY_VALUE}>{placeholder}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
