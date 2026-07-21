import { z } from "zod"

import { normalizeUniqueNumericIds } from "@/lib/utils"
export const LEAVE_TYPES = ["annual", "sick", "unpaid", "other"] as const
export type LeaveType = (typeof LEAVE_TYPES)[number]

export const LEAVE_STATUSES = ["pending", "approved", "rejected"] as const
export type LeaveStatus = (typeof LEAVE_STATUSES)[number]

export const leaveRecordSchema = z.object({
  id: z.number(),
  employeeId: z.number(),
  type: z.enum(LEAVE_TYPES),
  startDate: z.string(),
  endDate: z.string(),
  days: z.number(),
  reason: z.string(),
  status: z.enum(LEAVE_STATUSES),
})

export type LeaveRecord = z.infer<typeof leaveRecordSchema>

export const LEAVES_STORAGE_KEY = "custoray-leaves-v1"

export const initialLeaveRecords: LeaveRecord[] = [
  {
    id: 1,
    employeeId: 1,
    type: "annual",
    startDate: "2026-06-10",
    endDate: "2026-06-14",
    days: 5,
    reason: "Family trip",
    status: "approved",
  },
  {
    id: 2,
    employeeId: 2,
    type: "sick",
    startDate: "2026-06-03",
    endDate: "2026-06-04",
    days: 2,
    reason: "Flu",
    status: "approved",
  },
  {
    id: 3,
    employeeId: 1,
    type: "annual",
    startDate: "2026-07-01",
    endDate: "2026-07-05",
    days: 5,
    reason: "Summer break",
    status: "pending",
  },
]

export const EMPTY_LEAVE: LeaveRecord = {
  id: 0,
  employeeId: 0,
  type: "annual",
  startDate: "",
  endDate: "",
  days: 1,
  reason: "",
  status: "pending",
}

export function leaveTypeLabel(type: LeaveType): string {
  const labels: Record<LeaveType, string> = {
    annual: "Annual leave",
    sick: "Sick leave",
    unpaid: "Unpaid leave",
    other: "Other",
  }
  return labels[type]
}

export function leaveStatusLabel(status: LeaveStatus): string {
  if (status === "approved") return "Approved"
  if (status === "rejected") return "Rejected"
  return "Pending"
}

export function leaveStatusClass(status: LeaveStatus): string {
  if (status === "approved") {
    return "border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
  }
  if (status === "rejected") {
    return "border-red-500/30 text-red-700 dark:text-red-400"
  }
  return "border-amber-500/30 text-amber-700 dark:text-amber-400"
}

export function countLeaveDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 1
  }
  const diff = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
  return Math.max(1, diff)
}

export function leaveFromFormData(fd: FormData, id: number): LeaveRecord {
  const startDate = String(fd.get("startDate") ?? "").trim()
  const endDate = String(fd.get("endDate") ?? "").trim()
  return {
    id,
    employeeId: Number(fd.get("employeeId") ?? 0),
    type: String(fd.get("type") ?? "annual") as LeaveType,
    startDate,
    endDate,
    days: countLeaveDays(startDate, endDate),
    reason: String(fd.get("reason") ?? "").trim(),
    status: (String(fd.get("status") ?? "pending") as LeaveStatus) || "pending",
  }
}

export function parsePersistedLeaves(raw: string | null): LeaveRecord[] | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return null
    const rows: LeaveRecord[] = []
    for (const item of parsed) {
      const result = leaveRecordSchema.safeParse(item)
      if (result.success) rows.push(result.data)
    }
    return rows.length > 0 ? normalizeUniqueNumericIds(rows) : null
  } catch {
    return null
  }
}
