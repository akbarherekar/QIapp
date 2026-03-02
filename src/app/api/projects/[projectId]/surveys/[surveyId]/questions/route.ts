import { NextResponse } from "next/server"
import { Prisma } from "@/generated/prisma/client"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { addQuestionSchema } from "@/lib/validations/survey"
import { logActivity } from "@/lib/activity-logger"

type Params = { params: Promise<{ projectId: string; surveyId: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, surveyId } = await params

    if (session.user.role !== "DIRECTOR") {
      const membership = await db.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: session.user.id } },
      })
      if (!membership) {
        return NextResponse.json({ error: "Not a project member" }, { status: 403 })
      }
    }

    const questions = await db.surveyQuestion.findMany({
      where: { surveyId },
      orderBy: { orderIndex: "asc" },
    })

    return NextResponse.json(questions)
  } catch {
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, surveyId } = await params

    if (session.user.role !== "DIRECTOR") {
      const membership = await db.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: session.user.id } },
      })
      if (!membership || membership.role !== "LEAD") {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
      }
    }

    const survey = await db.survey.findUnique({
      where: { id: surveyId, projectId },
    })
    if (!survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 })
    }
    if (survey.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Questions can only be added to DRAFT surveys" },
        { status: 400 }
      )
    }

    const body = await req.json()
    const parsed = addQuestionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Auto-assign orderIndex if not provided
    let orderIndex = data.orderIndex
    if (orderIndex === undefined) {
      const maxOrder = await db.surveyQuestion.findFirst({
        where: { surveyId },
        orderBy: { orderIndex: "desc" },
        select: { orderIndex: true },
      })
      orderIndex = (maxOrder?.orderIndex ?? -1) + 1
    }

    const question = await db.surveyQuestion.create({
      data: {
        surveyId,
        text: data.text,
        type: data.type,
        required: data.required,
        options: data.options ?? Prisma.JsonNull,
        orderIndex,
      },
    })

    await logActivity({
      projectId,
      userId: session.user.id,
      action: "SURVEY_UPDATED",
      details: `Added question to survey "${survey.title}"`,
      metadata: { surveyId, questionId: question.id },
    })

    return NextResponse.json(question, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
