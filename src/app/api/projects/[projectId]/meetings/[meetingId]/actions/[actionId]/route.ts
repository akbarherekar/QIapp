import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { reviewMeetingActionSchema } from "@/lib/validations/meeting"
import { applyMeetingAction, rejectMeetingAction } from "@/lib/meeting-actions"

export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: Promise<{
      projectId: string
      meetingId: string
      actionId: string
    }>
  }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, actionId } = await params
    const body = await req.json()
    const parsed = reviewMeetingActionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      )
    }

    // Check LEAD or DIRECTOR
    if (session.user.role !== "DIRECTOR") {
      const membership = await db.projectMember.findUnique({
        where: {
          projectId_userId: { projectId, userId: session.user.id },
        },
      })
      if (!membership || membership.role !== "LEAD") {
        return NextResponse.json(
          { error: "Only project LEADs can review meeting actions" },
          { status: 403 }
        )
      }
    }

    if (parsed.data.approved) {
      await applyMeetingAction(actionId, session.user.id)
    } else {
      await rejectMeetingAction(actionId)
    }

    // Return updated action
    const action = await db.meetingAction.findUnique({
      where: { id: actionId },
    })

    return NextResponse.json(action)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to review action"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
