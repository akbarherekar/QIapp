import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Target, TrendingUp, Inbox, CalendarDays, BarChart3 } from "lucide-react"
import { requireAuth } from "@/lib/auth-utils"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ProjectStatusBadge } from "@/components/projects/project-status-badge"
import { MethodologyBadge } from "@/components/projects/methodology-badge"
import { KanbanBoard } from "@/components/board/kanban-board"
import { ActivityFeed } from "@/components/activity/activity-feed"
import { Badge } from "@/components/ui/badge"
import { InboxTab } from "@/components/inbox/inbox-tab"
import { InboxSettings } from "@/components/inbox/inbox-settings"
import { GanttChart } from "@/components/timeline/gantt-chart"
import { MetricsTab } from "@/components/metrics/metrics-tab"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const user = await requireAuth()
  const { projectId } = await params

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      owner: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              role: true,
            },
          },
        },
      },
      phases: {
        orderBy: { orderIndex: "asc" },
        include: {
          tasks: {
            orderBy: { orderIndex: "asc" },
            include: {
              assignee: {
                select: { id: true, name: true, avatarUrl: true },
              },
            },
          },
        },
      },
      activityLogs: {
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      },
    },
  })

  if (!project) notFound()

  // Check access
  if (user.role !== "DIRECTOR") {
    const isMember = project.members.some((m) => m.userId === user.id)
    if (!isMember && project.ownerId !== user.id) notFound()
  }

  // Fetch inbox + metrics data
  const [inboxMessages, pendingReviewCount, metrics] = await Promise.all([
    db.inboxMessage.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
        actions: { orderBy: { createdAt: "asc" } },
      },
    }),
    db.inboxMessage.count({
      where: { projectId, status: "REVIEWED" },
    }),
    db.metricDefinition.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: {
        dataPoints: {
          orderBy: { recordedAt: "desc" },
          take: 50,
          include: {
            recordedBy: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    }),
  ])

  // Permissions for metrics
  const userMembership = project.members.find((m) => m.userId === user.id)
  const canEditMetrics =
    user.role === "DIRECTOR" || userMembership?.role === "LEAD"
  const canAddMetricData =
    user.role === "DIRECTOR" ||
    userMembership?.role === "LEAD" ||
    userMembership?.role === "MEMBER"

  const totalTasks = project.phases.reduce(
    (sum, phase) => sum + phase.tasks.length,
    0
  )
  const doneTasks = project.phases.reduce(
    (sum, phase) =>
      sum + phase.tasks.filter((t) => t.status === "DONE").length,
    0
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/projects"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Projects
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900">
                {project.title}
              </h1>
              <ProjectStatusBadge status={project.status} />
              <MethodologyBadge methodology={project.methodology} />
            </div>
            {project.description && (
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                {project.description}
              </p>
            )}
          </div>
        </div>

        {/* Metric cards */}
        <div className="mt-4 flex flex-wrap gap-3">
          {project.targetMetric && (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <Target className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-[11px] text-slate-400">Target Metric</p>
                <p className="text-sm font-medium text-slate-700">
                  {project.targetMetric}
                </p>
              </div>
            </div>
          )}
          {(project.baselineValue || project.goalValue) && (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <TrendingUp className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-[11px] text-slate-400">
                  Baseline → Goal
                </p>
                <p className="text-sm font-medium text-slate-700">
                  {project.baselineValue || "—"} → {project.goalValue || "—"}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <div>
              <p className="text-[11px] text-slate-400">Progress</p>
              <p className="text-sm font-medium text-slate-700">
                {doneTasks}/{totalTasks} tasks
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <div className="flex -space-x-1.5">
              {project.members.slice(0, 3).map((m) => (
                <Avatar key={m.user.id} className="h-5 w-5 border border-white">
                  <AvatarFallback className="bg-slate-100 text-[8px] text-slate-500">
                    {getInitials(m.user.name)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <p className="text-sm text-slate-500">
              {project.members.length} member
              {project.members.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="board" className="mt-6">
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="inbox" className="gap-1.5">
            <Inbox className="h-3.5 w-3.5" />
            Inbox
            {pendingReviewCount > 0 && (
              <Badge variant="destructive" className="ml-0.5 h-5 min-w-5 rounded-full px-1.5 text-[10px]">
                {pendingReviewCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="metrics" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Metrics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-4">
          <KanbanBoard
            phases={project.phases.map((phase) => ({
              id: phase.id,
              name: phase.name,
              status: phase.status,
              orderIndex: phase.orderIndex,
              tasks: phase.tasks.map((task) => ({
                id: task.id,
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                orderIndex: task.orderIndex,
                projectPhaseId: task.projectPhaseId,
                dueDate: task.dueDate?.toISOString() ?? null,
                completedAt: task.completedAt?.toISOString() ?? null,
                assignee: task.assignee,
              })),
            }))}
            projectId={project.id}
          />
        </TabsContent>

        <TabsContent value="inbox" className="mt-4">
          <div className="mb-4">
            <InboxSettings
              projectId={project.id}
              inboxEnabled={project.inboxEnabled}
              inboxAutoApply={project.inboxAutoApply}
              inboxShortcode={project.inboxShortcode}
            />
          </div>
          <InboxTab
            projectId={project.id}
            initialMessages={inboxMessages.map((msg) => ({
              id: msg.id,
              channel: msg.channel,
              status: msg.status,
              senderIdentifier: msg.senderIdentifier,
              subject: msg.subject,
              rawBody: msg.rawBody,
              processedSummary: msg.processedSummary,
              classification: msg.classification,
              errorMessage: msg.errorMessage,
              createdAt: msg.createdAt.toISOString(),
              sender: msg.sender,
              actions: msg.actions.map((a) => ({
                id: a.id,
                actionType: a.actionType,
                status: a.status,
                description: a.description,
                extractedData: a.extractedData as Record<string, unknown>,
                appliedData: a.appliedData as Record<string, unknown> | null,
              })),
            }))}
          />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <ActivityFeed
              items={project.activityLogs.map((log) => ({
                id: log.id,
                action: log.action,
                details: log.details,
                source: log.source,
                createdAt: log.createdAt.toISOString(),
                user: log.user,
              }))}
            />
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <GanttChart
            phases={project.phases.map((phase) => ({
              id: phase.id,
              name: phase.name,
              status: phase.status,
              orderIndex: phase.orderIndex,
              startDate: phase.startDate?.toISOString() ?? null,
              targetDate: phase.targetDate?.toISOString() ?? null,
              tasks: phase.tasks.map((task) => ({
                id: task.id,
                title: task.title,
                status: task.status,
                priority: task.priority,
                dueDate: task.dueDate?.toISOString() ?? null,
                completedAt: task.completedAt?.toISOString() ?? null,
                assignee: task.assignee,
              })),
            }))}
            projectStartDate={project.startDate?.toISOString() ?? null}
            projectEndDate={project.targetEndDate?.toISOString() ?? null}
          />
        </TabsContent>

        <TabsContent value="metrics" className="mt-4">
          <MetricsTab
            projectId={project.id}
            initialMetrics={metrics.map((m) => ({
              id: m.id,
              name: m.name,
              unit: m.unit,
              lowerBound: m.lowerBound,
              upperBound: m.upperBound,
              target: m.target,
              createdAt: m.createdAt.toISOString(),
              dataPoints: m.dataPoints.map((dp) => ({
                id: dp.id,
                value: dp.value,
                recordedAt: dp.recordedAt.toISOString(),
                notes: dp.notes,
                recordedBy: dp.recordedBy,
              })),
            }))}
            canEdit={canEditMetrics}
            canAddData={canAddMetricData}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
