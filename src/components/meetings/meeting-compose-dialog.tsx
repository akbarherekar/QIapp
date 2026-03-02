"use client"

import { useState } from "react"
import { NotebookText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface MeetingComposeDialogProps {
  projectId: string
  onSubmitted: () => void
}

export function MeetingComposeDialog({
  projectId,
  onSubmitted,
}: MeetingComposeDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [meetingDate, setMeetingDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [attendees, setAttendees] = useState("")
  const [duration, setDuration] = useState("")
  const [transcript, setTranscript] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!title.trim() || !transcript.trim()) return

    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          meetingDate,
          attendees: attendees.trim() || undefined,
          duration: duration ? parseInt(duration) : undefined,
          transcript: transcript.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to submit")
      }

      toast.success("Meeting notes processed successfully")
      setTitle("")
      setMeetingDate(new Date().toISOString().split("T")[0])
      setAttendees("")
      setDuration("")
      setTranscript("")
      setOpen(false)
      onSubmitted()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit meeting notes"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <NotebookText className="h-3.5 w-3.5" />
          Submit Meeting Notes
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit Meeting Notes</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <Label htmlFor="meeting-title" className="text-xs text-slate-500">
              Meeting Title
            </Label>
            <Input
              id="meeting-title"
              placeholder="e.g., Weekly CAUTI Huddle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label
                htmlFor="meeting-date"
                className="text-xs text-slate-500"
              >
                Meeting Date
              </Label>
              <Input
                id="meeting-date"
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                disabled={loading}
                className="mt-1"
              />
            </div>
            <div>
              <Label
                htmlFor="meeting-duration"
                className="text-xs text-slate-500"
              >
                Duration (minutes)
              </Label>
              <Input
                id="meeting-duration"
                type="number"
                placeholder="e.g., 30"
                min={1}
                max={600}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                disabled={loading}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label
              htmlFor="meeting-attendees"
              className="text-xs text-slate-500"
            >
              Attendees (optional)
            </Label>
            <Input
              id="meeting-attendees"
              placeholder="e.g., Dr. Chen, James Wilson, Maria Garcia"
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              disabled={loading}
              className="mt-1"
            />
          </div>

          <div>
            <Label
              htmlFor="meeting-transcript"
              className="text-xs text-slate-500"
            >
              Meeting Notes / Transcript
            </Label>
            <Textarea
              id="meeting-transcript"
              placeholder="Paste meeting notes, transcript, or summary here..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              disabled={loading}
              className="mt-1 min-h-[200px] resize-y"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              AI will analyze the notes and extract action items, decisions, and
              status updates for your project.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={handleSubmit}
              disabled={loading || !title.trim() || !transcript.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <NotebookText className="h-3.5 w-3.5" />
                  Submit & Process
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
