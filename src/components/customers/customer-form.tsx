"use client"

import type { FormEvent } from "react"
import { CustomerImageField } from "@/components/customers/customer-image-field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CustomerRow } from "@/lib/customers"

type CustomerFormProps = {
  formId: string
  customer: CustomerRow
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
}

export function CustomerForm({ formId, customer, onSubmit }: CustomerFormProps) {
  return (
    <form id={formId} className="flex flex-col gap-4 text-sm" onSubmit={onSubmit}>
      <CustomerImageField
        id={`${formId}-image`}
        name={customer.name || "Customer"}
        initialUrl={customer.imageUrl}
      />
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${formId}-name`}>Customer name</Label>
        <Input
          id={`${formId}-name`}
          name="name"
          required
          defaultValue={customer.name}
          placeholder="Company or person"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${formId}-description`}>Description</Label>
        <Input
          id={`${formId}-description`}
          name="description"
          defaultValue={customer.description === "—" ? "" : customer.description}
          placeholder="Notes, terms, segment…"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${formId}-openingBalance`}>Opening balance</Label>
          <Input
            id={`${formId}-openingBalance`}
            name="openingBalance"
            defaultValue={customer.openingBalance}
            placeholder="0.00"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${formId}-totalSales`}>Total sales</Label>
          <Input
            id={`${formId}-totalSales`}
            name="totalSales"
            defaultValue={customer.totalSales}
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
            defaultValue={customer.totalPayments}
            placeholder="0.00"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${formId}-phone`}>Phone number</Label>
          <Input
            id={`${formId}-phone`}
            name="phone"
            defaultValue={customer.phone === "—" ? "" : customer.phone}
            placeholder="+92 300 1234567"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${formId}-status`}>Status</Label>
        <select
          id={`${formId}-status`}
          name="status"
          defaultValue={customer.status}
          className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
    </form>
  )
}
