"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Building2, ChevronLeft, Mail, Phone, User } from "lucide-react"
import { toast } from "sonner"

import { AuthSocialButtons } from "@/components/auth/auth-social"
import {
  AUTH_BUTTON,
  AUTH_INPUT,
  AuthHeading,
  AuthShell,
  AuthSwitch,
} from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { PasswordInput } from "@/components/ui/password-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/context/auth-context"
import { SIGNUP_COUNTRIES } from "@/lib/countries"
import { SIGNUP_INDUSTRIES } from "@/lib/industries"
import { FALLBACK_PLANS } from "@/lib/subscription-access"
import { cn } from "@/lib/utils"

const SELECT_TRIGGER = cn(
  AUTH_INPUT,
  "w-full justify-between px-3 font-normal shadow-none data-[size=default]:h-10"
)

type FieldErrors = Partial<Record<"ownerName" | "email" | "password" | "businessName" | "industry" | "phone" | "terms", string>>

function planFromUrl(code: string | null | undefined) {
  const match = FALLBACK_PLANS.find((plan) => plan.code === code)
  return match ?? FALLBACK_PLANS[0]
}

function StepBar({
  step,
  onBack,
}: {
  step: 1 | 2
  onBack: () => void
}) {
  return (
    <div className="-mt-2 mb-4">
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          aria-label="Account"
          className="h-0.5 rounded-full bg-primary"
          onClick={step === 2 ? onBack : undefined}
          disabled={step === 1}
        />
        <span
          className={cn(
            "h-0.5 rounded-full",
            step === 2 ? "bg-primary" : "bg-border"
          )}
        />
      </div>
      <p className="text-muted-foreground mt-1.5 text-right text-[11px]">
        {step} of 2
      </p>
    </div>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-destructive text-[11px] leading-none">{message}</p>
}

export function SignupWizard({ planCode }: { planCode?: string }) {
  const router = useRouter()
  const { signup, session, hydrated, access } = useAuth()
  const plan = planFromUrl(planCode)
  const stayOnSignup = useRef(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [values, setValues] = useState({
    ownerName: "",
    email: "",
    password: "",
    businessName: "",
    industry: "",
    country: "Pakistan",
    phone: "",
  })

  useEffect(() => {
    if (!hydrated || !session || stayOnSignup.current) return
    router.replace(access && !access.allowed ? "/trial-ended" : "/home")
  }, [hydrated, session, access, router])

  useEffect(() => {
    const id = step === 1 ? "ownerName" : "businessName"
    window.setTimeout(() => document.getElementById(id)?.focus(), 0)
  }, [step])

  function update<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function goToCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next: FieldErrors = {}
    if (values.ownerName.trim().length < 2) next.ownerName = "Enter your full name"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      next.email = "Enter a valid email"
    }
    if (values.password.length < 8) next.password = "Use at least 8 characters"
    setErrors(next)
    if (Object.keys(next).length) return
    setStep(2)
  }

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next: FieldErrors = {}
    if (values.businessName.trim().length < 2) next.businessName = "Enter your company name"
    if (!values.industry) next.industry = "Select an industry"
    if (values.phone.trim().length < 7) next.phone = "Enter a valid phone number"
    if (!acceptedTerms) next.terms = "Agree to continue"
    setErrors(next)
    if (Object.keys(next).length) return

    setLoading(true)
    stayOnSignup.current = true
    try {
      const result = await signup({
        ownerName: values.ownerName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        country: values.country,
        password: values.password,
        businessName: values.businessName.trim(),
        industry: values.industry,
        planCode: plan.code,
      })
      if (!result.ok) {
        stayOnSignup.current = false
        toast.error(result.error)
        return
      }
      toast.success("Welcome to Custoray")
      router.replace(result.accessAllowed ? "/onboarding" : "/trial-ended")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Signup failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell hero="signup">
      {step === 1 ? (
        <>
          <AuthHeading
            title="Create your account"
            accent="account"
            subtitle="Use email or continue with Google."
          />
          <StepBar step={step} onBack={() => setStep(1)} />
          <form className="space-y-3" onSubmit={goToCompany}>
            <div className="grid gap-1.5">
              <Label htmlFor="ownerName">Full name</Label>
              <div className="relative">
                <Input
                  id="ownerName"
                  name="ownerName"
                  placeholder="Ali Hussain"
                  autoComplete="name"
                  required
                  minLength={2}
                  value={values.ownerName}
                  onChange={(e) => update("ownerName", e.target.value)}
                  aria-invalid={Boolean(errors.ownerName)}
                  className={`${AUTH_INPUT} pr-10`}
                />
                <User
                  className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2"
                  aria-hidden
                />
              </div>
              <FieldError message={errors.ownerName} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  required
                  value={values.email}
                  onChange={(e) => update("email", e.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  className={`${AUTH_INPUT} pr-10`}
                />
                <Mail
                  className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2"
                  aria-hidden
                />
              </div>
              <FieldError message={errors.email} />
            </div>
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="password">Password</Label>
                <span
                  className={cn(
                    "text-[11px]",
                    values.password.length >= 8
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  8+ characters
                </span>
              </div>
              <PasswordInput
                id="password"
                name="password"
                placeholder="••••••••"
                autoComplete="new-password"
                minLength={8}
                required
                value={values.password}
                onChange={(e) => update("password", e.target.value)}
                aria-invalid={Boolean(errors.password)}
                className={AUTH_INPUT}
              />
              <FieldError message={errors.password} />
            </div>
            <Button type="submit" className={AUTH_BUTTON}>
              Continue
              <ArrowRight className="size-3.5" />
            </Button>
            <AuthSocialButtons
              onNavigate={() => {
                stayOnSignup.current = true
              }}
            />
            <AuthSwitch prompt="Already have an account?" href="/" label="Sign in" />
          </form>
        </>
      ) : (
        <>
          <AuthHeading
            title="Your company"
            accent="company"
            subtitle="Used on invoices, reports, and your workspace."
          />
          <StepBar step={step} onBack={() => setStep(1)} />
          <p className="text-muted-foreground -mt-1 mb-3 truncate text-[11px]">
            {values.email}
            {" · "}
            <button
              type="button"
              className="text-primary font-medium hover:underline"
              onClick={() => setStep(1)}
            >
              Change
            </button>
          </p>
          <form className="space-y-3" onSubmit={(e) => void createAccount(e)}>
            <div className="grid gap-1.5">
              <Label htmlFor="businessName">Company name</Label>
              <div className="relative">
                <Input
                  id="businessName"
                  name="businessName"
                  placeholder="Al-Noor Traders"
                  required
                  minLength={2}
                  value={values.businessName}
                  onChange={(e) => update("businessName", e.target.value)}
                  aria-invalid={Boolean(errors.businessName)}
                  className={`${AUTH_INPUT} pr-10`}
                />
                <Building2
                  className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2"
                  aria-hidden
                />
              </div>
              <FieldError message={errors.businessName} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="industry">Industry</Label>
              <Select
                value={values.industry || undefined}
                onValueChange={(value) => update("industry", value)}
              >
                <SelectTrigger
                  id="industry"
                  aria-invalid={Boolean(errors.industry)}
                  className={SELECT_TRIGGER}
                >
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {SIGNUP_INDUSTRIES.map((industry) => (
                    <SelectItem
                      key={industry.value}
                      value={industry.value}
                      className="text-xs"
                    >
                      {industry.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={errors.industry} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={values.country}
                  onValueChange={(value) => update("country", value)}
                >
                  <SelectTrigger id="country" className={SELECT_TRIGGER}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIGNUP_COUNTRIES.map((country) => (
                      <SelectItem key={country} value={country} className="text-xs">
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+92 300 1234567"
                    autoComplete="tel"
                    required
                    minLength={7}
                    value={values.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    aria-invalid={Boolean(errors.phone)}
                    className={`${AUTH_INPUT} pr-10`}
                  />
                  <Phone
                    className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2"
                    aria-hidden
                  />
                </div>
                <FieldError message={errors.phone} />
              </div>
            </div>
            <div className="grid gap-1">
              <label className="flex items-center gap-2 text-xs">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => {
                    setAcceptedTerms(checked === true)
                    setErrors((prev) => ({ ...prev, terms: undefined }))
                  }}
                />
                <span className="text-muted-foreground leading-none">
                  I agree to the{" "}
                  <Link href="/legal/terms" className="text-primary font-medium hover:underline">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/legal/privacy" className="text-primary font-medium hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
              <FieldError message={errors.terms} />
            </div>
            <Button type="submit" className={AUTH_BUTTON} disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Creating account…
                </span>
              ) : (
                "Create account"
              )}
            </Button>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground inline-flex w-full items-center justify-center gap-1 text-xs"
              onClick={() => setStep(1)}
            >
              <ChevronLeft className="size-3.5" />
              Back to account
            </button>
          </form>
        </>
      )}
    </AuthShell>
  )
}
