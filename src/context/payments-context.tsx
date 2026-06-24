"use client"

import * as React from "react"
import {
  type PaymentRow,
  PAYMENTS_STORAGE_KEY,
  initialPayments,
  nextPaymentNumber,
  parsePersistedPayments,
} from "@/lib/payments"

type PaymentsContextValue = {
  payments: PaymentRow[]
  setPayments: React.Dispatch<React.SetStateAction<PaymentRow[]>>
  getPayment: (id: number) => PaymentRow | undefined
  addPayment: (payment: Omit<PaymentRow, "id">) => PaymentRow
  updatePayment: (id: number, patch: Partial<PaymentRow>) => void
  removePayment: (id: number) => void
  duplicatePayment: (id: number) => PaymentRow | null
}

const PaymentsContext = React.createContext<PaymentsContextValue | null>(null)

export function PaymentsProvider({ children }: { children: React.ReactNode }) {
  const [payments, setPayments] = React.useState<PaymentRow[]>(() => [...initialPayments])
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    const saved = parsePersistedPayments(
      typeof window !== "undefined"
        ? window.localStorage.getItem(PAYMENTS_STORAGE_KEY)
        : null
    )
    if (saved) setPayments(saved)
    setHydrated(true)
  }, [])

  React.useEffect(() => {
    if (!hydrated || typeof window === "undefined") return
    window.localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(payments))
  }, [payments, hydrated])

  const getPayment = React.useCallback(
    (id: number) => payments.find((row) => row.id === id),
    [payments]
  )

  const addPayment = React.useCallback((payment: Omit<PaymentRow, "id">) => {
    let created = { ...payment, id: 0 } as PaymentRow
    setPayments((prev) => {
      const maxId = prev.reduce((m, x) => Math.max(m, x.id), 0)
      created = {
        ...payment,
        id: maxId + 1,
        paymentNumber:
          payment.paymentNumber.trim() || nextPaymentNumber(prev, payment.type),
      }
      return [...prev, created]
    })
    return created
  }, [])

  const updatePayment = React.useCallback((id: number, patch: Partial<PaymentRow>) => {
    setPayments((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch, id: row.id } : row))
    )
  }, [])

  const removePayment = React.useCallback((id: number) => {
    setPayments((prev) => prev.filter((row) => row.id !== id))
  }, [])

  const duplicatePayment = React.useCallback((id: number) => {
    let copy: PaymentRow | null = null
    setPayments((prev) => {
      const source = prev.find((row) => row.id === id)
      if (!source) return prev
      const maxId = prev.reduce((m, x) => Math.max(m, x.id), 0)
      copy = {
        ...source,
        id: maxId + 1,
        paymentNumber: nextPaymentNumber(prev, source.type),
        status: "pending",
      }
      return [...prev, copy]
    })
    return copy
  }, [])

  const value = React.useMemo(
    () => ({
      payments,
      setPayments,
      getPayment,
      addPayment,
      updatePayment,
      removePayment,
      duplicatePayment,
    }),
    [payments, getPayment, addPayment, updatePayment, removePayment, duplicatePayment]
  )

  return <PaymentsContext.Provider value={value}>{children}</PaymentsContext.Provider>
}

export function usePayments() {
  const ctx = React.useContext(PaymentsContext)
  if (!ctx) {
    throw new Error("usePayments must be used within PaymentsProvider")
  }
  return ctx
}
