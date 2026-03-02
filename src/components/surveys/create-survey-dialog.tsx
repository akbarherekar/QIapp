"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { QuestionFormItem, type QuestionDraft } from "./question-form-item"

interface SurveyData {
  id: string
  title: string
  description: string | null
  status: string
  createdAt: string
  publishedAt: string | null
  closedAt: string | null
  questions: Array<{
    id: string
    text: string
    type: string
    required: boolean
    options: unknown
    orderIndex: number
  }>
  _count: { responses: number }
  createdBy: { id: string; name: string; avatarUrl: string | null } | null
}

interface CreateSurveyDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (survey: SurveyData) => void
}

function emptyQuestion(): QuestionDraft {
  return { text: "", type: "TEXT", required: true, options: [] }
}

export function CreateSurveyDialog({
  projectId,
  open,
  onOpenChange,
  onCreated,
}: CreateSurveyDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()])
  const [loading, setLoading] = useState(false)

  function reset() {
    setTitle("")
    setDescription("")
    setQuestions([emptyQuestion()])
  }

  function updateQuestion(idx: number, q: QuestionDraft) {
    setQuestions((prev) => prev.map((p, i) => (i === idx ? q : p)))
  }

  function removeQuestion(idx: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validate: at least 1 question with text
    const validQuestions = questions.filter((q) => q.text.trim())
    if (validQuestions.length === 0) {
      toast.error("Add at least one question")
      return
    }

    // Validate: MULTIPLE_CHOICE must have at least 2 options
    const invalidMC = validQuestions.find(
      (q) =>
        q.type === "MULTIPLE_CHOICE" &&
        q.options.filter((o) => o.trim()).length < 2
    )
    if (invalidMC) {
      toast.error("Multiple choice questions need at least 2 options")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/surveys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          questions: validQuestions.map((q) => ({
            text: q.text,
            type: q.type,
            required: q.required,
            options:
              q.type === "MULTIPLE_CHOICE"
                ? q.options.filter((o) => o.trim())
                : null,
          })),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Failed to create survey")
        return
      }

      const survey = await res.json()
      onCreated(survey)
      onOpenChange(false)
      reset()
      toast.success(`Survey "${survey.title}" created as draft`)
    } catch {
      toast.error("Failed to create survey")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Survey</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="survey-title">Title</Label>
            <Input
              id="survey-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Patient Discharge Experience"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="survey-desc">Description (optional)</Label>
            <Textarea
              id="survey-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the survey purpose..."
              rows={2}
              className="mt-1"
            />
          </div>

          {/* Questions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Questions</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuestions((prev) => [...prev, emptyQuestion()])}
                className="gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Question
              </Button>
            </div>

            {questions.map((q, i) => (
              <QuestionFormItem
                key={i}
                index={i}
                question={q}
                onChange={(updated) => updateQuestion(i, updated)}
                onRemove={() => removeQuestion(i)}
              />
            ))}

            {questions.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400">
                No questions added yet
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create as Draft"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
