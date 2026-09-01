import { SettingsNav } from "@/components/settings/settings-nav"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex w-full flex-col gap-8 md:flex-row md:items-start md:gap-10">
      <aside className="md:sticky md:top-4 md:w-56 md:shrink-0">
        <h1 className="mb-4 text-xl font-semibold tracking-tight">Settings</h1>
        <SettingsNav />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
