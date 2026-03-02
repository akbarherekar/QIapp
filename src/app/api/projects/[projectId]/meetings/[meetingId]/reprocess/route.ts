import { NextResponse } from "next/server"
import { Prisma } from "@/generated/prisma/client"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { processMeetingNote } from "@/lib/meeting-processor"

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
          { error: "Only project LEADs can reprocess meeting notes" },
          { status: 403 }
        )
      }
    }

    // Delete existing actions
    await db.meetingAction.deleteMany({
      where: { meetingNoteId: meetingId },
    })

    // Reset meeting note status
    await db.meetingNote.update({
      where: { id: meetingId, projectId },
      data: {
        status: "RECEIVED",
        processedSummary: null,
        keyDecisions: Prisma.DbNull,
        llmResponse: Prisma.DbNull,
        errorMessage: null,
        processedAt: null,
      },
    })

    // Reprocess
    try {
      await processMeetingNote(meetingId)
    } catch {
      // Error is saved on the meeting note
    }

    // Return updated meeting note
    const meetingNote = await db.meetingNote.findUnique({
      where: { id: meetingId, projectId },
      include: {
        submittedBy: { select: { id: true, name: true, avatarUrl: true } },
        actions: { orderBy: { createdAt: "asc" } },
      },
    })

    return NextResponse.json(meetingNote)
  } catch {
    return NextResponse.json(
      { error: "Failed to reprocess meeting notes" },
      { status: 500 }
    )
  }
}
