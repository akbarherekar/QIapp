import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireGroupAccess } from "@/lib/auth-utils"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ groupId: string; meetingId: string }> }
) {
  try {
    const { groupId, meetingId } = await params
    await requireGroupAccess(groupId)

    const meetingNote = await db.meetingNote.findUnique({
      where: { id: meetingId, groupId },
      include: {
        submittedBy: { select: { id: true, name: true, avatarUrl: true } },
        actions: { orderBy: { createdAt: "asc" } },
      },
    })

    if (!meetingNote) {
      return NextResponse.json({ error: "Meeting note not found" }, { status: 404 })
    }

    return NextResponse.json(meetingNote)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch meeting note"
    if (msg === "Not a member of this group") {
      return NextResponse.json({ error: msg }, { status: 403 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ groupId: string; meetingId: string }> }
) {
  try {
    const { groupId, meetingId } = await params
    await requireGroupAccess(groupId, "CHAIR")

    await db.meetingNote.delete({
      where: { id: meetingId, groupId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to delete meeting note"
    if (msg.includes("permissions") || msg.includes("member")) {
      return NextResponse.json({ error: msg }, { status: 403 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
