"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SurveyStatusBadge } from "./survey-status-badge"
import { SurveyResultsView } from "./survey-results-view"
import {
  Send,
  XCircle,
  Copy,
  ExternalLink,
  Trash2,
  BarChart3,
  List,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Question {
  id: string
  text: string
  type: string
  required: boolean
  options: unknown
  orderIndex: number
}

interface SurveyData {
  id: string
  title: string
  description: string | null
  status: string
  createdAt: string
  publishedAt: string | null
  closedAt: string | null
  questions: Question[]
  _count: { responses: number }
  createdBy: { id: string; name: string; avatarUrl: string | null } | null
}

interface ResponseData {
  id: string
  respondentName: string | null
  submittedAt: string
  answers: Array<{
    questionId: string
    value: string
  }>
}

interface SurveyDetailSheetProps {
  survey: SurveyData | null
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  canEdit: boolean
  onUpdated: (survey: SurveyData) => void
  onDeleted: (surveyId: string) => void
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  TEXT: "Free Text",
  RATING: "Rating (1-5)",
  MULTIPLE_CHOICE: "Multiple Choice",
  YES_NO: "Yes / No",
  LIKERT_SCALE: "Likert Scale",
}

export function SurveyDetailSheet({
  survey,
  projectId,
  open,
  onOpenChange,
  canEdit,
  onUpdated,
  onDeleted,
}: SurveyDetailSheetProps) {
  const [view, setView] = useState<"questions" | "results">("questions")
  const [responses, setResponses] = useState<ResponseData[]>([])
  const [loadingResponses, setLoadingResponses] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchResponses = useCallback(async () => {
    if (!survey) return
    setLoadingResponses(true)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/surveys/${survey.id}/responses`
      )
      if (res.ok) {
        const data = await res.json()
        setResponses(data)
      }
    } catch {
      // silent fail
    } finally {
      setLoadingResponses(false)
    }
  }, [survey, projectId])

  useEffect(() => {
    if (open && survey && view === "results") {
      fetchResponses()
    }
  }, [open, survey, view, fetchResponses])

  if (!survey) return null

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/surveys/${survey.id}`
      : `/surveys/${survey.id}`

  async function handlePublish() {
    setActionLoading(true)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/surveys/${survey!.id}/publish`,
        { method: "POST" }
      )
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Failed to publish")
        return
      }
      const updated = await res.json()
      onUpdated(updated)
      toast.success("Survey published!")
    } catch {
      toast.error("Failed to publish survey")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleClose() {
    setActionLoading(true)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/surveys/${survey!.id}/close`,
        { method: "POST" }
      )
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Failed to close")
        return
      }
      const updated = await res.json()
      onUpdated(updated)
      toast.success("Survey closed")
    } catch {
      toast.error("Failed to close survey")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this survey? This cannot be undone.")) return
    setActionLoading(true)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/surveys/${survey!.id}`,
        { method: "DELETE" }
      )
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Failed to delete")
        return
      }
      onDeleted(survey!.id)
      onOpenChange(false)
      toast.success("Survey deleted")
    } catch {
      toast.error("Failed to delete survey")
    } finally {
      setActionLoading(false)
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(publicUrl)
    toast.success("Link copied to clipboard")
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {survey.title}
            <SurveyStatusBadge status={survey.status} />
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Survey info */}
          {survey.description && (
            <p className="text-sm text-slate-500">{survey.description}</p>
          )}

          <div className="flex flex-wrap gap-3 text-xs text-slate-400">
            <span>
              {survey.questions.length} question{survey.questions.length !== 1 ? "s" : ""}
            </span>
            <span>
              {survey._count.responses} response{survey._count.responses !== 1 ? "s" : ""}
            </span>
            {survey.createdBy && (
              <span>by {survey.createdBy.name}</span>
            )}
            <span>
              {formatDistanceToNow(new Date(survey.createdAt), { addSuffix: true })}
            </span>
          </div>

          {/* Public link (when published) */}
          {survey.status === "PUBLISHED" && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <div className="flex-1">
                <p className="text-xs font-medium text-emerald-700">
                  Public Survey Link
                </p>
                <p className="mt-0.5 truncate text-xs text-emerald-600">
                  {publicUrl}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyLink}
                className="h-8 gap-1 text-emerald-700"
              >
                <Copy className="h-3 w-3" />
                Copy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(publicUrl, "_blank")}
                className="h-8 w-8 p-0 text-emerald-700"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Action buttons */}
          {canEdit && (
            <div className="flex gap-2">
              {survey.status === "DRAFT" && (
                <Button
                  onClick={handlePublish}
                  disabled={actionLoading}
                  size="sm"
                  className="gap-1"
                >
                  <Send className="h-3 w-3" />
                  Publish
                </Button>
              )}
              {survey.status === "PUBLISHED" && (
                <Button
                  onClick={handleClose}
                  disabled={actionLoading}
                  variant="outline"
                  size="sm"
                  className="gap-1"
                >
                  <XCircle className="h-3 w-3" />
                  Close Survey
                </Button>
              )}
              <Button
                onClick={handleDelete}
                disabled={actionLoading}
                variant="outline"
                size="sm"
                className="gap-1 text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </Button>
            </div>
          )}

          {/* View toggle */}
          <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              onClick={() => setView("questions")}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                view === "questions"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <List className="mr-1 inline h-3 w-3" />
              Questions
            </button>
            <button
              onClick={() => setView("results")}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                view === "results"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <BarChart3 className="mr-1 inline h-3 w-3" />
              Results
              {survey._count.responses > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-4 min-w-4 px-1 text-[10px]"
                >
                  {survey._count.responses}
                </Badge>
              )}
            </button>
          </div>

          {/* Content */}
          {view === "questions" && (
            <div className="space-y-3">
              {survey.questions.map((q, i) => (
                <div
                  key={q.id}
                  className="rounded-lg border border-slate-200 bg-white p-3"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-slate-400">
                      {i + 1}.
                    </span>
                    <div>
                      <p className="text-sm text-slate-700">
                        {q.text}
                        {q.required && (
                          <span className="ml-1 text-red-500">*</span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {QUESTION_TYPE_LABELS[q.type] || q.type}
                        {q.type === "MULTIPLE_CHOICE" &&
                          Array.isArray(q.options) &&
                          ` (${q.options.length} options)`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {survey.questions.length === 0 && (
                <p className="py-4 text-center text-sm text-slate-400">
                  No questions added yet
                </p>
              )}
            </div>
          )}

          {view === "results" && (
            <>
              {loadingResponses ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  Loading responses...
                </div>
              ) : (
                <SurveyResultsView
                  questions={survey.questions}
                  responses={responses}
                />
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
