import Link from "next/link"
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowRight,
} from "lucide-react"
import { requireAuth } from "@/lib/auth-utils"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { ProjectStatusBadge } from "@/components/projects/project-status-badge"
import { MethodologyBadge } from "@/components/projects/methodology-badge"
import { ActivityFeed } from "@/components/activity/activity-feed"

export default async function DashboardPage() {
  const user = await requireAuth()
  const now = new Date()

  const isDirector = user.role === "DIRECTOR"
  const memberFilter = isDirector
    ? {}
    : {
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      }

  const [activeProjects, openTasks, dueThisWeek, completedThisMonth, recentProjects, recentActivity] =
    await Promise.all([
      db.project.count({
        where: { ...memberFilter, status: "ACTIVE" },
      }),
      db.task.count({
        where: {
          assigneeId: user.id,
          status: { not: "DONE" },
        },
      }),
      db.task.count({
        where: {
          assigneeId: user.id,
          status: { not: "DONE" },
          dueDate: {
            gte: startOfWeek(now, { weekStartsOn: 1 }),
            lte: endOfWeek(now, { weekStartsOn: 1 }),
          },
        },
      }),
      db.task.count({
        where: {
          assigneeId: user.id,
          status: "DONE",
          completedAt: {
            gte: startOfMonth(now),
            lte: endOfMonth(now),
          },
        },
      }),
      db.project.findMany({
        where: memberFilter,
        orderBy: { updatedAt: "desc" },
        take: 4,
        include: {
          owner: { select: { id: true, name: true, avatarUrl: true } },
          phases: {
            include: { tasks: { select: { status: true } } },
          },
        },
      }),
      db.activityLog.findMany({
        where: isDirector ? {} : { project: memberFilter },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
    ])

  const hour = now.getHours()
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"

  const stats = [
    {
      label: "Active Projects",
      value: activeProjects,
      icon: FolderKanban,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "My Open Tasks",
      value: openTasks,
      icon: Clock,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Due This Week",
      value: dueThisWeek,
      icon: TrendingUp,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Completed This Month",
      value: completedThisMonth,
      icon: CheckCircle2,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          {greeting}, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Here&apos;s what&apos;s happening with your QI projects.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{stat.label}</p>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg}`}
              >
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Recent Projects
            </h2>
            <Link href="/projects">
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                View all
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>

          {recentProjects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-sm text-slate-500">
                No projects yet. Create your first QI project.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentProjects.map((project) => {
                const totalTasks = project.phases.reduce(
                  (sum, p) => sum + p.tasks.length,
                  0
                )
                const doneTasks = project.phases.reduce(
                  (sum, p) =>
                    sum + p.tasks.filter((t) => t.status === "DONE").length,
                  0
                )
                const progress =
                  totalTasks > 0
                    ? Math.round((doneTasks / totalTasks) * 100)
                    : 0

                return (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-slate-900">
                            {project.title}
                          </h3>
                          <ProjectStatusBadge status={project.status} />
                          <MethodologyBadge methodology={project.methodology} />
                        </div>
                        <span className="text-xs text-slate-400">
                          {progress}%
                        </span>
                      </div>
                      {totalTasks > 0 && (
                        <div className="mt-2 h-1 rounded-full bg-slate-100">
                          <div
                            className="h-1 rounded-full bg-primary transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            Recent Activity
          </h2>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <ActivityFeed
              items={recentActivity.map((log) => ({
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
      </div>
    </div>
  )
}
