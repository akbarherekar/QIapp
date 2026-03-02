"use client"

import { formatDistanceToNow } from "date-fns"
import {
  Plus,
  ArrowRight,
  CheckCircle2,
  Edit,
  Trash2,
  UserPlus,
  FolderPlus,
  Activity,
  Inbox,
  MessageSquare,
  BarChart3,
  ClipboardList,
  Send,
  XCircle,
  MessageSquarePlus,
  NotebookText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface ActivityItem {
  id: string
  action: string
  details?: string | null
  source: string
  createdAt: string
  user: { id: string; name: string; avatarUrl?: string | null }
}

const actionIcons: Record<string, { icon: typeof Activity; color: string }> = {
  PROJECT_CREATED: { icon: FolderPlus, color: "text-emerald-500" },
  PROJECT_UPDATED: { icon: Edit, color: "text-blue-500" },
  TASK_CREATED: { icon: Plus, color: "text-emerald-500" },
  TASK_COMPLETED: { icon: CheckCircle2, color: "text-emerald-500" },
  TASK_MOVED: { icon: ArrowRight, color: "text-blue-500" },
  TASK_UPDATED: { icon: Edit, color: "text-slate-500" },
  TASK_DELETED: { icon: Trash2, color: "text-red-500" },
  TASK_STATUS_CHANGED: { icon: ArrowRight, color: "text-amber-500" },
  PHASE_STATUS_CHANGED: { icon: ArrowRight, color: "text-blue-500" },
  MEMBER_ADDED: { icon: UserPlus, color: "text-purple-500" },
  NOTE_ADDED: { icon: MessageSquare, color: "text-purple-500" },
  METRIC_CREATED: { icon: BarChart3, color: "text-emerald-500" },
  METRIC_UPDATED: { icon: Edit, color: "text-blue-500" },
  METRIC_DELETED: { icon: Trash2, color: "text-red-500" },
  DATA_POINT_ADDED: { icon: Plus, color: "text-emerald-500" },
  SURVEY_CREATED: { icon: ClipboardList, color: "text-emerald-500" },
  SURVEY_UPDATED: { icon: Edit, color: "text-blue-500" },
  SURVEY_PUBLISHED: { icon: Send, color: "text-green-500" },
  SURVEY_CLOSED: { icon: XCircle, color: "text-slate-500" },
  SURVEY_DELETED: { icon: Trash2, color: "text-red-500" },
  SURVEY_RESPONSE_RECEIVED: { icon: MessageSquarePlus, color: "text-purple-500" },
  MEETING_PROCESSED: { icon: NotebookText, color: "text-purple-500" },
}

const AI_SOURCES = new Set(["AI_INBOX", "AI_MEETING", "AI_FEEDBACK"])

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-400">
        No activity yet
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const config = actionIcons[item.action] || {
          icon: Activity,
          color: "text-slate-400",
        }
        const Icon = config.icon

        return (
          <div key={item.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={cn(
                "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                AI_SOURCES.has(item.source) ? "bg-purple-100" : "bg-slate-100"
              )}>
                {AI_SOURCES.has(item.source) ? (
                  <Inbox className="h-3.5 w-3.5 text-purple-500" />
                ) : (
                  <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1 pb-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="bg-slate-100 text-[8px] text-slate-500">
                    {getInitials(item.user.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-slate-700">
                  {item.user.name}
                </span>
                <span className="text-xs text-slate-400">
                  {formatDistanceToNow(new Date(item.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              {item.details && (
                <p className="mt-0.5 text-sm text-slate-500">{item.details}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
