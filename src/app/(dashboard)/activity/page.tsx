import { requireAuth } from "@/lib/auth-utils"
import { db } from "@/lib/db"
import { ActivityFeed } from "@/components/activity/activity-feed"

export default async function ActivityPage() {
  const user = await requireAuth()

  const isDirector = user.role === "DIRECTOR"

  const logs = await db.activityLog.findMany({
    where: isDirector
      ? {}
      : {
          project: {
            OR: [
              { ownerId: user.id },
              { members: { some: { userId: user.id } } },
            ],
          },
        },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      project: { select: { id: true, title: true } },
    },
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Activity</h1>
        <p className="mt-1 text-sm text-slate-500">
          Recent activity across all your projects
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <ActivityFeed
          items={logs.map((log) => ({
            id: log.id,
            action: log.action,
            details: log.details,
            source: log.source,
            createdAt: log.createdAt.toISOString(),
            user: log.user,
          }))}
        />
      </div>
    </div>
  )
}
