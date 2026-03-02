import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireGroupAccess } from "@/lib/auth-utils"
import { addGroupMemberSchema } from "@/lib/validations/group"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params
    await requireGroupAccess(groupId)

    const members = await db.groupMember.findMany({
      where: { groupId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
      },
      orderBy: { joinedAt: "asc" },
    })

    return NextResponse.json(members)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch members"
    if (msg === "Not a member of this group") {
      return NextResponse.json({ error: msg }, { status: 403 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params
    await requireGroupAccess(groupId, "SECRETARY")

    const body = await req.json()
    const data = addGroupMemberSchema.parse(body)

    const existing = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: data.userId } },
    })
    if (existing) {
      return NextResponse.json({ error: "User is already a member" }, { status: 409 })
    }

    const member = await db.groupMember.create({
      data: {
        groupId,
        userId: data.userId,
        role: data.role,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    const msg = error instanceof Error ? error.message : "Failed to add member"
    if (msg.includes("permissions") || msg.includes("member")) {
      return NextResponse.json({ error: msg }, { status: 403 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
