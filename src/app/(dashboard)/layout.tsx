import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
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

  // Fetch user's groups for sidebar (gracefully handle DB errors)
  let groups: Array<{ id: string; name: string }> = []
  try {
    const isDirector = session.user.role === "DIRECTOR"
    const groupData = isDirector
      ? await db.projectGroup.findMany({
          where: { status: "ACTIVE" },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : await db.groupMember.findMany({
          where: { userId: session.user.id, group: { status: "ACTIVE" } },
          select: { group: { select: { id: true, name: true } } },
          orderBy: { group: { name: "asc" } },
        })

    groups = isDirector
      ? (groupData as Array<{ id: string; name: string }>)
      : (groupData as Array<{ group: { id: string; name: string } }>).map(
          (m) => m.group
        )
  } catch {
    // DB unavailable — continue with empty groups
  }

  return (
    <SessionProvider>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar groups={groups} />
        <div className="ml-60 flex flex-1 flex-col">
          <Header />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SessionProvider>
  )
}
