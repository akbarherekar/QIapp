"use client"

import { useState, useCallback } from "react"
import { NotebookText, Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MeetingComposeDialog } from "./meeting-compose-dialog"
import { MeetingNoteCard } from "./meeting-note-card"

interface MeetingNote {
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

interface MeetingsTabProps {
  projectId: string
  initialMeetingNotes: MeetingNote[]
}

const FILTERS = [
  { value: "", label: "All" },
  { value: "REVIEWED", label: "Pending" },
  { value: "APPLIED", label: "Applied" },
  { value: "REJECTED", label: "Rejected" },
  { value: "FAILED", label: "Failed" },
] as const

export function MeetingsTab({
  projectId,
  initialMeetingNotes,
}: MeetingsTabProps) {
  const [meetingNotes, setMeetingNotes] =
    useState<MeetingNote[]>(initialMeetingNotes)
  const [filter, setFilter] = useState("")
  const [loading, setLoading] = useState(false)

  const fetchMeetingNotes = useCallback(
    async (statusFilter?: string) => {
      setLoading(true)
      try {
        const url = new URL(
          `/api/projects/${projectId}/meetings`,
          window.location.origin
        )
        if (statusFilter) url.searchParams.set("status", statusFilter)

        const res = await fetch(url)
        if (!res.ok) throw new Error()
        const data = await res.json()
        setMeetingNotes(data.items)
      } catch {
        // keep current meeting notes
      } finally {
        setLoading(false)
      }
    },
    [projectId]
  )

  function handleFilterChange(value: string) {
    setFilter(value)
    fetchMeetingNotes(value)
  }

  function handleUpdate() {
    fetchMeetingNotes(filter)
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
        <MeetingComposeDialog
          projectId={projectId}
          onSubmitted={handleUpdate}
        />
      </div>

      {/* Meeting Notes */}
      {loading && meetingNotes.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      ) : meetingNotes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <NotebookText className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm font-medium text-slate-500">
            No meeting notes
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Submit meeting notes to have AI extract action items and decisions.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {meetingNotes.map((note) => (
            <MeetingNoteCard
              key={note.id}
              meetingNote={note}
              projectId={projectId}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
