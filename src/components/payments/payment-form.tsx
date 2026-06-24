"use client"

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"

import { CustomerQuickAddSheet } from "@/components/customers/customer-quick-add-sheet"
import { VendorQuickAddSheet } from "@/components/vendors/vendor-quick-add-sheet"
import { InfiniteScrollSelect } from "@/components/ui/infinite-scroll-select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCustomers } from "@/context/customers-context"
import { useVendors } from "@/context/vendors-context"
import { PAYMENT_METHODS, type PaymentRow } from "@/lib/payments"

type PaymentFormProps = {
  formId: string
  payment: PaymentRow
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  lockType?: PaymentRow["type"]
}

function resolvePartyId(
  parties: { id: number; name: string }[],
  name: string
) {
  const normalized = name.trim()
  if (!normalized) return ""
  const match = parties.find((party) => party.name === normalized)
  return match ? String(match.id) : ""
}

export function PaymentForm({
  formId,
  payment,
  onSubmit,
  lockType,
}: PaymentFormProps) {
  const { customers } = useCustomers()
  const { vendors } = useVendors()

  const initialType = lockType ?? payment.type
  const [type, setType] = useState<PaymentRow["type"]>(initialType)
  const parties = type === "customer" ? customers : vendors
  const [partyId, setPartyId] = useState(() =>
    resolvePartyId(parties, payment.partyName)
  )
  const [quickAdd, setQuickAdd] = useState<"customer" | "vendor" | null>(null)

  const customerQuickAddFormId = `${formId}-customer-quick-add`
  const vendorQuickAddFormId = `${formId}-vendor-quick-add`

  const handleCustomerCreated = useCallback((created: { id: number }) => {
    setPartyId(String(created.id))
    setQuickAdd(null)
  }, [])

  const handleVendorCreated = useCallback((created: { id: number }) => {
    setPartyId(String(created.id))
    setQuickAdd(null)
  }, [])

  useEffect(() => {
    if (lockType) setType(lockType)
  }, [lockType])

  useEffect(() => {
    const nextParties = type === "customer" ? customers : vendors
    const resolved = resolvePartyId(nextParties, payment.partyName)
    setPartyId(resolved)
  }, [type, customers, vendors, payment.partyName])

  const partyOptions = useMemo(
    () =>
      parties.map((party) => ({
        value: String(party.id),
        label: party.name,
        description: party.description !== "—" ? party.description : party.phone,
      })),
    [parties]
  )

  const partyName = useMemo(() => {
    if (!partyId) return payment.partyName
    const party = parties.find((item) => String(item.id) === partyId)
    return party?.name ?? payment.partyName
  }, [partyId, parties, payment.partyName])

  const referenceLabel = type === "customer" ? "Invoice reference" : "Purchase reference"

  return (
    <>
    <form id={formId} className="flex flex-col gap-4 text-sm" onSubmit={onSubmit}>
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="partyName" value={partyName} />

      {!lockType ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${formId}-type`}>Payment type</Label>
          <select
            id={`${formId}-type`}
            value={type}
            onChange={(e) => {
              setType(e.target.value as PaymentRow["type"])
              setPartyId("")
            }}
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          >
            <option value="customer">Customer payment</option>
            <option value="vendor">Vendor payment</option>
          </select>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label>{type === "customer" ? "Customer" : "Vendor"}</Label>
        <InfiniteScrollSelect
          id={`${formId}-party`}
          value={partyId}
          onValueChange={setPartyId}
          options={partyOptions}
          placeholder={type === "customer" ? "Select customer…" : "Select vendor…"}
          searchPlaceholder="Search…"
          emptyMessage={type === "customer" ? "No customers found." : "No vendors found."}
          pageSize={10}
          onAddNew={
            type === "customer"
              ? () => setQuickAdd("customer")
              : () => setQuickAdd("vendor")
          }
          addNewLabel={type === "customer" ? "Add customer" : "Add vendor"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${formId}-paymentNumber`}>Payment #</Label>
          <Input
            id={`${formId}-paymentNumber`}
            name="paymentNumber"
            defaultValue={payment.paymentNumber}
            placeholder="Auto-generated if empty"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${formId}-paymentDate`}>Payment date</Label>
          <Input
            id={`${formId}-paymentDate`}
            name="paymentDate"
            type="date"
            required
            defaultValue={payment.paymentDate}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${formId}-referenceNumber`}>{referenceLabel}</Label>
        <Input
          id={`${formId}-referenceNumber`}
          name="referenceNumber"
          defaultValue={payment.referenceNumber === "—" ? "" : payment.referenceNumber}
          placeholder={type === "customer" ? "INV-1001" : "PO-2001"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${formId}-amount`}>Amount</Label>
          <Input
            id={`${formId}-amount`}
            name="amount"
            required
            defaultValue={payment.amount}
            placeholder="0.00"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${formId}-paymentMethod`}>Payment method</Label>
          <select
            id={`${formId}-paymentMethod`}
            name="paymentMethod"
            defaultValue={payment.paymentMethod}
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${formId}-status`}>Status</Label>
        <select
          id={`${formId}-status`}
          name="status"
          defaultValue={payment.status}
          className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        >
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="voided">Voided</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${formId}-notes`}>Notes</Label>
        <Input
          id={`${formId}-notes`}
          name="notes"
          defaultValue={payment.notes === "—" ? "" : payment.notes}
          placeholder="Optional notes"
        />
      </div>
    </form>

    <CustomerQuickAddSheet
      open={quickAdd === "customer"}
      onOpenChange={(open) => {
        if (!open) setQuickAdd(null)
      }}
      formId={customerQuickAddFormId}
      onCreated={handleCustomerCreated}
    />

    <VendorQuickAddSheet
      open={quickAdd === "vendor"}
      onOpenChange={(open) => {
        if (!open) setQuickAdd(null)
      }}
      formId={vendorQuickAddFormId}
      onCreated={handleVendorCreated}
    />
  </>
  )
}
