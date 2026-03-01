import { requireAuth } from "@/lib/auth-utils"
import { db } from "@/lib/db"
import { CalendarView } from "@/components/calendar/calendar-view"

export default async function CalendarPage() {
  const user = await requireAuth()

  const isDirector = user.role === "DIRECTOR"
  const memberFilter = isDirector
    ? {}
    : {
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      }

  const tasks = await db.task.findMany({
    where: {
      dueDate: { not: null },
      phase: {
        project: memberFilter,
      },
    },
    include: {
      assignee: { select: { id: true, name: true, avatarUrl: true } },
      phase: {
        select: {
          name: true,
          project: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Calendar</h1>
        <p className="mt-1 text-sm text-slate-500">
          Task due dates across all your projects
        </p>
      </div>

      <CalendarView
        tasks={tasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate!.toISOString(),
          assignee: t.assignee,
          projectTitle: t.phase.project.title,
          projectId: t.phase.project.id,
          phaseName: t.phase.name,
        }))}
      />
    </div>
  )
}
