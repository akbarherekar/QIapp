import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { PublicSurveyForm } from "@/components/surveys/public-survey-form"

export default async function PublicSurveyPage({
  params,
}: {
  params: Promise<{ surveyId: string }>
}) {
  const { surveyId } = await params

  const survey = await db.survey.findUnique({
    where: { id: surveyId },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      questions: {
        orderBy: { orderIndex: "asc" },
        select: {
          id: true,
          text: true,
          type: true,
          required: true,
          options: true,
          orderIndex: true,
        },
      },
    },
  })

  if (!survey) notFound()

  if (survey.status !== "PUBLISHED") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">
            Survey Unavailable
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            This survey is no longer accepting responses.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          {survey.title}
        </h1>
        {survey.description && (
          <p className="mt-2 text-sm text-slate-500">{survey.description}</p>
        )}
        <div className="mt-1 text-xs text-slate-400">
          {survey.questions.length} question{survey.questions.length !== 1 ? "s" : ""}
        </div>
      </div>

      <PublicSurveyForm
        surveyId={survey.id}
        questions={survey.questions.map((q) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          required: q.required,
          options: q.options as string[] | null,
        }))}
      />
    </div>
  )
}
