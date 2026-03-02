"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { CheckCircle2 } from "lucide-react"

interface Question {
  id: string
  text: string
  type: string
  required: boolean
  options: string[] | null
}

interface PublicSurveyFormProps {
  surveyId: string
  questions: Question[]
}

const LIKERT_OPTIONS = [
  "Strongly Disagree",
  "Disagree",
  "Neutral",
  "Agree",
  "Strongly Agree",
]

export function PublicSurveyForm({ surveyId, questions }: PublicSurveyFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [respondentName, setRespondentName] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Check required questions
    const missing = questions.filter(
      (q) => q.required && !answers[q.id]?.trim()
    )
    if (missing.length > 0) {
      toast.error("Please answer all required questions")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/surveys/${surveyId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          respondentName: respondentName || null,
          answers: Object.entries(answers)
            .filter(([, v]) => v.trim())
            .map(([questionId, value]) => ({ questionId, value })),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Failed to submit response")
        return
      }

      setSubmitted(true)
    } catch {
      toast.error("Failed to submit response")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-slate-900">
          Thank you!
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Your response has been recorded successfully.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      {/* Optional respondent name */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Label htmlFor="respondent-name" className="text-sm font-medium text-slate-700">
          Your Name (optional)
        </Label>
        <Input
          id="respondent-name"
          value={respondentName}
          onChange={(e) => setRespondentName(e.target.value)}
          placeholder="Anonymous"
          className="mt-1.5"
        />
      </div>

      {/* Questions */}
      {questions.map((q, idx) => (
        <div
          key={q.id}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-start gap-2">
            <span className="text-sm font-medium text-slate-400">
              {idx + 1}.
            </span>
            <div className="flex-1">
              <Label className="text-sm font-medium text-slate-700">
                {q.text}
                {q.required && (
                  <span className="ml-1 text-red-500">*</span>
                )}
              </Label>

              <div className="mt-3">
                {q.type === "TEXT" && (
                  <Textarea
                    value={answers[q.id] || ""}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    placeholder="Type your answer..."
                    rows={3}
                  />
                )}

                {q.type === "RATING" && (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setAnswer(q.id, String(n))}
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-medium transition-colors",
                          answers[q.id] === String(n)
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                )}

                {q.type === "YES_NO" && (
                  <div className="flex gap-3">
                    {["Yes", "No"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAnswer(q.id, opt)}
                        className={cn(
                          "rounded-lg border px-6 py-2 text-sm font-medium transition-colors",
                          answers[q.id] === opt
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {q.type === "MULTIPLE_CHOICE" && q.options && (
                  <div className="space-y-2">
                    {q.options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAnswer(q.id, opt)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors",
                          answers[q.id] === opt
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                            answers[q.id] === opt
                              ? "border-emerald-500 bg-emerald-500"
                              : "border-slate-300"
                          )}
                        >
                          {answers[q.id] === opt && (
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {q.type === "LIKERT_SCALE" && (
                  <div className="space-y-2">
                    {LIKERT_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAnswer(q.id, opt)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors",
                          answers[q.id] === opt
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                            answers[q.id] === opt
                              ? "border-emerald-500 bg-emerald-500"
                              : "border-slate-300"
                          )}
                        >
                          {answers[q.id] === opt && (
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading} size="lg">
          {loading ? "Submitting..." : "Submit Response"}
        </Button>
      </div>
    </form>
  )
}
