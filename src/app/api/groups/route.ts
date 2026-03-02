import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { hasMinSystemRole } from "@/lib/auth-utils"
import { createGroupSchema } from "@/lib/validations/group"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: userId, role } = session.user
  const isDirector = role === "DIRECTOR"

  const groups = await db.projectGroup.findMany({
    where: isDirector
      ? {}
      : {
          members: { some: { userId } },
        },
    include: {
      createdBy: { select: { id: true, name: true, avatarUrl: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      },
      _count: { select: { projects: true, meetingNotes: true } },
    },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json(groups)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!hasMinSystemRole(session.user.role, "PROJECT_LEAD")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const data = createGroupSchema.parse(body)

    const group = await db.projectGroup.create({
      data: {
        name: data.name,
        description: data.description || null,
        department: data.department || null,
        createdById: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "CHAIR",
          },
        },
      },
      include: {
        createdBy: { select: { id: true, name: true, avatarUrl: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        _count: { select: { projects: true, meetingNotes: true } },
      },
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Failed to create group:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
