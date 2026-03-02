"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { SurveyCard } from "./survey-card"
import { CreateSurveyDialog } from "./create-survey-dialog"
import { SurveyDetailSheet } from "./survey-detail-sheet"

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

interface SurveysTabProps {
  projectId: string
  initialSurveys: SurveyData[]
  canEdit: boolean
}

export function SurveysTab({
  projectId,
  initialSurveys,
  canEdit,
}: SurveysTabProps) {
  const [surveys, setSurveys] = useState<SurveyData[]>(initialSurveys)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null)

  const selectedSurvey = surveys.find((s) => s.id === selectedSurveyId) ?? null

  const handleCreated = useCallback((survey: SurveyData) => {
    setSurveys((prev) => [survey, ...prev])
  }, [])

  const handleUpdated = useCallback((updated: SurveyData) => {
    setSurveys((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    )
  }, [])

  const handleDeleted = useCallback((surveyId: string) => {
    setSurveys((prev) => prev.filter((s) => s.id !== surveyId))
    setSelectedSurveyId(null)
  }, [])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Surveys</h2>
        {canEdit && (
          <Button
            onClick={() => setCreateDialogOpen(true)}
            size="sm"
            className="gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Survey
          </Button>
        )}
      </div>

      {surveys.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <p className="text-sm text-slate-500">
            No surveys yet.
            {canEdit && " Create your first survey to start collecting feedback."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {surveys.map((survey) => (
            <SurveyCard
              key={survey.id}
              survey={survey}
              onClick={() => setSelectedSurveyId(survey.id)}
            />
          ))}
        </div>
      )}

      {canEdit && (
        <CreateSurveyDialog
          projectId={projectId}
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onCreated={handleCreated}
        />
      )}

      <SurveyDetailSheet
        survey={selectedSurvey}
        projectId={projectId}
        open={!!selectedSurveyId}
        onOpenChange={(open) => {
          if (!open) setSelectedSurveyId(null)
        }}
        canEdit={canEdit}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />
    </div>
  )
}
