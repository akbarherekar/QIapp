import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireGroupAccess } from "@/lib/auth-utils"
import { reviewMeetingActionSchema } from "@/lib/validations/meeting"
import { applyMeetingAction, rejectMeetingAction } from "@/lib/meeting-actions"

export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: Promise<{
      groupId: string
      meetingId: string
      actionId: string
    }>
  }
) {
  try {
    const { groupId, actionId } = await params
    const user = await requireGroupAccess(groupId, "SECRETARY")

    const body = await req.json()
    const parsed = reviewMeetingActionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      )
    }

    if (parsed.data.approved) {
      await applyMeetingAction(actionId, user.id)
    } else {
      await rejectMeetingAction(actionId)
    }

    const action = await db.meetingAction.findUnique({
      where: { id: actionId },
    })

    return NextResponse.json(action)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to review action"
    if (msg.includes("permissions") || msg.includes("member")) {
      return NextResponse.json({ error: msg }, { status: 403 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
