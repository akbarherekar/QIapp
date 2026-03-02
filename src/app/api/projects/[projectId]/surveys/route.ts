import { NextResponse } from "next/server"
import { Prisma } from "@/generated/prisma/client"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { createSurveySchema } from "@/lib/validations/survey"
import { logActivity } from "@/lib/activity-logger"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId } = await params

    if (session.user.role !== "DIRECTOR") {
      const membership = await db.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: session.user.id } },
      })
      if (!membership) {
        return NextResponse.json({ error: "Not a project member" }, { status: 403 })
      }
    }

    const surveys = await db.survey.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: {
        questions: { orderBy: { orderIndex: "asc" } },
        _count: { select: { responses: true } },
        createdBy: { select: { id: true, name: true, avatarUrl: true } },
      },
    })

    return NextResponse.json(surveys)
  } catch {
    return NextResponse.json({ error: "Failed to fetch surveys" }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId } = await params

    if (session.user.role !== "DIRECTOR") {
      const membership = await db.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: session.user.id } },
      })
      if (!membership || membership.role !== "LEAD") {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
      }
    }

    const body = await req.json()
    const parsed = createSurveySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const data = parsed.data

    const survey = await db.survey.create({
      data: {
        projectId,
        title: data.title,
        description: data.description ?? null,
        createdById: session.user.id,
        questions: data.questions
          ? {
              create: data.questions.map((q, i) => ({
                text: q.text,
                type: q.type,
                required: q.required,
                options: q.options ?? Prisma.JsonNull,
                orderIndex: i,
              })),
            }
          : undefined,
      },
      include: {
        questions: { orderBy: { orderIndex: "asc" } },
        _count: { select: { responses: true } },
        createdBy: { select: { id: true, name: true, avatarUrl: true } },
      },
    })

    await logActivity({
      projectId,
      userId: session.user.id,
      action: "SURVEY_CREATED",
      details: `Created survey "${survey.title}"`,
      metadata: { surveyId: survey.id },
    })

    return NextResponse.json(survey, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
