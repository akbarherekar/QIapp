import { db } from "@/lib/db"
import { logActivity } from "@/lib/activity-logger"

interface ExtractedData {
  title?: string
  taskDescription?: string
  priority?: "HIGH" | "MEDIUM" | "LOW"
  phaseName?: string
  assigneeName?: string
  dueDate?: string
  targetTaskTitle?: string
  status?: "TODO" | "IN_PROGRESS" | "DONE"
  note?: string
  targetPhaseName?: string
  newPhaseStatus?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"
}

async function resolvePhase(projectId: string, phaseName: string) {
  const phases = await db.projectPhase.findMany({
    where: { projectId },
    orderBy: { orderIndex: "asc" },
  })

  // Exact match first
  const exact = phases.find(
    (p) => p.name.toLowerCase() === phaseName.toLowerCase()
  )
  if (exact) return exact

  // Partial match
  const partial = phases.find(
    (p) =>
      p.name.toLowerCase().includes(phaseName.toLowerCase()) ||
      phaseName.toLowerCase().includes(p.name.toLowerCase())
  )
  if (partial) return partial

  // Default to first phase
  return phases[0] || null
}

async function resolveAssignee(projectId: string, assigneeName: string) {
  const members = await db.projectMember.findMany({
    where: { projectId },
    include: { user: { select: { id: true, name: true } } },
  })

  const nameLower = assigneeName.toLowerCase()

  // Exact match
  const exact = members.find(
    (m) => m.user.name.toLowerCase() === nameLower
  )
  if (exact) return exact.user

  // Partial match (first/last name)
  const partial = members.find((m) => {
    const parts = m.user.name.toLowerCase().split(" ")
    return parts.some((part) => nameLower.includes(part) || part.includes(nameLower))
  })
  if (partial) return partial.user

  return null
}

async function resolveTask(projectId: string, taskTitle: string) {
  const tasks = await db.task.findMany({
    where: {
      phase: { projectId },
    },
    include: { phase: true },
  })

  const titleLower = taskTitle.toLowerCase()

  // Exact match
  const exact = tasks.find((t) => t.title.toLowerCase() === titleLower)
  if (exact) return exact

  // Partial match
  const partial = tasks.find(
    (t) =>
      t.title.toLowerCase().includes(titleLower) ||
      titleLower.includes(t.title.toLowerCase())
  )
  return partial || null
}

