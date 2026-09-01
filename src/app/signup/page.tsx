import { SignupWizard } from "@/components/signup/signup-wizard"

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>
}) {
  const params = await searchParams
  return <SignupWizard planCode={params.plan} />
}
