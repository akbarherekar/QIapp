"use client"

import { formatDistanceToNow } from "date-fns"
import { ClipboardList, MessageSquare } from "lucide-react"
import { SurveyStatusBadge } from "./survey-status-badge"

interface SurveyCardProps {
  survey: {
    id: string
    title: string
    description: string | null
    status: string
    createdAt: string
    questions: Array<{ id: string }>
    _count: { responses: number }
  }
  onClick: () => void
}

export function SurveyCard({ survey, onClick }: SurveyCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
            <ClipboardList className="h-4.5 w-4.5 text-slate-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {survey.title}
            </h3>
            <SurveyStatusBadge status={survey.status} />
          </div>
        </div>
      </div>

      {survey.description && (
        <p className="mt-2 line-clamp-2 text-xs text-slate-500">
          {survey.description}
        </p>
      )}

      <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
        <span>{survey.questions.length} question{survey.questions.length !== 1 ? "s" : ""}</span>
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          {survey._count.responses} response{survey._count.responses !== 1 ? "s" : ""}
        </span>
        <span>
          {formatDistanceToNow(new Date(survey.createdAt), { addSuffix: true })}
        </span>
      </div>
    </button>
  )
}
