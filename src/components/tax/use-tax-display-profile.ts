"use client"

import * as React from "react"

import { useTaxSettings } from "@/context/tax-settings-context"
import { getTaxDisplayProfile } from "@/lib/tax-region-config"
import { formatTaxMoney } from "@/lib/tax-region-config"

export function useTaxDisplayProfile() {
  const { settings } = useTaxSettings()
  return React.useMemo(() => getTaxDisplayProfile(settings), [settings])
}

export function useTaxFormatMoney() {
  const profile = useTaxDisplayProfile()
  return React.useCallback(
    (amount: number | string) => formatTaxMoney(amount, profile),
    [profile]
  )
}
