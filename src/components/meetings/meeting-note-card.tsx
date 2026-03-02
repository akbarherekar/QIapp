"use client"

import { useState } from "react"
import { formatDistanceToNow, format } from "date-fns"
import {
  ChevronDown,
  ChevronUp,
  CheckCheck,
  XCircle,
  RefreshCw,
  Loader2,
  AlertCircle,
  Clock,
  Users,
  Calendar,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MeetingActionItem } from "./meeting-action-item"

interface MeetingNoteCardProps {
  meetingNote: {
    id: string
    status: string
    title: string
    meetingDate: string
    attendees: string | null
    duration: number | null
    rawTranscript: string
    processedSummary: string | null
    keyDecisions: string[] | null
    errorMessage: string | null
    createdAt: string
    submittedBy: { id: string; name: string; avatarUrl: string | null }
    actions: Array<{
      id: string
      actionType: string
      status: string
      description: string
      extractedData: Record<string, unknown>
      appliedData?: Record<string, unknown> | null
    }>
  }
  projectId: string
  onUpdate: () => void
}

const statusStyles: Record<string, { label: string; color: string }> = {
  RECEIVED: { label: "Received", color: "bg-slate-100 text-slate-600" },
  PROCESSING: { label: "Processing", color: "bg-blue-100 text-blue-600" },
  REVIEWED: { label: "Pending Review", color: "bg-amber-100 text-amber-700" },
  APPLIED: { label: "Applied", color: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-600" },
  FAILED: { label: "Failed", color: "bg-red-100 text-red-600" },
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function MeetingNoteCard({
  meetingNote,
  projectId,
  onUpdate,
}: MeetingNoteCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [bulkLoading, setBulkLoading] = useState<
    "approve" | "reject" | "reprocess" | null
  >(null)

  const statusStyle =
    statusStyles[meetingNote.status] || statusStyles.RECEIVED
  const pendingActions = meetingNote.actions.filter(
    (a) => a.status === "PENDING"
  )
  const hasPendingActions = pendingActions.length > 0
  const keyDecisions = Array.isArray(meetingNote.keyDecisions)
    ? meetingNote.keyDecisions
    : []

  async function handleApproveAll() {
    setBulkLoading("approve")
    try {
      const res = await fetch(
        `/api/projects/${projectId}/meetings/${meetingNote.id}/apply-all`,
        { method: "POST" }
      )
      if (!res.ok) throw new Error()
      onUpdate()
    } catch {
      // toast error
    } finally {
      setBulkLoading(null)
    }
  }

  async function handleRejectAll() {
    setBulkLoading("reject")
    try {
      for (const action of pendingActions) {
        await fetch(
          `/api/projects/${projectId}/meetings/${meetingNote.id}/actions/${action.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ approved: false }),
          }
        )
      }
      onUpdate()
    } catch {
      // toast error
    } finally {
      setBulkLoading(null)
    }
  }

  async function handleReprocess() {
    setBulkLoading("reprocess")
    try {
      const res = await fetch(
        `/api/projects/${projectId}/meetings/${meetingNote.id}/reprocess`,
        { method: "POST" }
      )
      if (!res.ok) throw new Error()
      onUpdate()
    } catch {
      // toast error
    } finally {
      setBulkLoading(null)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-slate-100 text-xs text-slate-500">
            {getInitials(meetingNote.submittedBy.name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-900">
              {meetingNote.title}
            </span>
            <span className="text-xs text-slate-400">
              {formatDistanceToNow(new Date(meetingNote.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge
              className={cn(
                "h-5 px-1.5 text-[10px] font-medium border-0",
                statusStyle.color
              )}
            >
              {statusStyle.label}
            </Badge>
            <Badge
              variant="outline"
              className="h-5 gap-1 px-1.5 text-[10px] font-normal"
            >
              <Calendar className="h-3 w-3" />
              {format(new Date(meetingNote.meetingDate), "MMM d, yyyy")}
            </Badge>
            {meetingNote.duration && (
              <Badge
                variant="outline"
                className="h-5 gap-1 px-1.5 text-[10px] font-normal"
              >
                <Clock className="h-3 w-3" />
                {meetingNote.duration} min
              </Badge>
            )}
            {meetingNote.attendees && (
              <Badge
                variant="outline"
                className="h-5 gap-1 px-1.5 text-[10px] font-normal"
              >
                <Users className="h-3 w-3" />
                Attendees
              </Badge>
            )}
          </div>

          <p className="mt-1 text-xs text-slate-400">
            Submitted by {meetingNote.submittedBy.name}
          </p>

          {/* Summary */}
          {meetingNote.processedSummary && (
            <p className="mt-2 text-sm text-slate-600">
              {meetingNote.processedSummary}
            </p>
          )}

          {/* Key decisions */}
          {keyDecisions.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-slate-500">
                Key Decisions
              </p>
              <ul className="mt-1 space-y-0.5">
                {keyDecisions.map((decision, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-1.5 text-xs text-slate-600"
                  >
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                    {decision}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Error message */}
          {meetingNote.status === "FAILED" && meetingNote.errorMessage && (
            <div className="mt-2 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
              <p className="text-xs text-red-600">
                {meetingNote.errorMessage}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Actions list */}
      {meetingNote.actions.length > 0 && (
        <div className="border-t border-slate-100 px-4 py-3">
          <p className="mb-2 text-xs font-medium text-slate-400">
            Extracted Actions ({meetingNote.actions.length})
          </p>
          <div className="space-y-2">
            {meetingNote.actions.map((action) => (
              <MeetingActionItem
                key={action.id}
                action={action}
                projectId={projectId}
                meetingId={meetingNote.id}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bulk actions + raw transcript toggle */}
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
        >
          {expanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
          {expanded ? "Hide" : "Show"} transcript
        </button>

        <div className="flex gap-1.5">
          {meetingNote.status === "FAILED" && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={handleReprocess}
              disabled={bulkLoading !== null}
            >
              {bulkLoading === "reprocess" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Retry
            </Button>
          )}
          {hasPendingActions && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
                onClick={handleRejectAll}
                disabled={bulkLoading !== null}
              >
                {bulkLoading === "reject" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                Reject All
              </Button>
              <Button
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={handleApproveAll}
                disabled={bulkLoading !== null}
              >
                {bulkLoading === "approve" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCheck className="h-3 w-3" />
                )}
                Approve All
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Expanded raw transcript */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
          {meetingNote.attendees && (
            <p className="mb-2 text-xs text-slate-500">
              <strong>Attendees:</strong> {meetingNote.attendees}
            </p>
          )}
          <pre className="whitespace-pre-wrap text-xs text-slate-600">
            {meetingNote.rawTranscript}
          </pre>
        </div>
      )}
    </div>
  )
}
