import { NextResponse } from "next/server"
import puppeteer from "puppeteer"
import { z } from "zod"

import { companySettingsSchema } from "@/lib/company-settings"
import { buildCustomerRecordPdfHtml } from "@/lib/customer-record-pdf-html"
import { customerRecordSchema } from "@/lib/customer-record"
import { documentDisplayFlagsSchema } from "@/lib/document-display-settings"
import { resolveLogoSrc } from "@/lib/invoice-pdf-html"
import {
  invoiceBuilderConfigSchema,
  invoiceTemplateColorOverridesSchema,
  invoiceTemplateIdSchema,
  type InvoiceTemplateColorOverrides,
} from "@/lib/invoice-templates"

export const runtime = "nodejs"

const bodySchema = z.object({
  record: customerRecordSchema,
  company: companySettingsSchema,
  templateId: invoiceTemplateIdSchema.optional(),
  colors: invoiceTemplateColorOverridesSchema.optional(),
  builder: invoiceBuilderConfigSchema.optional(),
  display: documentDisplayFlagsSchema.optional(),
})

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as unknown
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid customer record data." }, { status: 400 })
    }

    const { record, company, templateId, colors, builder, display } = parsed.data
    let logoSrc = ""
    try {
      logoSrc = resolveLogoSrc(company)
    } catch {
      logoSrc = ""
    }
    const html = buildCustomerRecordPdfHtml(
      record,
      company,
      logoSrc,
      templateId ?? "classic",
      colors as InvoiceTemplateColorOverrides | undefined,
      builder,
      display
    )

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })

    try {
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: "load" })
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
      })

      const safeName = record.customer.name.replace(/[^\w-]+/g, "_")
      const filename = `customer-record-${safeName}-${record.asOf}.pdf`

      return new NextResponse(Buffer.from(pdf), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      })
    } finally {
      await browser.close()
    }
  } catch (error) {
    console.error("Customer record PDF generation failed:", error)
    return NextResponse.json(
      { error: "Failed to generate customer record PDF." },
      { status: 500 }
    )
  }
}
