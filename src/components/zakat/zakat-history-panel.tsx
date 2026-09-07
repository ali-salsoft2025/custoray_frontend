"use client"

import * as React from "react"
import { IconEye, IconHistory, IconSearch } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useZakat } from "@/context/zakat-context"
import {
  formatZakatDate,
  formatZakatMoney,
  type ZakatHistoryRecord,
} from "@/lib/zakat"
import { useTranslation } from "react-i18next"

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-3 last:border-b-0">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-right text-sm font-medium tabular-nums">{value}</dd>
    </div>
  )
}

export function ZakatHistoryPanel() {
  const { t } = useTranslation("zakat")
  const { t: tc } = useTranslation("common")
  const { history } = useZakat()
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<ZakatHistoryRecord | null>(null)
  const query = search.trim().toLowerCase()
  const rows = history.filter(
    (record) =>
      !query ||
      record.paymentDate.includes(query) ||
      record.reference.toLowerCase().includes(query) ||
      record.notes.toLowerCase().includes(query)
  )

  return (
    <>
      <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
        >
          {selected ? (
            <>
              <SheetHeader className="border-b px-6 py-5 text-left">
                <SheetTitle>{t("historyPage.recordTitle")}</SheetTitle>
                <SheetDescription>
                  {t("historyPage.finalizedSnapshot", {
                    date: formatZakatDate(selected.paymentDate),
                  })}
                </SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <Badge>{t("paid")}</Badge>
                <dl className="mt-4 rounded-lg border px-4">
                  <DetailRow
                    label={t("historyPage.calculationDate")}
                    value={new Intl.DateTimeFormat("en-PK", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(selected.calculationDate))}
                  />
                  <DetailRow
                    label={t("historyPage.paymentDate")}
                    value={formatZakatDate(selected.paymentDate)}
                  />
                  <DetailRow
                    label={t("historyPage.businessAssets")}
                    value={formatZakatMoney(selected.snapshot.assets.total)}
                  />
                  <DetailRow
                    label={t("historyPage.businessLiabilities")}
                    value={formatZakatMoney(selected.snapshot.liabilities.total)}
                  />
                  <DetailRow
                    label={t("historyPage.netAssets")}
                    value={formatZakatMoney(selected.snapshot.netAssets)}
                  />
                  <DetailRow
                    label={t("historyPage.rate")}
                    value={`${selected.snapshot.rate.toFixed(2)}%`}
                  />
                  <DetailRow
                    label={t("historyPage.nisabReference")}
                    value={
                      selected.snapshot.nisab > 0
                        ? formatZakatMoney(selected.snapshot.nisab)
                        : t("historyPage.notSet")
                    }
                  />
                  <DetailRow
                    label={t("historyPage.estimatedZakat")}
                    value={formatZakatMoney(selected.snapshot.estimatedZakat)}
                  />
                  <DetailRow
                    label={t("historyPage.amountPaid")}
                    value={formatZakatMoney(selected.amountPaid)}
                  />
                  <DetailRow
                    label={t("reference")}
                    value={selected.reference || "—"}
                  />
                </dl>
                {selected.notes ? (
                  <div className="mt-5">
                    <p className="text-sm font-medium">{t("notes")}</p>
                    <p className="text-muted-foreground mt-1 whitespace-pre-wrap text-sm">
                      {selected.notes}
                    </p>
                  </div>
                ) : null}
              </div>
              <SheetFooter className="border-t px-6 py-4">
                <SheetClose asChild>
                  <Button type="button">{tc("actions.close")}</Button>
                </SheetClose>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{t("historyPage.title")}</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("historyPage.hint")}
          </p>
        </div>

        <section className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <IconHistory className="text-primary size-4" />
              <div>
                <h3 className="text-sm font-semibold">{t("historyPage.paymentRecords")}</h3>
                <p className="text-muted-foreground text-xs">
                  {t("historyPage.finalizedCount", { count: history.length })}
                </p>
              </div>
            </div>
            <SearchInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("historyPage.searchPlaceholder")}
              icon={<IconSearch className="size-4" />}
              className="rounded-full sm:max-w-sm"
            />
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("year")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("historyPage.paymentDate")}</TableHead>
                  <TableHead>{t("reference")}</TableHead>
                  <TableHead className="text-right">{t("historyPage.amountPaid")}</TableHead>
                  <TableHead className="text-right">{t("action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-muted-foreground h-28 text-center"
                    >
                      {history.length === 0
                        ? t("historyPage.noRecords")
                        : t("historyPage.noMatches")}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {new Date(`${record.paymentDate}T00:00:00`).getFullYear()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{t("paid")}</Badge>
                      </TableCell>
                      <TableCell>{formatZakatDate(record.paymentDate)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {record.reference || "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatZakatMoney(record.amountPaid)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelected(record)}
                        >
                          <IconEye className="size-4" />
                          {t("view")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </>
  )
}
