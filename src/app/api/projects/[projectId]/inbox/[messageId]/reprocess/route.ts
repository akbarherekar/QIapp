import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { processInboxMessage } from "@/lib/inbox-processor"

export async function POST(
  _req: Request,
  {
    params,
  }: {
    params: Promise<{ projectId: string; messageId: string }>
  }
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
        return NextResponse.json(
          { error: "Only project LEADs can reprocess messages" },
          { status: 403 }
        )
      }
    }

    // Delete existing actions
    await db.inboxAction.deleteMany({
      where: { inboxMessageId: messageId },
    })

    // Reset message status
    await db.inboxMessage.update({
      where: { id: messageId, projectId },
      data: {
        status: "RECEIVED",
        processedSummary: null,
        classification: null,
        llmResponse: null,
        errorMessage: null,
        processedAt: null,
      },
    })

    // Reprocess
    try {
      await processInboxMessage(messageId)
    } catch {
      // Error is saved on the message
    }

    // Return updated message
    const message = await db.inboxMessage.findUnique({
      where: { id: messageId, projectId },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
        actions: { orderBy: { createdAt: "asc" } },
      },
    })

    return NextResponse.json(message)
  } catch {
    return NextResponse.json(
      { error: "Failed to reprocess message" },
      { status: 500 }
    )
  }
}
