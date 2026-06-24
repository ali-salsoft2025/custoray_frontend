import { EmailForm  } from "@/components/emailForm"
import { ToggleButton } from "@/components/ui/toggle-button"

export default function ForgetPassword() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <ToggleButton />
      <div className="w-full max-w-sm md:max-w-3xl">
        <EmailForm />
      </div>
    </div>
  )
}
