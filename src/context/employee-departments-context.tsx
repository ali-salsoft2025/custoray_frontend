"use client"

import * as React from "react"
import {
  type DepartmentRow,
  DEPARTMENTS_STORAGE_KEY,
  initialDepartments,
  parsePersistedDepartments,
} from "@/lib/employee-departments"
import { nextUniqueNumericId } from "@/lib/utils"

type DepartmentsContextValue = {
  departments: DepartmentRow[]
  setDepartments: React.Dispatch<React.SetStateAction<DepartmentRow[]>>
  addDepartment: (row: Omit<DepartmentRow, "id">) => DepartmentRow
  updateDepartment: (id: number, patch: Partial<DepartmentRow>) => void
  removeDepartment: (id: number) => void
}

const DepartmentsContext = React.createContext<DepartmentsContextValue | null>(null)

export function DepartmentsProvider({ children }: { children: React.ReactNode }) {
  const [departments, setDepartments] = React.useState<DepartmentRow[]>(() => [
    ...initialDepartments,
  ])
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const saved =
      parsePersistedDepartments(
        window.localStorage.getItem(DEPARTMENTS_STORAGE_KEY)
      ) ??
      parsePersistedDepartments(
        window.localStorage.getItem("custoray-departments-v1")
      )
    if (saved) setDepartments(saved)
    setHydrated(true)
  }, [])

  React.useEffect(() => {
    if (!hydrated || typeof window === "undefined") return
    window.localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(departments))
  }, [departments, hydrated])

  const addDepartment = React.useCallback((row: Omit<DepartmentRow, "id">) => {
    let created = { ...row, id: 0 } as DepartmentRow
    setDepartments((prev) => {
      const id = nextUniqueNumericId(prev)
      created = { ...row, id }
      return [...prev, created]
    })
    return created
  }, [])

  const updateDepartment = React.useCallback((id: number, patch: Partial<DepartmentRow>) => {
    setDepartments((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch, id: row.id } : row))
    )
  }, [])

  const removeDepartment = React.useCallback((id: number) => {
    setDepartments((prev) => prev.filter((row) => row.id !== id))
  }, [])

  const value = React.useMemo(
    () => ({
      departments,
      setDepartments,
      addDepartment,
      updateDepartment,
      removeDepartment,
    }),
    [departments, addDepartment, updateDepartment, removeDepartment]
  )

  return (
    <DepartmentsContext.Provider value={value}>{children}</DepartmentsContext.Provider>
  )
}

export function useDepartments() {
  const ctx = React.useContext(DepartmentsContext)
  if (!ctx) throw new Error("useDepartments must be used within DepartmentsProvider")
  return ctx
}
