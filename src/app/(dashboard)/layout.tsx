import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { SessionProvider } from "@/components/session-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <SessionProvider>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="ml-60 flex flex-1 flex-col">
          <Header />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SessionProvider>
  )
}
