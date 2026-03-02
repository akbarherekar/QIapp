import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { updateSurveySchema } from "@/lib/validations/survey"
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

    const survey = await db.survey.findUnique({
      where: { id: surveyId, projectId },
      include: {
        questions: { orderBy: { orderIndex: "asc" } },
        _count: { select: { responses: true } },
        createdBy: { select: { id: true, name: true, avatarUrl: true } },
        responses: {
          orderBy: { submittedAt: "desc" },
          include: {
            answers: {
              include: {
                question: { select: { id: true, text: true, type: true } },
              },
            },
          },
        },
      },
    })

    if (!survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 })
    }

    return NextResponse.json(survey)
  } catch {
    return NextResponse.json({ error: "Failed to fetch survey" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: Params) {
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

    const existing = await db.survey.findUnique({
      where: { id: surveyId, projectId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 })
    }

    if (existing.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only DRAFT surveys can be edited" },
        { status: 400 }
      )
    }

    const body = await req.json()
    const parsed = updateSurveySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const survey = await db.survey.update({
      where: { id: surveyId },
      data: parsed.data,
      include: {
        questions: { orderBy: { orderIndex: "asc" } },
        _count: { select: { responses: true } },
        createdBy: { select: { id: true, name: true, avatarUrl: true } },
      },
    })

    await logActivity({
      projectId,
      userId: session.user.id,
      action: "SURVEY_UPDATED",
      details: `Updated survey "${survey.title}"`,
      metadata: { surveyId: survey.id },
    })

    return NextResponse.json(survey)
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

    const { projectId, surveyId } = await params

    if (session.user.role !== "DIRECTOR") {
      const membership = await db.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: session.user.id } },
      })
      if (!membership || membership.role !== "LEAD") {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
      }
    }

    const existing = await db.survey.findUnique({
      where: { id: surveyId, projectId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 })
    }

    await db.survey.delete({ where: { id: surveyId } })

    await logActivity({
      projectId,
      userId: session.user.id,
      action: "SURVEY_DELETED",
      details: `Deleted survey "${existing.title}"`,
      metadata: { surveyId },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
