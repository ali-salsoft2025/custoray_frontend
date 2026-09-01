import Image from "next/image"

const HERO = {
  signin: {
    src: "/assets/signin_hero.png",
    alt: "Person managing inventory and sales on Custoray",
  },
  signup: {
    src: "/assets/signup_hero.png",
    alt: "Create a Custoray account and start managing your business",
  },
  reset_email: {
    src: "/assets/reset_email.png",
    alt: "Send a password reset email",
  },
  reset_code: {
    src: "/assets/reset_code.png",
    alt: "Enter the password reset code",
  },
  reset_password: {
    src: "/assets/reset_password.png",
    alt: "Set a new password",
  },
  twofa: {
    src: "/assets/reset_code.png",
    alt: "Enter your two-factor authentication code",
  },
} as const

export function AuthMarketingPanel({
  variant = "signin",
}: {
  variant?: keyof typeof HERO
}) {
  const hero = HERO[variant]

  return (
    <div className="relative hidden h-full min-h-0 overflow-hidden bg-[#eef4e6] md:block dark:bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(146,199,32,0.18),transparent_55%)]" />
      <Image
        src={hero.src}
        alt={hero.alt}
        fill
        priority
        sizes="(min-width: 768px) 28rem, 0px"
        className="object-cover object-center"
      />
    </div>
  )
}
