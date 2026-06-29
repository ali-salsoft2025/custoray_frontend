"use client"

import {
  IconCreditCard,
  IconDeviceDesktop,
  IconLayoutGrid,
  IconPackage,
  IconReceipt,
  IconRefresh,
  IconSettings,
  IconSparkles,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { SettingsSection } from "@/components/settings/settings-section"
import { SettingsToggleRow } from "@/components/settings/settings-toggle-row"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePosSettings } from "@/context/pos-settings-context"
import { ORDER_STATUSES, PAYMENT_METHODS, statusLabel } from "@/lib/orders"
import {
  DEFAULT_POS_SETTINGS,
  sanitizeReceiptPrefix,
  type PosSettings,
} from "@/lib/pos-settings"
import { cn } from "@/lib/utils"

const RECENT_SALES_OPTIONS = [3, 4, 6, 8, 10, 12] as const
const COLUMN_OPTIONS = [2, 3, 4] as const

const fieldClass = "space-y-1"
const labelClass = "text-xs font-medium"
const inputClass = "h-9 text-sm"
const selectTriggerClass = "h-9 w-full text-sm"
const hintClass = "text-muted-foreground text-[11px] leading-snug"
const toggleStackClass = "space-y-1.5"
const formGridClass = "grid gap-3 sm:grid-cols-2"

function PaymentMethodToggles({
  settings,
  updateSettings,
}: {
  settings: PosSettings
  updateSettings: (patch: Partial<PosSettings>) => void
}) {
  const toggleMethod = (method: PosSettings["defaultPaymentMethod"], enabled: boolean) => {
    const current = settings.enabledPaymentMethods
    if (enabled) {
      if (current.includes(method)) return
      updateSettings({ enabledPaymentMethods: [...current, method] })
      return
    }
    if (current.length <= 1) {
      toast.error("At least one payment method must stay enabled.")
      return
    }
    updateSettings({
      enabledPaymentMethods: current.filter((item) => item !== method),
    })
  }

  return (
    <div className={toggleStackClass}>
      {PAYMENT_METHODS.map((method) => (
        <SettingsToggleRow
          key={method}
          compact
          title={method}
          description={
            method === settings.defaultPaymentMethod
              ? "Current default on register"
              : undefined
          }
          checked={settings.enabledPaymentMethods.includes(method)}
          onCheckedChange={(checked) => toggleMethod(method, checked)}
        />
      ))}
    </div>
  )
}

