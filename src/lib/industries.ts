export const SIGNUP_INDUSTRIES = [
  { value: "retail", label: "Retail" },
  { value: "wholesale", label: "Wholesale / trading" },
  { value: "distribution", label: "Distribution" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "electronics", label: "Electronics" },
  { value: "fashion", label: "Fashion / garments" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "food_beverage", label: "Food & beverage" },
  { value: "other", label: "Other" },
] as const

export type SignupIndustry = (typeof SIGNUP_INDUSTRIES)[number]["value"]

export function industryLabel(value: string) {
  return SIGNUP_INDUSTRIES.find((item) => item.value === value)?.label ?? value
}
