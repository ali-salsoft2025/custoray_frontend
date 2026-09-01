import { LoginForm } from "@/components/loginForm"

function safeNextPath(path?: string) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return undefined
  return path
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string; redirect?: string }>
}) {
  const params = await searchParams
  return (
    <LoginForm
      expiredNotice={params.expired === "1"}
      redirectTo={safeNextPath(params.redirect)}
    />
  )
}