export function PosSettingsPanel() {
  const { settings, updateSettings, resetSettings } = usePosSettings()

  const handleReset = () => {
    resetSettings()
    toast.success("POS settings reset to defaults.")
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
          <IconSettings className="size-4" stroke={1.75} />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight">POS settings</h2>
          <p className="text-muted-foreground text-xs leading-snug">
            Register display, checkout rules, receipts, and inventory.
          </p>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <SettingsSection
          compact
          title="Register & terminal"
          description="Identity and startup behavior."
          icon={<IconDeviceDesktop stroke={1.75} />}
          iconClassName="bg-primary/10 text-primary"
        >
          <div className={formGridClass}>
            <div className={fieldClass}>
              <Label htmlFor="pos-register-name" className={labelClass}>
                Register name
              </Label>
              <Input
                id="pos-register-name"
                className={inputClass}
                value={settings.registerName}
                onChange={(event) =>
                  updateSettings({ registerName: event.target.value.slice(0, 40) })
                }
                placeholder="Main register"
              />
            </div>
            <div className={fieldClass}>
              <Label htmlFor="pos-receipt-prefix" className={labelClass}>
                Receipt prefix
              </Label>
              <Input
                id="pos-receipt-prefix"
                className={cn(inputClass, "uppercase")}
                value={settings.receiptPrefix}
                onChange={(event) =>
                  updateSettings({
                    receiptPrefix: sanitizeReceiptPrefix(event.target.value),
                  })
                }
                placeholder="POS"
              />
              <p className={hintClass}>
                Next: {sanitizeReceiptPrefix(settings.receiptPrefix)}-1001
              </p>
            </div>
            <div className={fieldClass}>
              <Label htmlFor="pos-default-mode" className={labelClass}>
                Open register on
              </Label>
              <Select
                value={settings.defaultRegisterMode}
                onValueChange={(value) =>
                  updateSettings({
                    defaultRegisterMode: value as PosSettings["defaultRegisterMode"],
                  })
                }
              >
                <SelectTrigger id="pos-default-mode" className={selectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">New sale</SelectItem>
                  <SelectItem value="return">Returns</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className={fieldClass}>
              <Label htmlFor="pos-recent-limit" className={labelClass}>
                Recent sales on register
              </Label>
              <Select
                value={String(settings.recentSalesLimit)}
                onValueChange={(value) =>
                  updateSettings({ recentSalesLimit: Number(value) })
                }
              >
                <SelectTrigger id="pos-recent-limit" className={selectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECENT_SALES_OPTIONS.map((count) => (
                    <SelectItem key={count} value={String(count)}>
                      {count} receipts
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          compact
          title="Product catalog"
          description="How items appear on the grid."
          icon={<IconLayoutGrid stroke={1.75} />}
          iconClassName="bg-sky-500/10 text-sky-600 dark:text-sky-400"
        >
          <div className={formGridClass}>
            <div className={fieldClass}>
              <Label htmlFor="pos-catalog-columns" className={labelClass}>
                Grid columns
              </Label>
              <Select
                value={String(settings.catalogColumns)}
                onValueChange={(value) =>
                  updateSettings({
                    catalogColumns: Number(value) as PosSettings["catalogColumns"],
                  })
                }
              >
                <SelectTrigger id="pos-catalog-columns" className={selectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLUMN_OPTIONS.map((count) => (
                    <SelectItem key={count} value={String(count)}>
                      {count} columns
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className={fieldClass}>
              <Label htmlFor="pos-low-stock" className={labelClass}>
                Low stock warning at
              </Label>
              <Input
                id="pos-low-stock"
                className={inputClass}
                type="number"
                min={1}
                max={99}
                value={settings.lowStockThreshold}
                onChange={(event) => {
                  const parsed = Number(event.target.value)
                  if (Number.isFinite(parsed)) {
                    updateSettings({
                      lowStockThreshold: Math.min(99, Math.max(1, parsed)),
                    })
                  }
                }}
              />
            </div>
          </div>
          <div className={toggleStackClass}>
            <SettingsToggleRow
              compact
              title="Show SKU on product cards"
              checked={settings.showSkuOnCards}
              onCheckedChange={(checked) => updateSettings({ showSkuOnCards: checked })}
            />
            <SettingsToggleRow
              compact
              title="Show stock on product cards"
              checked={settings.showStockOnCards}
              onCheckedChange={(checked) => updateSettings({ showStockOnCards: checked })}
            />
            <SettingsToggleRow
              compact
              title="Hide out-of-stock on sales"
              description="When off, items still appear but cannot be added."
              checked={settings.hideOutOfStockOnSale}
              onCheckedChange={(checked) => updateSettings({ hideOutOfStockOnSale: checked })}
            />
          </div>
        </SettingsSection>
      </div>

      <SettingsSection
        compact
        title="Checkout & payments"
        description="Defaults and rules when completing a sale or return."
        icon={<IconCreditCard stroke={1.75} />}
        iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      >
        <div className={formGridClass}>
          <div className={fieldClass}>
            <Label htmlFor="pos-default-payment" className={labelClass}>
              Default payment method
            </Label>
            <Select
              value={settings.defaultPaymentMethod}
              onValueChange={(value) =>
                updateSettings({
                  defaultPaymentMethod: value as PosSettings["defaultPaymentMethod"],
                })
              }
            >
              <SelectTrigger id="pos-default-payment" className={selectTriggerClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {settings.enabledPaymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className={fieldClass}>
            <Label htmlFor="pos-max-discount" className={labelClass}>
              Max discount (%)
            </Label>
            <Input
              id="pos-max-discount"
              className={inputClass}
              type="number"
              min={0}
              max={100}
              value={settings.maxDiscountPercent}
              onChange={(event) => {
                const parsed = Number(event.target.value)
                if (Number.isFinite(parsed)) {
                  updateSettings({
                    maxDiscountPercent: Math.min(100, Math.max(0, parsed)),
                  })
                }
              }}
            />
            <p className={hintClass}>0 = no limit</p>
          </div>
          <div className={fieldClass}>
            <Label htmlFor="pos-default-sale-status" className={labelClass}>
              Default sale status
            </Label>
            <Select
              value={settings.defaultSaleStatus}
              onValueChange={(value) =>
                updateSettings({
                  defaultSaleStatus: value as PosSettings["defaultSaleStatus"],
                })
              }
            >
              <SelectTrigger id="pos-default-sale-status" className={selectTriggerClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className={fieldClass}>
            <Label htmlFor="pos-default-return-status" className={labelClass}>
              Default return status
            </Label>
            <Select
              value={settings.defaultReturnStatus}
              onValueChange={(value) =>
                updateSettings({
                  defaultReturnStatus: value as PosSettings["defaultReturnStatus"],
                })
              }
            >
              <SelectTrigger id="pos-default-return-status" className={selectTriggerClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className={toggleStackClass}>
          <SettingsToggleRow
            compact
            title="Allow cart discounts"
            checked={settings.allowDiscounts}
            onCheckedChange={(checked) => updateSettings({ allowDiscounts: checked })}
          />
          <SettingsToggleRow
            compact
            title="Allow line price edits"
            description="Override line total on cart items."
            checked={settings.allowLinePriceEdit}
            onCheckedChange={(checked) => updateSettings({ allowLinePriceEdit: checked })}
          />
          <SettingsToggleRow
            compact
            title="Allow partial payment"
            description="Paid amount can be less than total."
            checked={settings.allowPartialPayment}
            onCheckedChange={(checked) => updateSettings({ allowPartialPayment: checked })}
          />
          <SettingsToggleRow
            compact
            title="Require customer"
            description="Block checkout while Walk-in is selected."
            checked={settings.requireCustomer}
            onCheckedChange={(checked) => updateSettings({ requireCustomer: checked })}
          />
          <SettingsToggleRow
            compact
            title="Confirm before completing"
            checked={settings.confirmBeforeComplete}
            onCheckedChange={(checked) =>
              updateSettings({ confirmBeforeComplete: checked })
            }
          />
        </div>

        <div className="border-border/40 space-y-2 border-t pt-3">
          <p className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">
            Enabled payment methods
          </p>
          <PaymentMethodToggles settings={settings} updateSettings={updateSettings} />
        </div>
      </SettingsSection>

      <div className="grid gap-3 xl:grid-cols-2">
        <SettingsSection
          compact
          title="Receipts"
          description="Printed and PDF receipt behavior."
          icon={<IconReceipt stroke={1.75} />}
          iconClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        >
          <div className={fieldClass}>
            <Label htmlFor="pos-receipt-footer" className={labelClass}>
              Receipt footer note
            </Label>
            <textarea
              id="pos-receipt-footer"
              value={settings.receiptFooterNote}
              onChange={(event) =>
                updateSettings({ receiptFooterNote: event.target.value.slice(0, 200) })
              }
              placeholder="Thank you for shopping with us!"
              rows={2}
              className={cn(
                "border-input bg-background placeholder:text-muted-foreground flex min-h-[64px] w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              )}
            />
          </div>
          <SettingsToggleRow
            compact
            title="Auto-download PDF after sale"
            description="Opens receipt PDF when a sale completes."
            checked={settings.autoOpenReceiptPdf}
            onCheckedChange={(checked) => updateSettings({ autoOpenReceiptPdf: checked })}
          />
        </SettingsSection>

        <SettingsSection
          compact
          title="Inventory"
          description="Stock validation and deduction."
          icon={<IconPackage stroke={1.75} />}
          iconClassName="bg-orange-500/10 text-orange-600 dark:text-orange-400"
        >
          <div className={toggleStackClass}>
            <SettingsToggleRow
              compact
              title="Allow overselling"
              description="Sell when stock is insufficient."
              checked={settings.allowOverselling}
              onCheckedChange={(checked) => updateSettings({ allowOverselling: checked })}
            />
            <SettingsToggleRow
              compact
              title="Deduct stock on pending sales"
              description="When off, stock updates only on Completed."
              checked={settings.deductStockOnPending}
              onCheckedChange={(checked) => updateSettings({ deductStockOnPending: checked })}
            />
          </div>
        </SettingsSection>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SettingsSection
          compact
          title="Register UX"
          description="Small workflow improvements."
          icon={<IconSparkles stroke={1.75} />}
          iconClassName="bg-violet-500/10 text-violet-600 dark:text-violet-400"
        >
          <SettingsToggleRow
            compact
            title="Focus search after sale"
            description="Return cursor to product search after checkout."
            checked={settings.autoFocusSearchAfterSale}
            onCheckedChange={(checked) =>
              updateSettings({ autoFocusSearchAfterSale: checked })
            }
          />
        </SettingsSection>

        <SettingsSection
          compact
          title="Reset"
          description="Restore factory defaults."
          icon={<IconRefresh stroke={1.75} />}
          iconClassName="bg-muted text-muted-foreground"
          contentClassName="space-y-0"
          footer={
            <Button type="button" variant="outline" size="sm" onClick={handleReset}>
              Reset to defaults
            </Button>
          }
        >
          <p className={hintClass}>
            Defaults: {DEFAULT_POS_SETTINGS.registerName} ·{" "}
            {DEFAULT_POS_SETTINGS.receiptPrefix} receipts ·{" "}
            {statusLabel(DEFAULT_POS_SETTINGS.defaultSaleStatus)} sales
          </p>
        </SettingsSection>
      </div>
    </div>
  )
}
