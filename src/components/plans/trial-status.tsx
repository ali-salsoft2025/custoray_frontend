"use client"

import { CalendarClock } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAuth } from "@/context/auth-context"
import { apiRequestTrial } from "@/lib/api/auth"
import { formatTrialEndDate } from "@/lib/subscription-access"

export function TrialStatus() {
  const { access, refreshAccess } = useAuth()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [pending, setPending] = useState(false)

  if (!access || access.status !== "TRIAL" || !access.trialEndsAt) {
    return null
  }

  const end = new Date(access.trialEndsAt)
  const daysLeft = Math.max(
    0,
    Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  )
  const requested = access.trialRequestPending
  const isOwner = access.isOwner

  async function submit() {
    if (reason.trim().length < 8) {
      toast.error("Please explain why you need more time (at least 8 characters).")
      return
    }
    setPending(true)
    try {
      await apiRequestTrial(reason.trim())
      await refreshAccess()
      setOpen(false)
      setReason("")
      toast.success("Request sent. We will email you when an admin responds.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send request")
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <div className="border-primary/20 bg-primary/5 flex flex-col gap-3 rounded-2xl border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="bg-primary/10 text-primary mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full">
            <CalendarClock className="size-4" />
          </span>
          <div>
            <p className="text-sm font-medium">You are on a free trial</p>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {daysLeft === 0
                ? "Ends today"
                : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
              {" · "}
              ends {formatTrialEndDate(access.trialEndsAt)}
              {requested ? " · extension request pending" : null}
            </p>
          </div>
        </div>
        {isOwner ? (
          <Button
            variant="outline"
            className="shrink-0 rounded-full"
            disabled={requested}
            onClick={() => setOpen(true)}
          >
            {requested ? "Request sent" : "Extend trial"}
          </Button>
        ) : (
          <p className="text-muted-foreground text-xs sm:max-w-48 sm:text-right">
            Ask the owner if you need more trial time.
          </p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend trial</DialogTitle>
            <DialogDescription>
              Tell us why you need more time. An admin reviews this, and extra trial
              days are limited.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="extend-trial-reason">Reason</Label>
            <textarea
              id="extend-trial-reason"
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-24 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="A few more days to finish setup / waiting on payment…"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={pending || reason.trim().length < 8}
              onClick={() => void submit()}
            >
              {pending ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  Sending…
                </span>
              ) : (
                "Send request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
