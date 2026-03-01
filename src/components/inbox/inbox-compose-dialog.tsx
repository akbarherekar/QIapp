"use client"

import { useState } from "react"
import { Send, Loader2 } from "lucide-react"
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

interface InboxComposeDialogProps {
  projectId: string
  onSubmitted: () => void
}

export function InboxComposeDialog({
  projectId,
  onSubmitted,
}: InboxComposeDialogProps) {
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!body.trim()) return

    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/inbox`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim() || undefined,
          body: body.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to submit")
      }

      toast.success("Message processed successfully")
      setSubject("")
      setBody("")
      setOpen(false)
      onSubmitted()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit message"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Send className="h-3.5 w-3.5" />
          Submit Update
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit Project Update</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <Label htmlFor="inbox-subject" className="text-xs text-slate-500">
              Subject (optional)
            </Label>
            <Input
              id="inbox-subject"
              placeholder="e.g., Weekly standup notes"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={loading}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="inbox-body" className="text-xs text-slate-500">
              Message
            </Label>
            <Textarea
              id="inbox-body"
              placeholder="Paste meeting notes, status updates, observations, or any project-related information..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={loading}
              className="mt-1 min-h-[200px] resize-y"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              AI will analyze this message and suggest actions like creating
              tasks, updating statuses, or logging notes.
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
              disabled={loading || !body.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
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
