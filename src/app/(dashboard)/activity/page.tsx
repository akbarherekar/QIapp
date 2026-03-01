import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { requireAuth } from "@/lib/auth-utils"
import { db } from "@/lib/db"
import { ActivityFeed } from "@/components/activity/activity-feed"
import { Button } from "@/components/ui/button"

const PAGE_SIZE = 25

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const user = await requireAuth()
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam || "1"))

  const isDirector = user.role === "DIRECTOR"
  const whereClause = isDirector
    ? {}
    : {
        project: {
          OR: [
            { ownerId: user.id },
            { members: { some: { userId: user.id } } },
          ],
        },
      }

  const [logs, totalCount] = await Promise.all([
    db.activityLog.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        project: { select: { id: true, title: true } },
      },
    }),
    db.activityLog.count({ where: whereClause }),
  ])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const showingFrom = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const showingTo = Math.min(page * PAGE_SIZE, totalCount)

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

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {showingFrom}–{showingTo} of {totalCount}
          </p>
          <div className="flex gap-1">
            {page > 1 && (
              <Link href={`/activity?page=${page - 1}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </Button>
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/activity?page=${page + 1}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
