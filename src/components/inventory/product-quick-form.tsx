"use client"

import type { FormEvent } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ProductRow } from "@/lib/products"

type ProductQuickFormProps = {
  formId: string
  product: ProductRow
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
}

export function ProductQuickForm({ formId, product, onSubmit }: ProductQuickFormProps) {
  return (
    <form id={formId} className="flex flex-col gap-4 text-sm" onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${formId}-name`}>Product name</Label>
        <Input
          id={`${formId}-name`}
          name="name"
          required
          defaultValue={product.name}
          placeholder="Product name"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${formId}-sku`}>SKU</Label>
          <Input
            id={`${formId}-sku`}
            name="sku"
            defaultValue={product.sku}
            placeholder="Auto-generated if empty"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${formId}-salePrice`}>Sale price</Label>
          <Input
            id={`${formId}-salePrice`}
            name="salePrice"
            required
            defaultValue={product.salePrice}
            placeholder="100.00"
          />
        </div>
      </div>
    </form>
  )
}
