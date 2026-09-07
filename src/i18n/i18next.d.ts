import type common from "@/locales/en/common.json"
import type nav from "@/locales/en/nav.json"
import type settings from "@/locales/en/settings.json"
import type auth from "@/locales/en/auth.json"
import type inventory from "@/locales/en/inventory.json"
import type sales from "@/locales/en/sales.json"
import type purchases from "@/locales/en/purchases.json"
import type customers from "@/locales/en/customers.json"
import type vendors from "@/locales/en/vendors.json"
import type payments from "@/locales/en/payments.json"
import type documents from "@/locales/en/documents.json"
import type pos from "@/locales/en/pos.json"
import type employees from "@/locales/en/employees.json"
import type zakat from "@/locales/en/zakat.json"
import type reports from "@/locales/en/reports.json"
import type tax from "@/locales/en/tax.json"
import type storefront from "@/locales/en/storefront.json"
import type plans from "@/locales/en/plans.json"
import type returnsNs from "@/locales/en/returns.json"

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common"
    resources: {
      common: typeof common
      nav: typeof nav
      settings: typeof settings
      auth: typeof auth
      inventory: typeof inventory
      sales: typeof sales
      purchases: typeof purchases
      customers: typeof customers
      vendors: typeof vendors
      payments: typeof payments
      documents: typeof documents
      pos: typeof pos
      employees: typeof employees
      zakat: typeof zakat
      reports: typeof reports
      tax: typeof tax
      storefront: typeof storefront
      plans: typeof plans
      returns: typeof returnsNs
    }
  }
}
