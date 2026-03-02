import { NextResponse } from "next/server"
import { Prisma } from "@/generated/prisma/client"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { updateQuestionSchema } from "@/lib/validations/survey"
import { logActivity } from "@/lib/activity-logger"

type Params = {
  params: Promise<{ projectId: string; surveyId: string; questionId: string }>
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, surveyId, questionId } = await params

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
        { error: "Questions can only be edited on DRAFT surveys" },
        { status: 400 }
      )
    }

    const body = await req.json()
    const parsed = updateQuestionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const updateData = {
      ...parsed.data,
      options:
        parsed.data.options === null
          ? Prisma.JsonNull
          : parsed.data.options === undefined
            ? undefined
            : parsed.data.options,
    }

    const question = await db.surveyQuestion.update({
      where: { id: questionId, surveyId },
      data: updateData,
    })

    await logActivity({
      projectId,
      userId: session.user.id,
      action: "SURVEY_UPDATED",
      details: `Updated question in survey "${survey.title}"`,
      metadata: { surveyId, questionId },
    })

    return NextResponse.json(question)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, surveyId, questionId } = await params

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
        { error: "Questions can only be deleted from DRAFT surveys" },
        { status: 400 }
      )
    }

    await db.surveyQuestion.delete({ where: { id: questionId, surveyId } })

    await logActivity({
      projectId,
      userId: session.user.id,
      action: "SURVEY_UPDATED",
      details: `Removed question from survey "${survey.title}"`,
      metadata: { surveyId, questionId },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
