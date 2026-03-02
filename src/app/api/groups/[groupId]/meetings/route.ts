import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireGroupAccess } from "@/lib/auth-utils"
import { submitGroupMeetingNoteSchema } from "@/lib/validations/group"
import { processGroupMeetingNote } from "@/lib/meeting-processor"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params
    const user = await requireGroupAccess(groupId)

    const body = await req.json()
    const parsed = submitGroupMeetingNoteSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      )
    }

    // Verify group exists and has projects
    const group = await db.projectGroup.findUnique({
      where: { id: groupId },
      include: { _count: { select: { projects: true } } },
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    if (group._count.projects === 0) {
      return NextResponse.json(
        { error: "Group has no linked projects. Add projects before submitting meeting notes." },
        { status: 400 }
      )
    }

    const meetingNote = await db.meetingNote.create({
      data: {
        groupId,
        submittedById: user.id,
        title: parsed.data.title,
        meetingDate: new Date(parsed.data.meetingDate),
        attendees: parsed.data.attendees || null,
        duration: parsed.data.duration || null,
        rawTranscript: parsed.data.transcript,
      },
    })

    // Process with LLM (group-level)
    try {
      await processGroupMeetingNote(meetingNote.id)
    } catch {
      // Processing error is saved on the meeting note
    }

    const result = await db.meetingNote.findUnique({
      where: { id: meetingNote.id },
      include: {
        submittedBy: { select: { id: true, name: true, avatarUrl: true } },
        actions: { orderBy: { createdAt: "asc" } },
      },
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to submit meeting notes"
    if (msg === "Not a member of this group") {
      return NextResponse.json({ error: msg }, { status: 403 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params
    await requireGroupAccess(groupId)

    const url = new URL(req.url)
    const status = url.searchParams.get("status")
    const cursor = url.searchParams.get("cursor")
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "20"),
      50
    )

    const where: Record<string, unknown> = { groupId }
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
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch meeting notes"
    if (msg === "Not a member of this group") {
      return NextResponse.json({ error: msg }, { status: 403 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
