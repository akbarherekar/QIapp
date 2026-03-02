import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { applyAllPendingMeetingActions } from "@/lib/meeting-actions"

export async function POST(
  _req: Request,
  {
    params,
  }: {
    params: Promise<{ projectId: string; meetingId: string }>
  }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, meetingId } = await params

    // Check LEAD or DIRECTOR
    if (session.user.role !== "DIRECTOR") {
      const membership = await db.projectMember.findUnique({
        where: {
          projectId_userId: { projectId, userId: session.user.id },
        },
      })
      if (!membership || membership.role !== "LEAD") {
        return NextResponse.json(
          { error: "Only project LEADs can approve meeting actions" },
          { status: 403 }
        )
      }
    }

    await applyAllPendingMeetingActions(meetingId, session.user.id)

    // Return updated meeting note with actions
    const meetingNote = await db.meetingNote.findUnique({
      where: { id: meetingId, projectId },
      include: {
        submittedBy: { select: { id: true, name: true, avatarUrl: true } },
        actions: { orderBy: { createdAt: "asc" } },
      },
    })

    return NextResponse.json(meetingNote)
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Failed to apply actions"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
