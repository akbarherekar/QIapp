import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { hasMinSystemRole } from "@/lib/auth-utils"
import { Users } from "lucide-react"
import { GroupCard } from "@/components/groups/group-card"
import { CreateGroupDialog } from "@/components/groups/create-group-dialog"

export default async function GroupsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id: userId, role } = session.user
  const isDirector = role === "DIRECTOR"

  const groups = await db.projectGroup.findMany({
    where: isDirector
      ? {}
      : {
          members: { some: { userId } },
        },
    include: {
      createdBy: { select: { id: true, name: true, avatarUrl: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      },
      _count: { select: { projects: true, meetingNotes: true } },
    },
    orderBy: { updatedAt: "desc" },
  })

  // Build a map of user roles per group
  const userRoles: Record<string, string> = {}
  for (const group of groups) {
    const membership = group.members.find((m) => m.user.id === userId)
    if (membership) {
      userRoles[group.id] = membership.role
    } else if (isDirector) {
      userRoles[group.id] = "DIRECTOR"
    }
  }

  const canCreate = hasMinSystemRole(role, "PROJECT_LEAD")

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Committees</h1>
          <p className="mt-1 text-sm text-slate-500">
            Quality improvement committees and working groups
          </p>
        </div>
        {canCreate && <CreateGroupDialog />}
      </div>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Users className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-500">
            No committees yet
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Create a committee to group related QI projects together.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              userRole={userRoles[group.id]}
            />
          ))}
        </div>
      )}
    </div>
  )
}
