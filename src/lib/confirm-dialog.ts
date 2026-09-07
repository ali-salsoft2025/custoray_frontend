export type ConfirmTone = "danger" | "question" | "info"

export type ConfirmDialogInput = {
  type: "number"
  min: number
  max: number
  defaultValue: number
  label: string
  hint?: string
  invalidMin?: string
  invalidMax?: string
}

export type ConfirmDialogRequest = {
  title: string
  description: string
  confirmLabel: string
  cancelLabel: string
  variant?: "default" | "destructive"
  tone?: ConfirmTone
  input?: ConfirmDialogInput
}

export type ConfirmDialogResult = {
  confirmed: boolean
  value?: number
}

type ConfirmFn = (request: ConfirmDialogRequest) => Promise<ConfirmDialogResult>

let confirmImpl: ConfirmFn | null = null

export function registerConfirmDialog(fn: ConfirmFn | null) {
  confirmImpl = fn
}

export function openConfirmDialog(
  request: ConfirmDialogRequest
): Promise<ConfirmDialogResult> {
  if (!confirmImpl) {
    return Promise.resolve({ confirmed: false })
  }
  return confirmImpl(request)
}