export async function applyInboxAction(
  actionId: string,
  userId: string
): Promise<void> {
  const action = await db.inboxAction.findUniqueOrThrow({
    where: { id: actionId },
    include: {
      inboxMessage: {
        include: { project: true },
      },
    },
  })

  if (action.status !== "PENDING") {
    throw new Error(`Action is already ${action.status}`)
  }

  const data = action.extractedData as ExtractedData
  const projectId = action.inboxMessage.projectId

  try {
    switch (action.actionType) {
      case "CREATE_TASK": {
        const phase = data.phaseName
          ? await resolvePhase(projectId, data.phaseName)
          : await db.projectPhase.findFirst({
              where: { projectId },
              orderBy: { orderIndex: "asc" },
            })

        if (!phase) throw new Error("No phase found for task creation")

        const assignee = data.assigneeName
          ? await resolveAssignee(projectId, data.assigneeName)
          : null

        const maxOrder = await db.task.aggregate({
          where: { projectPhaseId: phase.id },
          _max: { orderIndex: true },
        })

        const task = await db.task.create({
          data: {
            title: data.title || "Untitled task",
            description: data.taskDescription || null,
            priority: data.priority || "MEDIUM",
            projectPhaseId: phase.id,
            assigneeId: assignee?.id || null,
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
            orderIndex: (maxOrder._max.orderIndex ?? -1) + 1,
          },
        })

        await db.inboxAction.update({
          where: { id: actionId },
          data: {
            status: "APPROVED",
            createdTaskId: task.id,
            appliedData: {
              taskId: task.id,
              title: task.title,
              phaseId: phase.id,
              phaseName: phase.name,
              assigneeId: assignee?.id,
            } as object,
            appliedAt: new Date(),
          },
        })

        await logActivity({
          projectId,
          userId,
          action: "TASK_CREATED",
          details: `Created task "${task.title}" in ${phase.name} (via AI Inbox)`,
          source: "AI_INBOX",
          metadata: { inboxActionId: actionId, taskId: task.id },
        })
        break
      }

      case "UPDATE_TASK": {
        if (!data.targetTaskTitle) throw new Error("No target task specified")

        const task = await resolveTask(projectId, data.targetTaskTitle)
        if (!task) throw new Error(`Task not found: "${data.targetTaskTitle}"`)

        const updateData: Record<string, unknown> = {}
        if (data.status) {
          updateData.status = data.status
          if (data.status === "DONE") updateData.completedAt = new Date()
          else updateData.completedAt = null
        }
        if (data.priority) updateData.priority = data.priority

        const assignee = data.assigneeName
          ? await resolveAssignee(projectId, data.assigneeName)
          : undefined
        if (assignee) updateData.assigneeId = assignee.id

        await db.task.update({
          where: { id: task.id },
          data: updateData,
        })

        await db.inboxAction.update({
          where: { id: actionId },
          data: {
            status: "APPROVED",
            targetTaskId: task.id,
            appliedData: { taskId: task.id, updates: updateData } as object,
            appliedAt: new Date(),
          },
        })

        await logActivity({
          projectId,
          userId,
          action: "TASK_UPDATED",
          details: `Updated task "${task.title}" (via AI Inbox)`,
          source: "AI_INBOX",
          metadata: { inboxActionId: actionId, taskId: task.id },
        })
        break
      }

      case "COMPLETE_TASK": {
        if (!data.targetTaskTitle) throw new Error("No target task specified")

        const task = await resolveTask(projectId, data.targetTaskTitle)
        if (!task) throw new Error(`Task not found: "${data.targetTaskTitle}"`)

        await db.task.update({
          where: { id: task.id },
          data: { status: "DONE", completedAt: new Date() },
        })

        await db.inboxAction.update({
          where: { id: actionId },
          data: {
            status: "APPROVED",
            targetTaskId: task.id,
            appliedData: { taskId: task.id, title: task.title } as object,
            appliedAt: new Date(),
          },
        })

        await logActivity({
          projectId,
          userId,
          action: "TASK_COMPLETED",
          details: `Completed task "${task.title}" (via AI Inbox)`,
          source: "AI_INBOX",
          metadata: { inboxActionId: actionId, taskId: task.id },
        })
        break
      }

      case "ADD_NOTE": {
        await db.inboxAction.update({
          where: { id: actionId },
          data: {
            status: "APPROVED",
            appliedData: { note: data.note } as object,
            appliedAt: new Date(),
          },
        })

        await logActivity({
          projectId,
          userId,
          action: "NOTE_ADDED",
          details: data.note || action.description,
          source: "AI_INBOX",
          metadata: { inboxActionId: actionId },
        })
        break
      }

      case "STATUS_UPDATE": {
        if (!data.targetPhaseName || !data.newPhaseStatus) {
          throw new Error("Missing phase name or status for STATUS_UPDATE")
        }

        const phase = await resolvePhase(projectId, data.targetPhaseName)
        if (!phase) throw new Error(`Phase not found: "${data.targetPhaseName}"`)

        const oldStatus = phase.status
        await db.projectPhase.update({
          where: { id: phase.id },
          data: { status: data.newPhaseStatus },
        })

        await db.inboxAction.update({
          where: { id: actionId },
          data: {
            status: "APPROVED",
            appliedData: {
              phaseId: phase.id,
              phaseName: phase.name,
              oldStatus,
              newStatus: data.newPhaseStatus,
            } as object,
            appliedAt: new Date(),
          },
        })

        await logActivity({
          projectId,
          userId,
          action: "PHASE_STATUS_CHANGED",
          details: `Changed "${phase.name}" from ${oldStatus} to ${data.newPhaseStatus} (via AI Inbox)`,
          source: "AI_INBOX",
          metadata: { inboxActionId: actionId, phaseId: phase.id },
        })
        break
      }
    }
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Failed to apply action"

    await db.inboxAction.update({
      where: { id: actionId },
      data: { status: "FAILED" },
    })

    throw new Error(errorMsg)
  }
}

export async function rejectInboxAction(actionId: string): Promise<void> {
  await db.inboxAction.update({
    where: { id: actionId },
    data: { status: "REJECTED" },
  })
}

export async function applyAllPendingActions(
  messageId: string,
  userId: string
): Promise<void> {
  const actions = await db.inboxAction.findMany({
    where: { inboxMessageId: messageId, status: "PENDING" },
  })

  for (const action of actions) {
    try {
      await applyInboxAction(action.id, userId)
    } catch {
      // Continue applying other actions even if one fails
    }
  }

  // Check if all actions are now resolved
  const remaining = await db.inboxAction.count({
    where: { inboxMessageId: messageId, status: "PENDING" },
  })

  if (remaining === 0) {
    await db.inboxMessage.update({
      where: { id: messageId },
      data: { status: "APPLIED", reviewedAt: new Date() },
    })
  }
}

export async function rejectAllPendingActions(
  messageId: string
): Promise<void> {
  await db.inboxAction.updateMany({
    where: { inboxMessageId: messageId, status: "PENDING" },
    data: { status: "REJECTED" },
  })

  await db.inboxMessage.update({
    where: { id: messageId },
    data: { status: "REJECTED", reviewedAt: new Date() },
  })
}
