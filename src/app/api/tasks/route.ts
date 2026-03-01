import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { createTaskSchema } from "@/lib/validations/task"
import { logActivity } from "@/lib/activity-logger"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = createTaskSchema.parse(body)

    // Get the phase and project to verify access
    const phase = await db.projectPhase.findUnique({
      where: { id: data.projectPhaseId },
      include: { project: { select: { id: true } } },
    })

    if (!phase) {
      return NextResponse.json({ error: "Phase not found" }, { status: 404 })
    }

    // Get max orderIndex for this phase
    const lastTask = await db.task.findFirst({
      where: { projectPhaseId: data.projectPhaseId },
      orderBy: { orderIndex: "desc" },
      select: { orderIndex: true },
    })

    const task = await db.task.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        projectPhaseId: data.projectPhaseId,
        assigneeId: data.assigneeId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        orderIndex: (lastTask?.orderIndex ?? -1) + 1,
      },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
      },
    })

    await logActivity({
      projectId: phase.project.id,
      userId: session.user.id,
      action: "TASK_CREATED",
      details: `Created task "${task.title}" in ${phase.name}`,
      metadata: { taskId: task.id, phaseId: phase.id },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Failed to create task:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
