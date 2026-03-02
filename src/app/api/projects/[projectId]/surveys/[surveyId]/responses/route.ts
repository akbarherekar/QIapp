import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(
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
      if (!membership) {
        return NextResponse.json({ error: "Not a project member" }, { status: 403 })
      }
    }

    const survey = await db.survey.findUnique({
      where: { id: surveyId, projectId },
      select: { id: true },
    })
    if (!survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 })
    }

    const responses = await db.surveyResponse.findMany({
      where: { surveyId },
      orderBy: { submittedAt: "desc" },
      include: {
        answers: {
          include: {
            question: {
              select: { id: true, text: true, type: true, options: true },
            },
          },
        },
      },
    })

    return NextResponse.json(responses)
  } catch {
    return NextResponse.json({ error: "Failed to fetch responses" }, { status: 500 })
  }
}
