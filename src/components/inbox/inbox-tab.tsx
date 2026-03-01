"use client"

import { useState, useCallback } from "react"
import { Inbox, Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { InboxComposeDialog } from "./inbox-compose-dialog"
import { InboxMessageCard } from "./inbox-message-card"

interface InboxMessage {
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

interface InboxTabProps {
  projectId: string
  initialMessages: InboxMessage[]
}

const FILTERS = [
  { value: "", label: "All" },
  { value: "REVIEWED", label: "Pending" },
  { value: "APPLIED", label: "Applied" },
  { value: "REJECTED", label: "Rejected" },
  { value: "FAILED", label: "Failed" },
] as const

export function InboxTab({ projectId, initialMessages }: InboxTabProps) {
  const [messages, setMessages] = useState<InboxMessage[]>(initialMessages)
  const [filter, setFilter] = useState("")
  const [loading, setLoading] = useState(false)

  const fetchMessages = useCallback(
    async (statusFilter?: string) => {
      setLoading(true)
      try {
        const url = new URL(
          `/api/projects/${projectId}/inbox`,
          window.location.origin
        )
        if (statusFilter) url.searchParams.set("status", statusFilter)

        const res = await fetch(url)
        if (!res.ok) throw new Error()
        const data = await res.json()
        setMessages(data.items)
      } catch {
        // keep current messages
      } finally {
        setLoading(false)
      }
    },
    [projectId]
  )

  function handleFilterChange(value: string) {
    setFilter(value)
    fetchMessages(value)
  }

  function handleUpdate() {
    fetchMessages(filter)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <div className="flex gap-1">
            {FILTERS.map((f) => (
              <Button
                key={f.value}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 text-xs",
                  filter === f.value &&
                    "bg-slate-100 font-medium text-slate-900"
                )}
                onClick={() => handleFilterChange(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>
        <InboxComposeDialog projectId={projectId} onSubmitted={handleUpdate} />
      </div>

      {/* Messages */}
      {loading && messages.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <Inbox className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm font-medium text-slate-500">
            No inbox messages
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Submit updates to have AI analyze and extract project actions.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <InboxMessageCard
              key={msg.id}
              message={msg}
              projectId={projectId}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
