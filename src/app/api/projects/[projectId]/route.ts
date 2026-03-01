import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { updateProjectSchema } from "@/lib/validations/project"
import { logActivity } from "@/lib/activity-logger"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = await params

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true, role: true },
          },
        },
      },
      phases: {
        orderBy: { orderIndex: "asc" },
        include: {
          tasks: {
            orderBy: { orderIndex: "asc" },
            include: {
              assignee: {
                select: { id: true, name: true, avatarUrl: true },
              },
            },
          },
        },
      },
      activityLogs: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      },
    },
  })

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  // Check access
  if (session.user.role !== "DIRECTOR") {
    const isMember = project.members.some((m) => m.userId === session.user.id)
    if (!isMember && project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
  }

  return NextResponse.json(project)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = await params

  // Check permissions - must be DIRECTOR or project LEAD
  if (session.user.role !== "DIRECTOR") {
    const membership = await db.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: session.user.id } },
    })
    if (!membership || membership.role !== "LEAD") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }
  }

  try {
    const body = await req.json()
    const data = updateProjectSchema.parse(body)

    const project = await db.project.update({
      where: { id: projectId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.department !== undefined && { department: data.department }),
        ...(data.unit !== undefined && { unit: data.unit }),
        ...(data.targetMetric !== undefined && { targetMetric: data.targetMetric }),
        ...(data.baselineValue !== undefined && { baselineValue: data.baselineValue }),
        ...(data.goalValue !== undefined && { goalValue: data.goalValue }),
        ...(data.startDate !== undefined && {
          startDate: data.startDate ? new Date(data.startDate) : null,
        }),
        ...(data.targetEndDate !== undefined && {
          targetEndDate: data.targetEndDate ? new Date(data.targetEndDate) : null,
        }),
      },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        phases: { orderBy: { orderIndex: "asc" } },
      },
    })

    await logActivity({
      projectId,
      userId: session.user.id,
      action: "PROJECT_UPDATED",
      details: `Updated project "${project.title}"`,
      metadata: { changes: Object.keys(data) },
    })

    return NextResponse.json(project)
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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "DIRECTOR") {
    return NextResponse.json({ error: "Only directors can delete projects" }, { status: 403 })
  }

  const { projectId } = await params

  await db.project.delete({ where: { id: projectId } })

  return NextResponse.json({ success: true })
}
