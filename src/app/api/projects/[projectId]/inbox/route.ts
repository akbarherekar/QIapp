import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { submitInboxMessageSchema } from "@/lib/validations/inbox"
import { processInboxMessage } from "@/lib/inbox-processor"

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
    const parsed = submitInboxMessageSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      )
    }

    // Verify project exists and user has access
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { id: true, inboxEnabled: true },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (!project.inboxEnabled) {
      return NextResponse.json(
        { error: "Inbox is disabled for this project" },
        { status: 403 }
      )
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

    // Create inbox message
    const message = await db.inboxMessage.create({
      data: {
        projectId,
        senderId: session.user.id,
        channel: "MANUAL",
        senderIdentifier: session.user.email,
        subject: parsed.data.subject || null,
        rawBody: parsed.data.body,
      },
    })

    // Process with LLM
    try {
      await processInboxMessage(message.id)
    } catch {
      // Processing error is saved on the message — don't fail the HTTP request
    }

    // Return the message with actions
    const result = await db.inboxMessage.findUnique({
      where: { id: message.id },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
        actions: { orderBy: { createdAt: "asc" } },
      },
    })

    return NextResponse.json(result, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: "Failed to submit inbox message" },
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

    const messages = await db.inboxMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
        actions: { orderBy: { createdAt: "asc" } },
      },
    })

    const hasMore = messages.length > limit
    const items = hasMore ? messages.slice(0, limit) : messages
    const nextCursor = hasMore ? items[items.length - 1].id : null

    return NextResponse.json({ items, nextCursor })
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch inbox messages" },
      { status: 500 }
    )
  }
}
