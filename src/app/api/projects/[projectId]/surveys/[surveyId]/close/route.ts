import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { logActivity } from "@/lib/activity-logger"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ projectId: string; surveyId: string }> }
) {
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

    if (survey.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Only PUBLISHED surveys can be closed" },
        { status: 400 }
      )
    }

    const updated = await db.survey.update({
      where: { id: surveyId },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
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
      action: "SURVEY_CLOSED",
      details: `Closed survey "${updated.title}"`,
      metadata: { surveyId },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
