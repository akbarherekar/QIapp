"use client"

import { useState } from "react"
import {
  Plus,
  CheckCircle2,
  Edit,
  MessageSquare,
  ArrowRight,
  Check,
  X,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface MeetingActionItemProps {
  action: {
    id: string
    actionType: string
    status: string
    description: string
    extractedData: Record<string, unknown>
    appliedData?: Record<string, unknown> | null
    targetProjectId?: string | null
  }
  projectId?: string
  groupId?: string
  meetingId: string
  targetProjectName?: string
  onUpdate: () => void
}

const actionIcons: Record<string, typeof Plus> = {
  CREATE_TASK: Plus,
  UPDATE_TASK: Edit,
  COMPLETE_TASK: CheckCircle2,
  ADD_NOTE: MessageSquare,
  STATUS_UPDATE: ArrowRight,
}

const actionColors: Record<string, string> = {
  CREATE_TASK: "text-emerald-600 bg-emerald-50",
  UPDATE_TASK: "text-blue-600 bg-blue-50",
  COMPLETE_TASK: "text-emerald-600 bg-emerald-50",
  ADD_NOTE: "text-slate-600 bg-slate-100",
  STATUS_UPDATE: "text-amber-600 bg-amber-50",
}

function formatExtractedData(
  actionType: string,
  data: Record<string, unknown>
): string {
  const parts: string[] = []
  if (data.title) parts.push(`"${data.title}"`)
  if (data.targetTaskTitle) parts.push(`"${data.targetTaskTitle}"`)
  if (data.phaseName) parts.push(`Phase: ${data.phaseName}`)
  if (data.priority) parts.push(`${data.priority}`)
  if (data.assigneeName) parts.push(`→ ${data.assigneeName}`)
  if (data.targetPhaseName) parts.push(`Phase: ${data.targetPhaseName}`)
  if (data.newPhaseStatus) parts.push(`→ ${data.newPhaseStatus}`)
  if (actionType === "ADD_NOTE" && data.note) {
    const note = data.note as string
    parts.push(note.length > 80 ? note.slice(0, 80) + "..." : note)
  }
  return parts.join(" · ")
}

export function MeetingActionItem({
  action,
  projectId,
  groupId,
  meetingId,
  targetProjectName,
  onUpdate,
}: MeetingActionItemProps) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null)

  const Icon = actionIcons[action.actionType] || MessageSquare
  const basePath = groupId
    ? `/api/groups/${groupId}/meetings/${meetingId}/actions/${action.id}`
    : `/api/projects/${projectId}/meetings/${meetingId}/actions/${action.id}`

  async function handleReview(approved: boolean) {
    setLoading(approved ? "approve" : "reject")
    try {
      const res = await fetch(basePath, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved }),
        }
      )
      if (!res.ok) throw new Error("Failed to review action")
      onUpdate()
    } catch {
      // toast error
    } finally {
      setLoading(null)
    }
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-3 py-2.5",
        action.status === "APPROVED" && "border-emerald-200 bg-emerald-50/50",
        action.status === "REJECTED" && "border-red-200 bg-red-50/50",
        action.status === "FAILED" && "border-red-200 bg-red-50/50",
        action.status === "PENDING" && "border-slate-200 bg-white"
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
          actionColors[action.actionType] || "text-slate-500 bg-slate-100"
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-sm text-slate-800">{action.description}</p>
          {targetProjectName && (
            <span className="inline-flex shrink-0 items-center rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600">
              {targetProjectName}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-slate-400">
          {formatExtractedData(
            action.actionType,
            action.extractedData as Record<string, unknown>
          )}
        </p>
      </div>

      {action.status === "PENDING" && (
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
            onClick={() => handleReview(true)}
            disabled={loading !== null}
          >
            {loading === "approve" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={() => handleReview(false)}
            disabled={loading !== null}
          >
            {loading === "reject" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <X className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      )}

      {action.status === "APPROVED" && (
        <span className="shrink-0 text-xs font-medium text-emerald-600">
          Applied
        </span>
      )}
      {action.status === "REJECTED" && (
        <span className="shrink-0 text-xs font-medium text-red-500">
          Rejected
        </span>
      )}
      {action.status === "FAILED" && (
        <span className="shrink-0 text-xs font-medium text-red-500">
          Failed
        </span>
      )}
    </div>
  )
}
