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
import { useTheme } from "next-themes"

export function ResetForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { resolvedTheme } = useTheme()


  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 shadow-lg md:min-h-[32rem]">
        <CardContent className="grid p-0 md:grid-cols-2 md:min-h-[32rem]">
          <form className="p-8 md:p-10 lg:p-12">
            <div className="flex flex-col justify-center gap-7 min-h-[24rem] md:min-h-[28rem]">
               
              <div className="flex flex-col gap-1">
                <CardTitle className="text-xl md:text-2xl">Reset Password</CardTitle>
              <CardDescription className="text-sm md:text-base">
Enter your new password to reset your password.              </CardDescription>


              </div>
           
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">New Password</Label>
                </div>
                <PasswordInput
					id="current_password"
					autoComplete="current-password"
          placeholder="***********"
          className="h-11"
				/>
              </div>
               <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Confirm Password</Label>
                </div>
                <PasswordInput
					id="confirm_password"
					autoComplete="new-password"
          placeholder="***********"
          className="h-11"
				/>
              </div>
              <Button type="submit" className="h-11 w-full bg-[#8cc91a] text-base hover:bg-[black] text-white">
                Reset Password
              </Button>

              <div className="text-center text-sm">
                Already have an account?{" "}
                <a href="#" className="underline underline-offset-4">
                  Sign In
                </a>
              </div>
            </div>
          </form>
          <div className="bg-muted relative hidden flex flex-col justify-center md:flex">
            {resolvedTheme ? <Image
                src="/assets/logo-2.png"
                alt="logo"
                height={50}
                width={140}
                className="absolute bottom-0 right-0 p-4 z-10"
              /> : <div className="h-10 w-32 bg-transparent animate-pulse rounded-md mb-12"></div>}
            <Image
              src="/assets/resetPassword.png" // Change this path to your image
              alt="reset password Illustration"
              height={500}
              width={500}
              className="cover "
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
