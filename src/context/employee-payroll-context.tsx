"use client"

import * as React from "react"
import {
  type PayrollRecord,
  PAYROLL_STORAGE_KEY,
  initialPayrollRecords,
  parsePersistedPayroll,
} from "@/lib/employee-payroll"

type PayrollContextValue = {
  records: PayrollRecord[]
  setRecords: React.Dispatch<React.SetStateAction<PayrollRecord[]>>
  addRecord: (row: Omit<PayrollRecord, "id">) => PayrollRecord
  updateRecord: (id: number, patch: Partial<PayrollRecord>) => void
  removeRecord: (id: number) => void
  getRecordsForEmployee: (employeeId: number) => PayrollRecord[]
}

const PayrollContext = React.createContext<PayrollContextValue | null>(null)

export function PayrollProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = React.useState<PayrollRecord[]>(() => [
    ...initialPayrollRecords,
  ])
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    const saved = parsePersistedPayroll(
      typeof window !== "undefined"
        ? window.localStorage.getItem(PAYROLL_STORAGE_KEY)
        : null
    )
    if (saved) setRecords(saved)
    setHydrated(true)
  }, [])

  React.useEffect(() => {
    if (!hydrated || typeof window === "undefined") return
    window.localStorage.setItem(PAYROLL_STORAGE_KEY, JSON.stringify(records))
  }, [records, hydrated])

  const addRecord = React.useCallback((row: Omit<PayrollRecord, "id">) => {
    let created = { ...row, id: 0 } as PayrollRecord
    setRecords((prev) => {
      const maxId = prev.reduce((m, x) => Math.max(m, x.id), 0)
      created = { ...row, id: maxId + 1 }
      return [...prev, created]
    })
    return created
  }, [])

  const updateRecord = React.useCallback((id: number, patch: Partial<PayrollRecord>) => {
    setRecords((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch, id: row.id } : row))
    )
  }, [])

  const removeRecord = React.useCallback((id: number) => {
    setRecords((prev) => prev.filter((row) => row.id !== id))
  }, [])

  const getRecordsForEmployee = React.useCallback(
    (employeeId: number) =>
      records.filter((row) => row.employeeId === employeeId).sort((a, b) =>
        b.period.localeCompare(a.period)
      ),
    [records]
  )

  const value = React.useMemo(
    () => ({
      records,
      setRecords,
      addRecord,
      updateRecord,
      removeRecord,
      getRecordsForEmployee,
    }),
    [records, addRecord, updateRecord, removeRecord, getRecordsForEmployee]
  )

  return <PayrollContext.Provider value={value}>{children}</PayrollContext.Provider>
}

export function usePayroll() {
  const ctx = React.useContext(PayrollContext)
  if (!ctx) throw new Error("usePayroll must be used within PayrollProvider")
  return ctx
}
