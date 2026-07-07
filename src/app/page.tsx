import { LoginForm } from "@/components/loginForm"
import { ToggleButton } from "@/components/ui/toggle-button"

export default function LoginPage() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <ToggleButton />
      <div className="w-full max-w-md sm:max-w-2xl md:max-w-4xl lg:max-w-5xl">
        <LoginForm />
      </div>
    </div>
  )
}
