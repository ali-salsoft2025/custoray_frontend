import { NextResponse } from "next/server"
import puppeteer from "puppeteer"
import { z } from "zod"

import { companySettingsSchema } from "@/lib/company-settings"
import {
  invoiceBuilderConfigSchema,
  invoiceTemplateColorOverridesSchema,
  invoiceTemplateCopySchema,
  invoiceTemplateIdSchema,
  type InvoiceTemplateColorOverrides,
} from "@/lib/invoice-templates"
import { buildInvoicePdfHtml, resolveLogoSrc } from "@/lib/invoice-pdf-html"
import { orderSchema } from "@/lib/orders"

export const runtime = "nodejs"

const bodySchema = z.object({
  order: orderSchema,
  company: companySettingsSchema,
  templateId: invoiceTemplateIdSchema.optional(),
  copy: invoiceTemplateCopySchema.optional(),
  colors: invoiceTemplateColorOverridesSchema.optional(),
  builder: invoiceBuilderConfigSchema.optional(),
})

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as unknown
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid invoice data." }, { status: 400 })
    }

    const { order, company, templateId, copy, colors, builder } = parsed.data
    const logoSrc = resolveLogoSrc(company)
    const html = buildInvoicePdfHtml(
      order,
      company,
      logoSrc,
      templateId ?? "classic",
      copy,
      colors as InvoiceTemplateColorOverrides | undefined,
      builder
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
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
      })

      const filename = `${order.invoiceNumber.replace(/[^\w-]+/g, "_")}.pdf`

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
    console.error("Invoice PDF generation failed:", error)
    return NextResponse.json(
      { error: "Failed to generate invoice PDF." },
      { status: 500 }
    )
  }
}
