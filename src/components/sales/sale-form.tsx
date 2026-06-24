"use client"

import type { FormEvent } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PAYMENT_METHODS, type SaleRow } from "@/lib/sales"

type SaleFormProps = {
  formId: string
  sale: SaleRow
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
}

export function SaleForm({ formId, sale, onSubmit }: SaleFormProps) {
  return (
    <form id={formId} className="flex flex-col gap-4 text-sm" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${formId}-saleNumber`}>Sale number</Label>
          <Input
            id={`${formId}-saleNumber`}
            name="saleNumber"
            defaultValue={sale.saleNumber}
            placeholder="S-1006"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${formId}-saleDate`}>Sale date</Label>
          <Input
            id={`${formId}-saleDate`}
            name="saleDate"
            type="date"
            defaultValue={sale.saleDate}
            required
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${formId}-customerName`}>Customer</Label>
        <Input
          id={`${formId}-customerName`}
          name="customerName"
          required
          defaultValue={sale.customerName === "—" ? "" : sale.customerName}
          placeholder="Customer or company name"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${formId}-description`}>Description</Label>
        <Input
          id={`${formId}-description`}
          name="description"
          defaultValue={sale.description === "—" ? "" : sale.description}
          placeholder="Items, notes, delivery details…"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${formId}-totalAmount`}>Total amount</Label>
          <Input
            id={`${formId}-totalAmount`}
            name="totalAmount"
            defaultValue={sale.totalAmount}
            placeholder="0.00"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${formId}-paidAmount`}>Paid amount</Label>
          <Input
            id={`${formId}-paidAmount`}
            name="paidAmount"
            defaultValue={sale.paidAmount}
            placeholder="0.00"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${formId}-paymentMethod`}>Payment method</Label>
          <select
            id={`${formId}-paymentMethod`}
            name="paymentMethod"
            defaultValue={sale.paymentMethod}
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${formId}-status`}>Status</Label>
          <select
            id={`${formId}-status`}
            name="status"
            defaultValue={sale.status}
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          >
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
    </form>
  )
}
