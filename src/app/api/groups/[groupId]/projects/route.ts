import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireGroupAccess } from "@/lib/auth-utils"
import { addGroupProjectSchema } from "@/lib/validations/group"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params
    await requireGroupAccess(groupId)

    const links = await db.projectGroupLink.findMany({
      where: { groupId },
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
      orderBy: { addedAt: "desc" },
    })

    return NextResponse.json(links.map((l) => l.project))
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch projects"
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
    const data = addGroupProjectSchema.parse(body)

    // Verify project exists
    const project = await db.project.findUnique({
      where: { id: data.projectId },
      select: { id: true, title: true },
    })
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Check if already linked
    const existing = await db.projectGroupLink.findUnique({
      where: { groupId_projectId: { groupId, projectId: data.projectId } },
    })
    if (existing) {
      return NextResponse.json({ error: "Project is already in this group" }, { status: 409 })
    }

    await db.projectGroupLink.create({
      data: { groupId, projectId: data.projectId },
    })

    return NextResponse.json({ success: true, projectId: data.projectId }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    const msg = error instanceof Error ? error.message : "Failed to link project"
    if (msg.includes("permissions") || msg.includes("member")) {
      return NextResponse.json({ error: msg }, { status: 403 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
