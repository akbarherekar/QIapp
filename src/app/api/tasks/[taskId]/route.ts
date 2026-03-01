import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { updateTaskSchema } from "@/lib/validations/task"
import { logActivity } from "@/lib/activity-logger"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { taskId } = await params

  try {
    const body = await req.json()
    const data = updateTaskSchema.parse(body)

    const existingTask = await db.task.findUnique({
      where: { id: taskId },
      include: {
        phase: {
          include: { project: { select: { id: true } } },
        },
      },
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const projectId = existingTask.phase.project.id

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.status !== undefined) {
      updateData.status = data.status
      if (data.status === "DONE" && existingTask.status !== "DONE") {
        updateData.completedAt = new Date()
      } else if (data.status !== "DONE") {
        updateData.completedAt = null
      }
    }
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
    }
    if (data.projectPhaseId !== undefined) updateData.projectPhaseId = data.projectPhaseId
    if (data.orderIndex !== undefined) updateData.orderIndex = data.orderIndex

    const task = await db.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        phase: { select: { id: true, name: true } },
      },
    })

    // Log different actions based on what changed
    if (data.status && data.status !== existingTask.status) {
      await logActivity({
        projectId,
        userId: session.user.id,
        action: data.status === "DONE" ? "TASK_COMPLETED" : "TASK_STATUS_CHANGED",
        details: `Changed task "${task.title}" status to ${data.status}`,
        metadata: {
          taskId: task.id,
          from: existingTask.status,
          to: data.status,
        },
      })
    } else if (data.projectPhaseId && data.projectPhaseId !== existingTask.projectPhaseId) {
      const newPhase = await db.projectPhase.findUnique({
        where: { id: data.projectPhaseId },
        select: { name: true },
      })
      await logActivity({
        projectId,
        userId: session.user.id,
        action: "TASK_MOVED",
        details: `Moved task "${task.title}" from ${existingTask.phase.name} to ${newPhase?.name}`,
        metadata: {
          taskId: task.id,
          fromPhase: existingTask.projectPhaseId,
          toPhase: data.projectPhaseId,
        },
      })
    } else if (Object.keys(data).length > 0) {
      await logActivity({
        projectId,
        userId: session.user.id,
        action: "TASK_UPDATED",
        details: `Updated task "${task.title}"`,
        metadata: { taskId: task.id, changes: Object.keys(data) },
      })
    }

    return NextResponse.json(task)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Failed to update task:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { taskId } = await params

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      phase: { include: { project: { select: { id: true } } } },
    },
  })

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 })
  }

  await db.task.delete({ where: { id: taskId } })

  await logActivity({
    projectId: task.phase.project.id,
    userId: session.user.id,
    action: "TASK_DELETED",
    details: `Deleted task "${task.title}" from ${task.phase.name}`,
    metadata: { taskId },
  })

  return NextResponse.json({ success: true })
}
