import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { applyAllPendingActions } from "@/lib/inbox-actions"

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
          { error: "Only project LEADs can approve inbox actions" },
          { status: 403 }
        )
      }
    }

    await applyAllPendingActions(messageId, session.user.id)

    // Return updated message with actions
    const message = await db.inboxMessage.findUnique({
      where: { id: messageId, projectId },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
        actions: { orderBy: { createdAt: "asc" } },
      },
    })

    return NextResponse.json(message)
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Failed to apply actions"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
