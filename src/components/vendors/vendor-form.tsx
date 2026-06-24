"use client"

import type { FormEvent } from "react"
import { VendorImageField } from "@/components/vendors/vendor-image-field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { VendorRow } from "@/lib/vendors"

type VendorFormProps = {
  formId: string
  vendor: VendorRow
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
}

export function VendorForm({ formId, vendor, onSubmit }: VendorFormProps) {
  return (
    <form id={formId} className="flex flex-col gap-4 text-sm" onSubmit={onSubmit}>
      <VendorImageField
        id={`${formId}-image`}
        name={vendor.name || "Vendor"}
        initialUrl={vendor.imageUrl}
      />
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${formId}-name`}>Vendor name</Label>
        <Input
          id={`${formId}-name`}
          name="name"
          required
          defaultValue={vendor.name}
          placeholder="Company or supplier"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${formId}-description`}>Description</Label>
        <Input
          id={`${formId}-description`}
          name="description"
          defaultValue={vendor.description === "—" ? "" : vendor.description}
          placeholder="Notes, terms, category…"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${formId}-openingBalance`}>Opening balance</Label>
          <Input
            id={`${formId}-openingBalance`}
            name="openingBalance"
            defaultValue={vendor.openingBalance}
            placeholder="0.00"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${formId}-totalPurchases`}>Total purchases</Label>
          <Input
            id={`${formId}-totalPurchases`}
            name="totalPurchases"
            defaultValue={vendor.totalPurchases}
            placeholder="0.00"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${formId}-totalPayments`}>Total payments</Label>
          <Input
            id={`${formId}-totalPayments`}
            name="totalPayments"
            defaultValue={vendor.totalPayments}
            placeholder="0.00"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${formId}-phone`}>Phone number</Label>
          <Input
            id={`${formId}-phone`}
            name="phone"
            defaultValue={vendor.phone === "—" ? "" : vendor.phone}
            placeholder="+92 300 1234567"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${formId}-status`}>Status</Label>
        <select
          id={`${formId}-status`}
          name="status"
          defaultValue={vendor.status}
          className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
    </form>
  )
}
