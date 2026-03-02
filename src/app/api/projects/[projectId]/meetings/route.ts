import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { submitMeetingNoteSchema } from "@/lib/validations/meeting"
import { processMeetingNote } from "@/lib/meeting-processor"
import { logActivity } from "@/lib/activity-logger"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId } = await params
    const body = await req.json()
    const parsed = submitMeetingNoteSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      )
    }

    // Verify project exists and user has access
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Check membership (unless DIRECTOR)
    if (session.user.role !== "DIRECTOR") {
      const membership = await db.projectMember.findUnique({
        where: {
          projectId_userId: { projectId, userId: session.user.id },
        },
      })
      if (!membership) {
        return NextResponse.json({ error: "Not a project member" }, { status: 403 })
      }
    }

    // Create meeting note
    const meetingNote = await db.meetingNote.create({
      data: {
        projectId,
        submittedById: session.user.id,
        title: parsed.data.title,
        meetingDate: new Date(parsed.data.meetingDate),
        attendees: parsed.data.attendees || null,
        duration: parsed.data.duration || null,
        rawTranscript: parsed.data.transcript,
      },
    })

    await logActivity({
      projectId,
      userId: session.user.id,
      action: "MEETING_PROCESSED",
      details: `Submitted meeting notes: "${parsed.data.title}"`,
      source: "AI_MEETING",
      metadata: { meetingNoteId: meetingNote.id },
    })

    // Process with LLM
    try {
      await processMeetingNote(meetingNote.id)
    } catch {
      // Processing error is saved on the meeting note — don't fail the HTTP request
    }

    // Return the meeting note with actions
    const result = await db.meetingNote.findUnique({
      where: { id: meetingNote.id },
      include: {
        submittedBy: { select: { id: true, name: true, avatarUrl: true } },
        actions: { orderBy: { createdAt: "asc" } },
      },
    })

    return NextResponse.json(result, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: "Failed to submit meeting notes" },
      { status: 500 }
    )
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId } = await params
    const url = new URL(req.url)
    const status = url.searchParams.get("status")
    const cursor = url.searchParams.get("cursor")
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "20"),
      50
    )

    // Check access
    if (session.user.role !== "DIRECTOR") {
      const membership = await db.projectMember.findUnique({
        where: {
          projectId_userId: { projectId, userId: session.user.id },
        },
      })
      if (!membership) {
        return NextResponse.json({ error: "Not a project member" }, { status: 403 })
      }
    }

    const where: Record<string, unknown> = { projectId }
    if (status) {
      where.status = status
    }

    const meetingNotes = await db.meetingNote.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        submittedBy: { select: { id: true, name: true, avatarUrl: true } },
        actions: { orderBy: { createdAt: "asc" } },
      },
    })

    const hasMore = meetingNotes.length > limit
    const items = hasMore ? meetingNotes.slice(0, limit) : meetingNotes
    const nextCursor = hasMore ? items[items.length - 1].id : null

    return NextResponse.json({ items, nextCursor })
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch meeting notes" },
      { status: 500 }
    )
  }
}
