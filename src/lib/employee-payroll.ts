import { z } from "zod"

import i18n from "@/i18n"
import { formatMoney } from "@/lib/customers"
import { normalizeUniqueNumericIds } from "@/lib/utils"

export { formatMoney }

export const PAYROLL_STATUSES = ["draft", "pending", "paid"] as const
export type PayrollStatus = (typeof PAYROLL_STATUSES)[number]

export const payrollRecordSchema = z.object({
  id: z.number(),
  employeeId: z.number(),
  period: z.string(),
  baseSalary: z.string(),
  bonuses: z.string(),
  commissions: z.string().default("0"),
  deductions: z.string(),
  netPay: z.string(),
  status: z.enum(PAYROLL_STATUSES),
  paidDate: z.string(),
  notes: z.string(),
})

export type PayrollRecord = z.infer<typeof payrollRecordSchema>

export const PAYROLL_STORAGE_KEY = "custoray-payroll-v1"

export const initialPayrollRecords: PayrollRecord[] = [
  {
    id: 1,
    employeeId: 1,
    period: "2026-05",
    baseSalary: "85000.00",
    bonuses: "5000.00",
    commissions: "0.00",
    deductions: "2500.00",
    netPay: "87500.00",
    status: "paid",
    paidDate: "2026-05-28",
    notes: "May salary — includes sales bonus",
  },
  {
    id: 2,
    employeeId: 2,
    period: "2026-05",
    baseSalary: "45000.00",
    bonuses: "0.00",
    commissions: "0.00",
    deductions: "1200.00",
    netPay: "43800.00",
    status: "paid",
    paidDate: "2026-05-28",
    notes: "",
  },
  {
    id: 3,
    employeeId: 1,
    period: "2026-06",
    baseSalary: "85000.00",
    bonuses: "0.00",
    commissions: "3500.00",
    deductions: "2500.00",
    netPay: "82500.00",
    status: "pending",
    paidDate: "",
    notes: "June payroll — awaiting approval",
  },
]

export const EMPTY_PAYROLL: PayrollRecord = {
  id: 0,
  employeeId: 0,
  period: new Date().toISOString().slice(0, 7),
  baseSalary: "0",
  bonuses: "0",
  commissions: "0",
  deductions: "0",
  netPay: "0",
  status: "draft",
  paidDate: "",
  notes: "",
}

export function computeNetPay(
  baseSalary: string,
  bonuses: string,
  deductions: string,
  commissions = "0"
): string {
  const base = Number(baseSalary) || 0
  const bonus = Number(bonuses) || 0
  const commission = Number(commissions) || 0
  const deduct = Number(deductions) || 0
  return (base + bonus + commission - deduct).toFixed(2)
}

export function payrollStatusLabel(status: PayrollStatus): string {
  return i18n.t(`payrollPage.status.${status}`, { ns: "employees" })
}

export function payrollStatusClass(status: PayrollStatus): string {
  if (status === "paid") {
    return "border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
  }
  if (status === "pending") {
    return "border-amber-500/30 text-amber-700 dark:text-amber-400"
  }
  return "text-muted-foreground"
}

export function payrollFromFormData(fd: FormData, id: number): PayrollRecord {
  const baseSalary = String(fd.get("baseSalary") ?? "0").trim() || "0"
  const bonuses = String(fd.get("bonuses") ?? "0").trim() || "0"
  const commissions = String(fd.get("commissions") ?? "0").trim() || "0"
  const deductions = String(fd.get("deductions") ?? "0").trim() || "0"
  return {
    id,
    employeeId: Number(fd.get("employeeId") ?? 0),
    period: String(fd.get("period") ?? "").trim(),
    baseSalary,
    bonuses,
    commissions,
    deductions,
    netPay: computeNetPay(baseSalary, bonuses, deductions, commissions),
    status: (String(fd.get("status") ?? "draft") as PayrollStatus) || "draft",
    paidDate: String(fd.get("paidDate") ?? "").trim(),
    notes: String(fd.get("notes") ?? "").trim(),
  }
}

export function parsePersistedPayroll(raw: string | null): PayrollRecord[] | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return null
    const rows: PayrollRecord[] = []
    for (const item of parsed) {
      const result = payrollRecordSchema.safeParse(item)
      if (result.success) rows.push(result.data)
    }
    return rows.length > 0 ? normalizeUniqueNumericIds(rows) : null
  } catch {
    return null
  }
}
