import { db } from "@/lib/db"
import { logActivity } from "@/lib/activity-logger"
import {
  type ExtractedData,
  resolvePhase,
  resolveAssignee,
  resolveTask,
} from "@/lib/action-resolvers"

export async function applyMeetingAction(
  actionId: string,
  userId: string
): Promise<void> {
  const action = await db.meetingAction.findUniqueOrThrow({
    where: { id: actionId },
    include: {
      meetingNote: {
        include: { project: true },
      },
    },
  })

  if (action.status !== "PENDING") {
    throw new Error(`Action is already ${action.status}`)
  }

  const data = action.extractedData as ExtractedData
  const projectId = action.meetingNote.projectId

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

        await db.meetingAction.update({
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
          details: `Created task "${task.title}" in ${phase.name} (via AI Meeting Notes)`,
          source: "AI_MEETING",
          metadata: { meetingActionId: actionId, taskId: task.id },
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

        await db.meetingAction.update({
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
          details: `Updated task "${task.title}" (via AI Meeting Notes)`,
          source: "AI_MEETING",
          metadata: { meetingActionId: actionId, taskId: task.id },
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

        await db.meetingAction.update({
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
          details: `Completed task "${task.title}" (via AI Meeting Notes)`,
          source: "AI_MEETING",
          metadata: { meetingActionId: actionId, taskId: task.id },
        })
        break
      }

      case "ADD_NOTE": {
        await db.meetingAction.update({
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
          source: "AI_MEETING",
          metadata: { meetingActionId: actionId },
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

        await db.meetingAction.update({
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
          details: `Changed "${phase.name}" from ${oldStatus} to ${data.newPhaseStatus} (via AI Meeting Notes)`,
          source: "AI_MEETING",
          metadata: { meetingActionId: actionId, phaseId: phase.id },
        })
        break
      }
    }
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Failed to apply action"

    await db.meetingAction.update({
      where: { id: actionId },
      data: { status: "FAILED" },
    })

    throw new Error(errorMsg)
  }
}

export async function rejectMeetingAction(actionId: string): Promise<void> {
  await db.meetingAction.update({
    where: { id: actionId },
    data: { status: "REJECTED" },
  })
}

export async function applyAllPendingMeetingActions(
  meetingNoteId: string,
  userId: string
): Promise<void> {
  const actions = await db.meetingAction.findMany({
    where: { meetingNoteId, status: "PENDING" },
  })

  for (const action of actions) {
    try {
      await applyMeetingAction(action.id, userId)
    } catch {
      // Continue applying other actions even if one fails
    }
  }

  // Check if all actions are now resolved
  const remaining = await db.meetingAction.count({
    where: { meetingNoteId, status: "PENDING" },
  })

  if (remaining === 0) {
    await db.meetingNote.update({
      where: { id: meetingNoteId },
      data: { status: "APPLIED" },
    })
  }
}

export async function rejectAllPendingMeetingActions(
  meetingNoteId: string
): Promise<void> {
  await db.meetingAction.updateMany({
    where: { meetingNoteId, status: "PENDING" },
    data: { status: "REJECTED" },
  })

  await db.meetingNote.update({
    where: { id: meetingNoteId },
    data: { status: "REJECTED" },
  })
}
