"use client"

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

export function AuthCodeInput({
  id,
  value,
  onChange,
}: {
  id?: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <InputOTP
      id={id}
      maxLength={6}
      value={value}
      onChange={onChange}
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]*"
      required
      containerClassName="flex w-full justify-start"
    >
      <InputOTPGroup className="justify-start gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <InputOTPSlot
            key={index}
            index={index}
            className="size-10 shrink-0 rounded-md border border-input/80 text-sm shadow-none first:rounded-md first:border-l last:rounded-md data-[active=true]:border-ring data-[active=true]:ring-1 data-[active=true]:ring-ring/40"
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  )
}
