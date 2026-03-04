import Link from "next/link"
import { startOfMonth, endOfMonth, formatDistanceToNow } from "date-fns"
import {
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Inbox,
  AlertCircle,
} from "lucide-react"
import { requireAuth } from "@/lib/auth-utils"
import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { MyTasksTabs } from "./tabs"

export default async function MyTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const user = await requireAuth()
  const { filter } = await searchParams
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

  // Fetch all data in parallel
  const [openTasks, completedTasks, pendingReviews] = await Promise.all([
    // Open tasks assigned to user
    db.task.findMany({
      where: {
        assigneeId: user.id,
        status: { not: "DONE" },
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
      orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
    }),

    // Completed tasks this month
    db.task.findMany({
      where: {
        assigneeId: user.id,
        status: "DONE",
        completedAt: {
          gte: startOfMonth(now),
          lte: endOfMonth(now),
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
      orderBy: { completedAt: "desc" },
    }),

    // Pending inbox reviews
    db.inboxMessage.findMany({
      where: {
        status: "REVIEWED",
        project: memberFilter,
      },
      include: {
        project: { select: { id: true, title: true } },
        actions: { select: { id: true, status: true } },
        sender: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  // Serialize dates for client component
  const serializedOpen = openTasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate?.toISOString() ?? null,
    projectId: t.phase.project.id,
    projectTitle: t.phase.project.title,
    phaseName: t.phase.name,
  }))

  const serializedCompleted = completedTasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    completedAt: t.completedAt?.toISOString() ?? null,
    projectId: t.phase.project.id,
    projectTitle: t.phase.project.title,
    phaseName: t.phase.name,
  }))

  const serializedReviews = pendingReviews.map((m) => ({
    id: m.id,
    subject: m.subject,
    processedSummary: m.processedSummary,
    classification: m.classification,
    createdAt: m.createdAt.toISOString(),
    projectId: m.project.id,
    projectTitle: m.project.title,
    pendingActions: m.actions.filter((a) => a.status === "PENDING").length,
    totalActions: m.actions.length,
    senderName: m.sender?.name ?? m.senderIdentifier ?? "Unknown",
  }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">My Tasks</h1>
        <p className="mt-1 text-sm text-slate-500">
          All your assigned tasks and pending reviews across projects.
        </p>
      </div>

      <MyTasksTabs
        defaultFilter={filter}
        openTasks={serializedOpen}
        completedTasks={serializedCompleted}
        pendingReviews={serializedReviews}
      />
    </div>
  )
}
