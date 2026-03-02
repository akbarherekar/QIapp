import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string; meetingId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, meetingId } = await params

    const meetingNote = await db.meetingNote.findUnique({
      where: { id: meetingId, projectId },
      include: {
        submittedBy: { select: { id: true, name: true, avatarUrl: true } },
        actions: { orderBy: { createdAt: "asc" } },
      },
    })

    if (!meetingNote) {
      return NextResponse.json({ error: "Meeting note not found" }, { status: 404 })
    }

    return NextResponse.json(meetingNote)
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch meeting note" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ projectId: string; meetingId: string }> }
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
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
      }
    }

    await db.meetingNote.delete({
      where: { id: meetingId, projectId },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Failed to delete meeting note" },
      { status: 500 }
    )
  }
}
