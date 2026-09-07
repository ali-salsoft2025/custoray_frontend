"use client"

import * as React from "react"
import { IconCloudUpload, IconTrash } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { LoadingSpinner } from "@/components/ui/loading-spinner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  dataTableDialogContentClassName,
  DataTableDialogBody,
  DataTableDialogFooterSection,
  DataTableDialogHeaderSection,
} from "@/components/data-table-dialog-layout"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { downloadTextFile, parseCsv } from "@/lib/csv"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  sampleCsvContent: string
  sampleFilename?: string
  onComplete: (rows: Record<string, string>[]) => void
}

type CsvPreviewRow = {
  id: string
  cells: Record<string, string>
}

export function DataTableImportDialog({
  open,
  onOpenChange,
  sampleCsvContent,
  sampleFilename = "sample.csv",
  onComplete,
}: Props) {
  const { t } = useTranslation()
  const [step, setStep] = React.useState(1)
  const [uploadName, setUploadName] = React.useState("")
  const [previewRows, setPreviewRows] = React.useState<CsvPreviewRow[]>([])
  const [previewKeys, setPreviewKeys] = React.useState<string[]>([])
  const [selectedIds, setSelectedIds] = React.useState(() => new Set<string>())
  const [isReadingFile, setIsReadingFile] = React.useState(false)
  const [readPercent, setReadPercent] = React.useState<number | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)
  const previewIdRef = React.useRef(0)

  const steps = [
    { n: 1, title: t("importDialog.stepSample"), short: t("importDialog.stepSampleShort") },
    { n: 2, title: t("importDialog.stepUpload"), short: t("importDialog.stepUploadShort") },
    { n: 3, title: t("importDialog.stepReview"), short: t("importDialog.stepReviewShort") },
  ]

  const reset = React.useCallback(() => {
    setStep(1)
    setUploadName("")
    setPreviewRows([])
    setPreviewKeys([])
    setSelectedIds(new Set())
    setIsReadingFile(false)
    setReadPercent(null)
    if (fileRef.current) fileRef.current.value = ""
  }, [])

  React.useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  const handleDownloadSample = () => {
    downloadTextFile(
      sampleFilename,
      sampleCsvContent,
      "text/csv;charset=utf-8"
    )
    toast.success(t("importDialog.toastSampleDownloaded"))
  }

  const handleFile = (file: File | undefined) => {
    if (!file) return
    setUploadName(file.name)
    setIsReadingFile(true)
    setReadPercent(null)
    const reader = new FileReader()
    reader.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) {
        setReadPercent(Math.min(100, Math.round((e.loaded / e.total) * 100)))
      }
    }
    reader.onload = () => {
      setIsReadingFile(false)
      setReadPercent(null)
      const text = String(reader.result ?? "")
      const rows = parseCsv(text)
      if (rows.length === 0) {
        toast.error(t("importDialog.toastNoDataRows"))
        setPreviewRows([])
        setPreviewKeys([])
        setSelectedIds(new Set())
        return
      }
      const keys = Object.keys(rows[0])
      const withIds: CsvPreviewRow[] = rows.map((cells) => ({
        id: `import-${++previewIdRef.current}`,
        cells,
      }))
      setPreviewKeys(keys)
      setPreviewRows(withIds)
      setSelectedIds(new Set(withIds.map((r) => r.id)))
      toast.success(t("importDialog.toastParsed", { count: rows.length }))
    }
    reader.onerror = () => {
      setIsReadingFile(false)
      setReadPercent(null)
      toast.error(t("importDialog.toastCouldNotRead"))
    }
    reader.readAsText(file, "UTF-8")
  }

  const removeRow = (id: string) => {
    setPreviewRows((prev) => prev.filter((r) => r.id !== id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const toggleRowSelected = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const toggleSelectAllPreview = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(previewRows.map((r) => r.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const selectedCount = React.useMemo(() => {
    return previewRows.filter((r) => selectedIds.has(r.id)).length
  }, [previewRows, selectedIds])

  const allPreviewSelected =
    previewRows.length > 0 && selectedCount === previewRows.length
  const somePreviewSelected =
    selectedCount > 0 && selectedCount < previewRows.length

  const hasParsedRows = previewRows.length > 0
  const canFinish = step === 3 && selectedCount > 0

  const handleFinish = () => {
    const rows = previewRows
      .filter((r) => selectedIds.has(r.id))
      .map((r) => r.cells)
    onComplete(rows)
    onOpenChange(false)
    reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(dataTableDialogContentClassName, "gap-0")}>
        <DataTableDialogHeaderSection>
          <DialogTitle className="text-xl font-semibold tracking-tight sm:text-2xl">
            {t("importDialog.title")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-base leading-relaxed">
            {t("importDialog.description")}
          </DialogDescription>

          <nav
            aria-label={t("importDialog.stepsAria")}
            className="mt-6 grid w-full grid-cols-3 gap-3 sm:gap-6"
          >
            {steps.map((s) => {
              const done = step > s.n
              const active = step === s.n
              return (
                <div
                  key={s.n}
                  className="flex min-w-0 flex-col items-center gap-2 text-center"
                >
                  <span
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all",
                      done && "border-primary bg-primary text-primary-foreground",
                      active &&
                        "border-primary bg-primary/10 text-primary ring-4 ring-primary/20",
                      !done &&
                        !active &&
                        "border-muted-foreground/25 bg-muted/50 text-muted-foreground"
                    )}
                  >
                    {done ? "✓" : s.n}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-medium sm:text-sm",
                      active && "text-foreground",
                      !active && "text-muted-foreground"
                    )}
                  >
                    <span className="hidden sm:inline">{s.title}</span>
                    <span className="sm:hidden">{s.short}</span>
                  </span>
                </div>
              )
            })}
          </nav>
        </DataTableDialogHeaderSection>

        <DataTableDialogBody>
          {step === 1 && (
            <div className="bg-muted/40 space-y-5 rounded-xl border p-6 sm:p-8">
              <div className="space-y-2">
                <h3 className="text-foreground text-sm font-medium">
                  {t("importDialog.step1Title")}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t("importDialog.step1Body")}
                </p>
              </div>
              <Button type="button" size="lg" onClick={handleDownloadSample}>
                {t("importDialog.downloadSample")}
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <h3 className="text-foreground text-sm font-medium">
                  {t("importDialog.step2Title")}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t("importDialog.step2Body")}
                </p>
              </div>
              <label
                htmlFor="import-csv-input"
                className={cn(
                  "border-muted-foreground/25 hover:border-primary/40 hover:bg-muted/30 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 transition-colors",
                  isReadingFile && "pointer-events-none opacity-70"
                )}
              >
                <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full">
                  <IconCloudUpload className="size-7" />
                </div>
                <div className="text-center">
                  <span className="text-foreground text-sm font-medium">
                    {t("importDialog.chooseCsv")}
                  </span>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {t("importDialog.dragHint")}
                  </p>
                </div>
                <input
                  id="import-csv-input"
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  disabled={isReadingFile}
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </label>
              {isReadingFile && (
                <div
                  className="bg-muted/40 space-y-2 rounded-xl border px-4 py-3"
                  role="status"
                  aria-live="polite"
                  aria-label={t("importDialog.readingAria")}
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <LoadingSpinner size="sm" className="shrink-0" />
                    <span>
                      {readPercent != null
                        ? t("importDialog.readingFilePercent", { percent: readPercent })
                        : t("importDialog.readingFile")}
                    </span>
                  </div>
                  <div
                    className="bg-muted h-2 overflow-hidden rounded-full"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={readPercent ?? undefined}
                    aria-valuetext={
                      readPercent != null ? `${readPercent}%` : undefined
                    }
                  >
                    <div
                      className={cn(
                        "bg-primary h-full rounded-full transition-[width] duration-150 ease-out",
                        readPercent == null && "animate-pulse"
                      )}
                      style={{
                        width:
                          readPercent != null ? `${readPercent}%` : "40%",
                      }}
                    />
                  </div>
                </div>
              )}
              {uploadName && !isReadingFile ? (
                <p className="text-muted-foreground text-center text-sm">
                  {t("importDialog.selectedFile", { name: uploadName })}
                </p>
              ) : null}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-foreground text-sm font-medium">
                  {t("importDialog.step3Title")}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t("importDialog.step3Body")}
                </p>
              </div>
              <div className="max-h-[min(50vh,420px)] overflow-auto rounded-xl border bg-card shadow-inner">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/80 hover:bg-muted/80">
                      <TableHead className="bg-muted/80 sticky left-0 z-10 w-12">
                        <div className="flex items-center justify-center px-1">
                          <Checkbox
                            checked={
                              allPreviewSelected
                                ? true
                                : somePreviewSelected
                                  ? "indeterminate"
                                  : false
                            }
                            onCheckedChange={(v) =>
                              toggleSelectAllPreview(!!v)
                            }
                            aria-label={t("importDialog.selectAllPreview")}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="bg-muted/80 sticky left-12 z-10 w-12 border-r border-border/60" />
                      {previewKeys.map((k) => (
                        <TableHead
                          key={k}
                          className="text-foreground whitespace-nowrap font-semibold"
                        >
                          {k}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={Math.max(1, previewKeys.length + 2)}
                          className="text-muted-foreground h-24 text-center text-sm"
                        >
                          {t("importDialog.noRowsLeft")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      previewRows.map((row, idx) => (
                        <TableRow
                          key={row.id}
                          data-state={
                            selectedIds.has(row.id) ? "selected" : undefined
                          }
                          className="hover:bg-muted/40 data-[state=selected]:bg-muted/50"
                        >
                          <TableCell className="bg-background sticky left-0 z-10 p-1">
                            <div className="flex items-center justify-center px-1">
                              <Checkbox
                                checked={selectedIds.has(row.id)}
                                onCheckedChange={(v) =>
                                  toggleRowSelected(row.id, !!v)
                                }
                                aria-label={t("importDialog.includeRow", { n: idx + 1 })}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="bg-background sticky left-12 z-10 border-r border-border/60 p-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive size-9"
                              aria-label={t("importDialog.deleteRow", { n: idx + 1 })}
                              onClick={() => removeRow(row.id)}
                            >
                              <IconTrash className="size-4" />
                            </Button>
                          </TableCell>
                          {previewKeys.map((k) => (
                            <TableCell
                              key={k}
                              className="max-w-[min(180px,22vw)] truncate text-sm"
                              title={row.cells[k]}
                            >
                              {row.cells[k] ?? ""}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <p className="text-muted-foreground text-sm">
                {t("importDialog.rowsSelected", {
                  selected: selectedCount,
                  total: previewRows.length,
                })}
              </p>
            </div>
          )}
        </DataTableDialogBody>

        <DataTableDialogFooterSection>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="sm:min-w-[7rem]"
              onClick={() => onOpenChange(false)}
            >
              {t("actions.cancel")}
            </Button>
            <div className="flex flex-wrap justify-end gap-2">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                >
                  {t("actions.back")}
                </Button>
              )}
              {step === 1 && (
                <Button type="button" size="lg" onClick={() => setStep(2)}>
                  {t("actions.continue")}
                </Button>
              )}
              {step === 2 && (
                <Button
                  type="button"
                  size="lg"
                  disabled={!hasParsedRows}
                  onClick={() => setStep(3)}
                >
                  {t("importDialog.continueToReview")}
                </Button>
              )}
              {step === 3 && (
                <Button
                  type="button"
                  size="lg"
                  disabled={!canFinish}
                  onClick={handleFinish}
                >
                  {t("importDialog.importRows", { count: selectedCount })}
                </Button>
              )}
            </div>
          </div>
        </DataTableDialogFooterSection>
      </DialogContent>
    </Dialog>
  )
}
