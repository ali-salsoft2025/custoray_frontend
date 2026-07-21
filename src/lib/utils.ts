import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Pick a numeric id that is not already used in `existing`. */
export function nextUniqueNumericId(
  existing: readonly { id: number }[],
  preferred?: number
): number {
  const taken = new Set(existing.map((row) => row.id))
  let maxId = existing.reduce((max, row) => Math.max(max, row.id), 0)

  if (
    preferred != null &&
    Number.isFinite(preferred) &&
    preferred > 0 &&
    !taken.has(preferred)
  ) {
    return preferred
  }

  do {
    maxId += 1
  } while (taken.has(maxId))

  return maxId
}

/** Reassign duplicate or invalid ids so list keys stay unique. */
export function normalizeUniqueNumericIds<T extends { id: number }>(
  rows: T[]
): T[] {
  const taken = new Set<number>()
  let maxId = rows.reduce((max, row) => Math.max(max, row.id), 0)

  return rows.map((row) => {
    if (Number.isFinite(row.id) && row.id > 0 && !taken.has(row.id)) {
      taken.add(row.id)
      return row
    }

    do {
      maxId += 1
    } while (taken.has(maxId))

    taken.add(maxId)
    return { ...row, id: maxId }
  })
}
