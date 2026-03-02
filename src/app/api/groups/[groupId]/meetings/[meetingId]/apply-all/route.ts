import { NextResponse } from "next/server"
import { requireGroupAccess } from "@/lib/auth-utils"
import { applyAllPendingMeetingActions } from "@/lib/meeting-actions"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ groupId: string; meetingId: string }> }
) {
  try {
    const { groupId, meetingId } = await params
    const user = await requireGroupAccess(groupId, "SECRETARY")

    await applyAllPendingMeetingActions(meetingId, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to apply actions"
    if (msg.includes("permissions") || msg.includes("member")) {
      return NextResponse.json({ error: msg }, { status: 403 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
