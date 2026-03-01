import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { METHODOLOGY_PHASES } from "@/lib/constants"
import { hasMinSystemRole } from "@/lib/auth-utils"
import { createProjectSchema } from "@/lib/validations/project"
import { logActivity } from "@/lib/activity-logger"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: userId, role } = session.user
  const isDirector = role === "DIRECTOR"

  const projects = await db.project.findMany({
    where: isDirector
      ? {}
      : {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
        },
    include: {
      owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      },
      phases: {
        orderBy: { orderIndex: "asc" },
        include: {
          _count: { select: { tasks: true } },
          tasks: { select: { status: true } },
        },
      },
      _count: { select: { activityLogs: true } },
    },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json(projects)
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
    const data = createProjectSchema.parse(body)

    const phases = METHODOLOGY_PHASES[data.methodology] || METHODOLOGY_PHASES.OTHER

    const project = await db.project.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        methodology: data.methodology,
        department: data.department,
        unit: data.unit,
        targetMetric: data.targetMetric,
        baselineValue: data.baselineValue,
        goalValue: data.goalValue,
        startDate: data.startDate ? new Date(data.startDate) : null,
        targetEndDate: data.targetEndDate ? new Date(data.targetEndDate) : null,
        ownerId: session.user.id,
        phases: {
          create: phases.map((name, index) => ({
            name,
            orderIndex: index,
          })),
        },
        members: {
          create: {
            userId: session.user.id,
            role: "LEAD",
          },
        },
      },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        phases: {
          orderBy: { orderIndex: "asc" },
          include: { _count: { select: { tasks: true } } },
        },
      },
    })

    await logActivity({
      projectId: project.id,
      userId: session.user.id,
      action: "PROJECT_CREATED",
      details: `Created project "${project.title}" using ${data.methodology} methodology`,
      source: "SYSTEM",
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Failed to create project:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
