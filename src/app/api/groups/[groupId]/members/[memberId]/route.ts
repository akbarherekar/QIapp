import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireGroupAccess } from "@/lib/auth-utils"
import { updateGroupMemberSchema } from "@/lib/validations/group"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ groupId: string; memberId: string }> }
) {
  try {
    const { groupId, memberId } = await params
    await requireGroupAccess(groupId, "CHAIR")

    const body = await req.json()
    const data = updateGroupMemberSchema.parse(body)

    const member = await db.groupMember.update({
      where: { id: memberId, groupId },
      data: { role: data.role },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    })

    return NextResponse.json(member)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    const msg = error instanceof Error ? error.message : "Failed to update member"
    if (msg.includes("permissions") || msg.includes("member")) {
      return NextResponse.json({ error: msg }, { status: 403 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ groupId: string; memberId: string }> }
) {
  try {
    const { groupId, memberId } = await params
    await requireGroupAccess(groupId, "CHAIR")

    await db.groupMember.delete({
      where: { id: memberId, groupId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to remove member"
    if (msg.includes("permissions") || msg.includes("member")) {
      return NextResponse.json({ error: msg }, { status: 403 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
