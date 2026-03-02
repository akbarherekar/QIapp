import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { submitResponseSchema } from "@/lib/validations/survey"
import { logActivity } from "@/lib/activity-logger"

type Params = { params: Promise<{ surveyId: string }> }

// Public endpoint — no auth required
// GET returns survey details for rendering the form
export async function GET(_req: Request, { params }: Params) {
  try {
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

    if (!survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 })
    }

    if (survey.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "This survey is not currently accepting responses" },
        { status: 403 }
      )
    }

    return NextResponse.json(survey)
  } catch {
    return NextResponse.json({ error: "Failed to fetch survey" }, { status: 500 })
  }
}

// Public endpoint — no auth required
// POST submits a response
export async function POST(req: Request, { params }: Params) {
  try {
    const { surveyId } = await params

    const survey = await db.survey.findUnique({
      where: { id: surveyId },
      include: {
        questions: { orderBy: { orderIndex: "asc" } },
      },
    })

    if (!survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 })
    }

    if (survey.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "This survey is not currently accepting responses" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const parsed = submitResponseSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Validate required questions are answered
    const requiredQuestionIds = survey.questions
      .filter((q) => q.required)
      .map((q) => q.id)

    const answeredQuestionIds = new Set(data.answers.map((a) => a.questionId))

    const missingRequired = requiredQuestionIds.filter(
      (id) => !answeredQuestionIds.has(id)
    )

    if (missingRequired.length > 0) {
      return NextResponse.json(
        {
          error: "Missing required answers",
          details: missingRequired.map((id) => ({
            questionId: id,
            message: "This question is required",
          })),
        },
        { status: 400 }
      )
    }

    // Validate all questionIds belong to this survey
    const validQuestionIds = new Set(survey.questions.map((q) => q.id))
    const invalidAnswers = data.answers.filter(
      (a) => !validQuestionIds.has(a.questionId)
    )
    if (invalidAnswers.length > 0) {
      return NextResponse.json(
        { error: "Invalid question IDs in answers" },
        { status: 400 }
      )
    }

    const response = await db.surveyResponse.create({
      data: {
        surveyId,
        respondentName: data.respondentName ?? null,
        answers: {
          create: data.answers.map((a) => ({
            questionId: a.questionId,
            value: a.value,
          })),
        },
      },
      include: {
        answers: true,
      },
    })

    // Log activity (find the survey's project for the activity log)
    await logActivity({
      projectId: survey.projectId,
      userId: survey.createdById,
      action: "SURVEY_RESPONSE_RECEIVED",
      details: `New response received for survey "${survey.title}"`,
      source: "SYSTEM",
      metadata: { surveyId, responseId: response.id },
    })

    return NextResponse.json({ success: true, responseId: response.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
