import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireGroupAccess } from "@/lib/auth-utils"
import { auth } from "@/lib/auth"
import { updateGroupSchema } from "@/lib/validations/group"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params
    await requireGroupAccess(groupId)

    const group = await db.projectGroup.findUnique({
      where: { id: groupId },
      include: {
        createdBy: { select: { id: true, name: true, avatarUrl: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
          },
          orderBy: { joinedAt: "asc" },
        },
        projects: {
          include: {
            project: {
              include: {
                owner: { select: { id: true, name: true, avatarUrl: true } },
                members: {
                  include: {
                    user: { select: { id: true, name: true, avatarUrl: true } },
                  },
                },
                phases: {
                  orderBy: { orderIndex: "asc" },
                  include: { tasks: { select: { status: true } } },
                },
              },
            },
          },
        },
        _count: { select: { meetingNotes: true } },
      },
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    return NextResponse.json(group)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch group"
    if (msg === "Not a member of this group") {
      return NextResponse.json({ error: msg }, { status: 403 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params
    await requireGroupAccess(groupId, "CHAIR")

    const body = await req.json()
    const data = updateGroupSchema.parse(body)

    const group = await db.projectGroup.update({
      where: { id: groupId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.department !== undefined && { department: data.department || null }),
        ...(data.status !== undefined && { status: data.status }),
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

    return NextResponse.json(group)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    const msg = error instanceof Error ? error.message : "Failed to update group"
    if (msg.includes("permissions") || msg.includes("member")) {
      return NextResponse.json({ error: msg }, { status: 403 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "DIRECTOR") {
      return NextResponse.json({ error: "Only directors can delete groups" }, { status: 403 })
    }

    const { groupId } = await params
    await db.projectGroup.delete({ where: { id: groupId } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete group" }, { status: 500 })
  }
}
