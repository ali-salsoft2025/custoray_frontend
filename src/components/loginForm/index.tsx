"use client"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Card, CardContent, CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { PasswordInput } from "@/components/ui/password-input"
import Link from 'next/link'
import { Input } from "@/components/ui/input" 
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useEffect, useState, type FormEvent } from "react"
import { toast } from "sonner"

import { useAuth } from "@/context/auth-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

function LoginHeroLogo() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div
        className="absolute bottom-0 right-0 z-10 h-[50px] w-[140px] p-4"
        aria-hidden
      />
    )
  }

  return (
    <Image
      src="/assets/logo-2.png"
      alt="logo"
      height={50}
      width={140}
      className="absolute bottom-0 right-0 z-10 p-4"
    />
  )
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const { login, session, hydrated } = useAuth()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (hydrated && session) {
      router.replace("/home")
    }
  }, [hydrated, session, router])

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const email = String(fd.get("email") ?? "")
    const password = String(fd.get("password") ?? "")

    setSubmitting(true)
    const result = login(email, password)
    setSubmitting(false)

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    toast.success("Welcome back!")
    router.replace("/home")
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 shadow-lg md:min-h-[32rem]">
        <CardContent className="grid p-0 md:grid-cols-2 md:min-h-[32rem]">
          <form className="p-8 md:p-10 lg:p-12" onSubmit={handleSubmit}>
            <div className="flex flex-col justify-center gap-7 min-h-[24rem] md:min-h-[28rem]">
               
              <div className="flex flex-col gap-1">
                <CardTitle className="text-xl md:text-2xl">Login to your account</CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Sign in with your business admin or employee portal credentials
                </CardDescription>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                  className="h-11"
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgetPassword" className="ml-auto text-xs underline-offset-4 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <PasswordInput
					id="password"
          name="password"
					autoComplete="current-password"
          placeholder="***********"
          required
          className="h-11"
				/>
              </div>
              <Button
                type="submit"
                className="h-11 w-full bg-[#8cc91a] text-base hover:bg-[black] text-white"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" />
                    Signing in…
                  </span>
                ) : (
                  "Login"
                )}
              </Button>

              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <a href="#" className="underline underline-offset-4">
                  Sign up
                </a>
              </div>
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <LoginHeroLogo />
            <Image
              src="/assets/stock.jpg"
              alt="inventory Illustration"
              fill
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.5] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}
