import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { Prisma } from "@/generated/prisma/client"
import { requireGroupAccess } from "@/lib/auth-utils"
import { processGroupMeetingNote } from "@/lib/meeting-processor"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ groupId: string; meetingId: string }> }
) {
  try {
    const { groupId, meetingId } = await params
    await requireGroupAccess(groupId, "CHAIR")

    // Delete existing actions and reset status
    await db.meetingAction.deleteMany({ where: { meetingNoteId: meetingId } })
    await db.meetingNote.update({
      where: { id: meetingId, groupId },
      data: {
        status: "RECEIVED",
        processedSummary: null,
        keyDecisions: Prisma.DbNull,
        llmResponse: Prisma.DbNull,
        errorMessage: null,
        processedAt: null,
      },
    })

    try {
      await processGroupMeetingNote(meetingId)
    } catch {
      // Processing error is saved on the meeting note
    }

    const result = await db.meetingNote.findUnique({
      where: { id: meetingId },
      include: {
        submittedBy: { select: { id: true, name: true, avatarUrl: true } },
        actions: { orderBy: { createdAt: "asc" } },
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to reprocess"
    if (msg.includes("permissions") || msg.includes("member")) {
      return NextResponse.json({ error: msg }, { status: 403 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
