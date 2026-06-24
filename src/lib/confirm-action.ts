"use client"

import Swal from "sweetalert2"
import "sweetalert2/dist/sweetalert2.min.css"

type ConfirmActionOptions = {
  itemName?: string
  count?: number
  entityLabel?: string
}

type ConfirmReturnOptions = {
  scope: "item" | "invoice"
  itemName?: string
  referenceNumber?: string
  totalAmount?: string
  refundDue?: string
}

function pluralEntity(label: string, count: number) {
  return count === 1 ? label : `${label}s`
}

export async function confirmDeleteAction({
  itemName,
  count,
  entityLabel = "item",
}: ConfirmActionOptions): Promise<boolean> {
  const isBulk = count != null && count > 0
  const title = isBulk
    ? `Delete ${count} ${pluralEntity(entityLabel, count)}?`
    : `Delete ${itemName ?? entityLabel}?`

  const text = isBulk
    ? `This will permanently remove ${count} selected ${pluralEntity(entityLabel, count)}. This action cannot be undone.`
    : itemName
      ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
      : "This action cannot be undone."

  const result = await Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#dc2626",
    reverseButtons: true,
    focusCancel: true,
  })

  return result.isConfirmed
}

export async function confirmCancelAction({
  itemName,
  count,
  entityLabel = "item",
}: ConfirmActionOptions): Promise<boolean> {
  const isBulk = count != null && count > 0
  const title = isBulk
    ? `Cancel ${count} pending ${pluralEntity(entityLabel, count)}?`
    : `Cancel ${itemName ?? entityLabel}?`

  const text = isBulk
    ? `These pending ${pluralEntity(entityLabel, count)} will be marked as cancelled.`
    : itemName
      ? `Cancel pending "${itemName}"? Unpaid items cannot be returned — they will be cancelled instead.`
      : "This pending item will be marked as cancelled."

  const result = await Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, cancel",
    cancelButtonText: "Keep",
    confirmButtonColor: "#dc2626",
    reverseButtons: true,
    focusCancel: true,
  })

  return result.isConfirmed
}

export async function confirmReturnAction({
  scope,
  itemName,
  referenceNumber,
  totalAmount,
  refundDue,
}: ConfirmReturnOptions): Promise<boolean> {
  const title =
    scope === "invoice"
      ? `Return ${itemName ?? "invoice"}?`
      : `Return ${itemName ?? "item"}?`

  const parts: string[] = []
  if (scope === "item" && referenceNumber) {
    parts.push(`From invoice ${referenceNumber}.`)
  }
  if (scope === "invoice") {
    parts.push("All line items on this invoice will be returned.")
  } else {
    parts.push("This line item will be returned.")
  }
  if (totalAmount && Number(totalAmount) > 0) {
    parts.push(`Return amount: ${totalAmount}.`)
  }
  if (refundDue && Number(refundDue) > 0) {
    parts.push(`Refund due: ${refundDue}.`)
  }

  const result = await Swal.fire({
    title,
    text: parts.join(" "),
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes, return",
    cancelButtonText: "Cancel",
    reverseButtons: true,
    focusCancel: true,
  })

  return result.isConfirmed
}

export async function confirmDuplicateAction({
  itemName,
  entityLabel = "item",
}: ConfirmActionOptions): Promise<boolean> {
  const label = itemName ?? entityLabel
  const result = await Swal.fire({
    title: `Duplicate ${label}?`,
    text: itemName
      ? `A copy of "${itemName}" will be created.`
      : `A copy of this ${entityLabel} will be created.`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes, duplicate",
    cancelButtonText: "Cancel",
    reverseButtons: true,
    focusCancel: true,
  })

  return result.isConfirmed
}

export async function confirmSelectInvoiceTemplateAction({
  templateName,
}: {
  templateName: string
}): Promise<boolean> {
  const result = await Swal.fire({
    title: `Use ${templateName}?`,
    text: `"${templateName}" will be set as your active invoice template for PDF downloads.`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes, use template",
    cancelButtonText: "Cancel",
    reverseButtons: true,
    focusCancel: true,
  })

  return result.isConfirmed
}
