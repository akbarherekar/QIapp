"use client"

import dynamic from "next/dynamic"

const BarChart = dynamic(
  () => import("recharts").then((mod) => mod.BarChart),
  { ssr: false }
)
const Bar = dynamic(
  () => import("recharts").then((mod) => mod.Bar),
  { ssr: false }
)
const XAxis = dynamic(
  () => import("recharts").then((mod) => mod.XAxis),
  { ssr: false }
)
const YAxis = dynamic(
  () => import("recharts").then((mod) => mod.YAxis),
  { ssr: false }
)
const Tooltip = dynamic(
  () => import("recharts").then((mod) => mod.Tooltip),
  { ssr: false }
)
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
)

interface Question {
  id: string
  text: string
  type: string
  options: unknown
}

interface Response {
  id: string
  respondentName: string | null
  submittedAt: string
  answers: Array<{
    questionId: string
    value: string
  }>
}

interface SurveyResultsViewProps {
  questions: Question[]
  responses: Response[]
}

function getAnswersForQuestion(
  questionId: string,
  responses: Response[]
): string[] {
  return responses.flatMap((r) =>
    r.answers.filter((a) => a.questionId === questionId).map((a) => a.value)
  )
}

function buildDistribution(answers: string[], labels: string[]) {
  const counts: Record<string, number> = {}
  for (const label of labels) counts[label] = 0
  for (const answer of answers) {
    if (counts[answer] !== undefined) counts[answer]++
  }
  return labels.map((label) => ({ name: label, count: counts[label] || 0 }))
}

export function SurveyResultsView({
  questions,
  responses,
}: SurveyResultsViewProps) {
  if (responses.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-400">
        No responses yet
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        {responses.length} response{responses.length !== 1 ? "s" : ""} collected
      </p>

      {questions.map((q) => {
        const answers = getAnswersForQuestion(q.id, responses)

        return (
          <div
            key={q.id}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <h4 className="text-sm font-medium text-slate-700">{q.text}</h4>
            <p className="mb-3 text-xs text-slate-400">
              {answers.length} answer{answers.length !== 1 ? "s" : ""}
            </p>

            {q.type === "TEXT" && (
              <div className="max-h-40 space-y-1.5 overflow-y-auto">
                {answers.map((a, i) => (
                  <p key={i} className="rounded bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
                    {a}
                  </p>
                ))}
              </div>
            )}

            {q.type === "RATING" && (
              <div>
                <div className="mb-2 text-lg font-semibold text-slate-900">
                  {answers.length > 0
                    ? (
                        answers.reduce((s, a) => s + Number(a), 0) /
                        answers.length
                      ).toFixed(1)
                    : "—"}
                  <span className="ml-1 text-sm font-normal text-slate-400">
                    / 5 average
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart
                    data={buildDistribution(
                      answers,
                      ["1", "2", "3", "4", "5"]
                    )}
                  >
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {q.type === "YES_NO" && (
              <ResponsiveContainer width="100%" height={100}>
                <BarChart
                  data={buildDistribution(answers, ["Yes", "No"])}
                  layout="vertical"
                >
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    width={40}
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {q.type === "MULTIPLE_CHOICE" && (
              <ResponsiveContainer
                width="100%"
                height={Math.max(
                  80,
                  ((q.options as string[])?.length || 2) * 36
                )}
              >
                <BarChart
                  data={buildDistribution(
                    answers,
                    (q.options as string[]) || []
                  )}
                  layout="vertical"
                >
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    width={120}
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {q.type === "LIKERT_SCALE" && (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={buildDistribution(answers, [
                    "Strongly Disagree",
                    "Disagree",
                    "Neutral",
                    "Agree",
                    "Strongly Agree",
                  ])}
                  layout="vertical"
                >
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    width={120}
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )
      })}
    </div>
  )
}
