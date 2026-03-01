import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { logActivity } from "@/lib/activity-logger"

const addMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["LEAD", "MEMBER", "STAKEHOLDER"]).default("MEMBER"),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = await params

  try {
    const body = await req.json()
    const data = addMemberSchema.parse(body)

    const member = await db.projectMember.create({
      data: {
        projectId,
        userId: data.userId,
        role: data.role,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    })

    await logActivity({
      projectId,
      userId: session.user.id,
      action: "MEMBER_ADDED",
      details: `Added ${member.user.name} as ${data.role}`,
      metadata: { memberId: member.id, memberUserId: data.userId },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
