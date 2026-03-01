import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string; messageId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, messageId } = await params

    const message = await db.inboxMessage.findUnique({
      where: { id: messageId, projectId },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
        actions: { orderBy: { createdAt: "asc" } },
      },
    })

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    return NextResponse.json(message)
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch message" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ projectId: string; messageId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, messageId } = await params

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

    await db.inboxMessage.delete({
      where: { id: messageId, projectId },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    )
  }
}
