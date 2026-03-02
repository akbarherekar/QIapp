import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireGroupAccess } from "@/lib/auth-utils"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ groupId: string; projectId: string }> }
) {
  try {
    const { groupId, projectId } = await params
    await requireGroupAccess(groupId, "CHAIR")

    await db.projectGroupLink.delete({
      where: { groupId_projectId: { groupId, projectId } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to unlink project"
    if (msg.includes("permissions") || msg.includes("member")) {
      return NextResponse.json({ error: msg }, { status: 403 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
