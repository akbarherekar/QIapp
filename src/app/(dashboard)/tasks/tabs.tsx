"use client"

import Link from "next/link"
import { formatDistanceToNow, format } from "date-fns"
import {
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Inbox,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TaskItem {
  id: string
  title: string
  status: string
  priority: string
  dueDate?: string | null
  completedAt?: string | null
  projectId: string
  projectTitle: string
  phaseName: string
}

interface ReviewItem {
  id: string
  subject: string | null
  processedSummary: string | null
  classification: string | null
  createdAt: string
  projectId: string
  projectTitle: string
  pendingActions: number
  totalActions: number
  senderName: string
}

interface MyTasksTabsProps {
  defaultFilter?: string
  openTasks: TaskItem[]
  completedTasks: TaskItem[]
  pendingReviews: ReviewItem[]
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  HIGH: { label: "High", color: "bg-red-500" },
  MEDIUM: { label: "Medium", color: "bg-amber-500" },
  LOW: { label: "Low", color: "bg-blue-500" },
}

const statusIcon: Record<string, React.ReactNode> = {
  TODO: <Circle className="h-3.5 w-3.5 text-slate-400" />,
  IN_PROGRESS: <Clock className="h-3.5 w-3.5 text-blue-500" />,
  DONE: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
}

function TaskRow({ task, showCompleted }: { task: TaskItem; showCompleted?: boolean }) {
  const priority = priorityConfig[task.priority] || priorityConfig.MEDIUM
  const dateField = showCompleted ? task.completedAt : task.dueDate

  const isOverdue =
    !showCompleted &&
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "DONE"

  return (
    <Link href={`/projects/${task.projectId}`}>
      <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 transition-all hover:border-slate-300 hover:shadow-sm">
        <div className="shrink-0">{statusIcon[task.status] || statusIcon.TODO}</div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-slate-900">
              {task.title}
            </p>
            <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${priority.color}`} />
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {task.projectTitle} &middot; {task.phaseName}
          </p>
        </div>

        {dateField && (
          <div className="shrink-0 text-right">
            <p
              className={`text-xs ${isOverdue ? "font-medium text-red-600" : "text-slate-500"}`}
            >
              {isOverdue && <AlertCircle className="mb-0.5 mr-1 inline h-3 w-3" />}
              {showCompleted ? "Completed " : "Due "}
              {formatDistanceToNow(new Date(dateField), { addSuffix: true })}
            </p>
            <p className="text-[11px] text-slate-400">
              {format(new Date(dateField), "MMM d, yyyy")}
            </p>
          </div>
        )}

        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
      </div>
    </Link>
  )
}

function ReviewRow({ review }: { review: ReviewItem }) {
  return (
    <Link href={`/projects/${review.projectId}`}>
      <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 transition-all hover:border-slate-300 hover:shadow-sm">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50">
          <Inbox className="h-4 w-4 text-orange-500" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">
            {review.subject || review.processedSummary?.slice(0, 60) || "Inbox message"}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {review.projectTitle} &middot; from {review.senderName}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <Badge
            variant="outline"
            className="border-amber-200 bg-amber-50 text-amber-700"
          >
            {review.pendingActions} action{review.pendingActions !== 1 ? "s" : ""} pending
          </Badge>
          <p className="mt-1 text-[11px] text-slate-400">
            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
          </p>
        </div>

        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
      </div>
    </Link>
  )
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
      <Icon className="mx-auto h-8 w-8 text-slate-300" />
      <p className="mt-2 text-sm text-slate-500">{message}</p>
    </div>
  )
}

export function MyTasksTabs({
  defaultFilter,
  openTasks,
  completedTasks,
  pendingReviews,
}: MyTasksTabsProps) {
  const defaultTab =
    defaultFilter === "completed"
      ? "completed"
      : defaultFilter === "reviews"
        ? "reviews"
        : "open"

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList>
        <TabsTrigger value="open" className="gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          Open Tasks
          <span className="ml-1 text-xs text-slate-400">{openTasks.length}</span>
        </TabsTrigger>
        <TabsTrigger value="completed" className="gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Completed
          <span className="ml-1 text-xs text-slate-400">{completedTasks.length}</span>
        </TabsTrigger>
        <TabsTrigger value="reviews" className="gap-1.5">
          <Inbox className="h-3.5 w-3.5" />
          Pending Reviews
          {pendingReviews.length > 0 && (
            <Badge
              variant="destructive"
              className="ml-0.5 h-5 min-w-5 rounded-full px-1.5 text-[10px]"
            >
              {pendingReviews.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="open" className="mt-4">
        {openTasks.length === 0 ? (
          <EmptyState icon={CheckCircle2} message="No open tasks — you're all caught up!" />
        ) : (
          <div className="space-y-2">
            {openTasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="completed" className="mt-4">
        {completedTasks.length === 0 ? (
          <EmptyState icon={CheckCircle2} message="No tasks completed this month yet." />
        ) : (
          <div className="space-y-2">
            {completedTasks.map((task) => (
              <TaskRow key={task.id} task={task} showCompleted />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="reviews" className="mt-4">
        {pendingReviews.length === 0 ? (
          <EmptyState icon={Inbox} message="No pending reviews — inbox is clear!" />
        ) : (
          <div className="space-y-2">
            {pendingReviews.map((review) => (
              <ReviewRow key={review.id} review={review} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
