"use client"

import { useState } from "react"
import { IconCamera, IconUser, IconX } from "@tabler/icons-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type CustomerImageFieldProps = {
  id: string
  name: string
  initialUrl?: string
}

export function CustomerImageField({ id, name, initialUrl = "" }: CustomerImageFieldProps) {
  const [imageUrl, setImageUrl] = useState(initialUrl.trim())
  const hasImage = Boolean(imageUrl)

  const addFile = (file: File | undefined) => {
    if (!file?.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = () => setImageUrl(String(reader.result))
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Label htmlFor={id} className="sr-only">
        Customer photo
      </Label>
      <div className="relative">
        <label
          htmlFor={id}
          className="group relative block size-24 cursor-pointer"
          aria-label={hasImage ? "Change customer photo" : "Upload customer photo"}
        >
          <span
            className={cn(
              "border-border bg-muted flex size-24 overflow-hidden rounded-full border",
              !hasImage && "text-muted-foreground items-center justify-center"
            )}
          >
            {hasImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={name || "Customer"}
                className="size-full object-cover"
              />
            ) : (
              <span className="flex size-full items-center justify-center">
                <IconUser className="size-10" />
              </span>
            )}
          </span>
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <IconCamera className="size-7 text-white" />
          </span>
        </label>
        {hasImage ? (
          <button
            type="button"
            className="bg-background text-muted-foreground hover:bg-destructive/10 hover:text-destructive absolute -top-0.5 -right-0.5 flex size-7 items-center justify-center rounded-full border shadow-sm transition-colors"
            aria-label="Remove customer photo"
            onClick={() => setImageUrl("")}
          >
            <IconX className="size-3.5" />
          </button>
        ) : null}
      </div>
      <Input
        id={id}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          addFile(e.target.files?.[0])
          e.target.value = ""
        }}
      />
      <input type="hidden" name="imageUrl" value={imageUrl} />
    </div>
  )
}
