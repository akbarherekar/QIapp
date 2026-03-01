"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import {
  ChevronDown,
  ChevronUp,
  CheckCheck,
  XCircle,
  RefreshCw,
  Loader2,
  Mail,
  MessageSquare,
  Edit,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { InboxActionItem } from "./inbox-action-item"

interface InboxMessageCardProps {
  message: {
    id: string
    channel: string
    status: string
    senderIdentifier: string
    subject: string | null
    rawBody: string
    processedSummary: string | null
    classification: string | null
    errorMessage: string | null
    createdAt: string
    sender: { id: string; name: string; avatarUrl: string | null } | null
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

const classificationLabels: Record<string, { label: string; color: string }> = {
  new_tasks: { label: "New Tasks", color: "bg-emerald-100 text-emerald-700" },
  task_update: { label: "Task Update", color: "bg-blue-100 text-blue-700" },
  status_report: { label: "Status Report", color: "bg-purple-100 text-purple-700" },
  meeting_notes: { label: "Meeting Notes", color: "bg-amber-100 text-amber-700" },
  metric_data: { label: "Metric Data", color: "bg-cyan-100 text-cyan-700" },
  general_observation: { label: "Observation", color: "bg-slate-100 text-slate-700" },
}

const channelIcons: Record<string, typeof Mail> = {
  MANUAL: Edit,
  EMAIL: Mail,
  SMS: MessageSquare,
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

export function InboxMessageCard({
  message,
  projectId,
  onUpdate,
}: InboxMessageCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [bulkLoading, setBulkLoading] = useState<
    "approve" | "reject" | "reprocess" | null
  >(null)

  const ChannelIcon = channelIcons[message.channel] || Edit
  const classification = message.classification
    ? classificationLabels[message.classification]
    : null
  const statusStyle = statusStyles[message.status] || statusStyles.RECEIVED
  const pendingActions = message.actions.filter((a) => a.status === "PENDING")
  const hasPendingActions = pendingActions.length > 0

  async function handleApproveAll() {
    setBulkLoading("approve")
    try {
      const res = await fetch(
        `/api/projects/${projectId}/inbox/${message.id}/apply-all`,
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
      // Reject each pending action
      for (const action of pendingActions) {
        await fetch(
          `/api/projects/${projectId}/inbox/${message.id}/actions/${action.id}`,
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
        `/api/projects/${projectId}/inbox/${message.id}/reprocess`,
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
            {message.sender ? getInitials(message.sender.name) : "?"}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-900">
              {message.sender?.name || message.senderIdentifier}
            </span>
            <span className="text-xs text-slate-400">
              {formatDistanceToNow(new Date(message.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className="h-5 gap-1 px-1.5 text-[10px] font-normal"
            >
              <ChannelIcon className="h-3 w-3" />
              {message.channel}
            </Badge>
            <Badge className={cn("h-5 px-1.5 text-[10px] font-medium border-0", statusStyle.color)}>
              {statusStyle.label}
            </Badge>
            {classification && (
              <Badge
                className={cn(
                  "h-5 px-1.5 text-[10px] font-medium border-0",
                  classification.color
                )}
              >
                {classification.label}
              </Badge>
            )}
          </div>

          {/* Summary */}
          {message.processedSummary && (
            <p className="mt-2 text-sm text-slate-600">
              {message.processedSummary}
            </p>
          )}

          {/* Error message */}
          {message.status === "FAILED" && message.errorMessage && (
            <div className="mt-2 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
              <p className="text-xs text-red-600">{message.errorMessage}</p>
            </div>
          )}

          {/* Subject */}
          {message.subject && (
            <p className="mt-1 text-xs font-medium text-slate-500">
              Subject: {message.subject}
            </p>
          )}
        </div>
      </div>

      {/* Actions list */}
      {message.actions.length > 0 && (
        <div className="border-t border-slate-100 px-4 py-3">
          <p className="mb-2 text-xs font-medium text-slate-400">
            Extracted Actions ({message.actions.length})
          </p>
          <div className="space-y-2">
            {message.actions.map((action) => (
              <InboxActionItem
                key={action.id}
                action={action}
                projectId={projectId}
                messageId={message.id}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bulk actions + raw body toggle */}
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
          {expanded ? "Hide" : "Show"} original message
        </button>

        <div className="flex gap-1.5">
          {message.status === "FAILED" && (
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

      {/* Expanded raw body */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
          <pre className="whitespace-pre-wrap text-xs text-slate-600">
            {message.rawBody}
          </pre>
        </div>
      )}
    </div>
  )
}
