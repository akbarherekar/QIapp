import { db } from "@/lib/db"
import { anthropic } from "@/lib/ai"
import type { Anthropic } from "@anthropic-ai/sdk"

const PROCESS_TOOL: Anthropic.Messages.Tool = {
  name: "process_inbox_message",
  description:
    "Classify an inbound message and extract structured actions for a QI project",
  input_schema: {
    type: "object" as const,
    properties: {
      classification: {
        type: "string",
        enum: [
          "new_tasks",
          "task_update",
          "status_report",
          "meeting_notes",
          "metric_data",
          "general_observation",
        ],
        description: "The primary type of this message",
      },
      summary: {
        type: "string",
        description:
          "A 1-2 sentence human-readable summary of what this message contains",
      },
      actions: {
        type: "array",
        description:
          "Concrete actions to apply to the project. Extract as many as are clearly implied.",
        items: {
          type: "object",
          properties: {
            actionType: {
              type: "string",
              enum: [
                "CREATE_TASK",
                "UPDATE_TASK",
                "COMPLETE_TASK",
                "ADD_NOTE",
                "STATUS_UPDATE",
              ],
            },
            description: {
              type: "string",
              description:
                "Human-readable description of what this action will do",
            },
            data: {
              type: "object",
              description: "Structured data for the action",
              properties: {
                title: { type: "string", description: "Task title (for CREATE_TASK)" },
                taskDescription: {
                  type: "string",
                  description: "Task description (for CREATE_TASK)",
                },
                priority: {
                  type: "string",
                  enum: ["HIGH", "MEDIUM", "LOW"],
                  description: "Priority level",
                },
                phaseName: {
                  type: "string",
                  description: "Phase name to place the task in (must match an existing phase)",
                },
                assigneeName: {
                  type: "string",
                  description: "Name of the person to assign to (must match a project member)",
                },
                dueDate: {
                  type: "string",
                  description: "Due date in YYYY-MM-DD format",
                },
                targetTaskTitle: {
                  type: "string",
                  description:
                    "Title of existing task to update/complete (for UPDATE_TASK / COMPLETE_TASK)",
                },
                status: {
                  type: "string",
                  enum: ["TODO", "IN_PROGRESS", "DONE"],
                  description: "New task status (for UPDATE_TASK)",
                },
                note: {
                  type: "string",
                  description: "Note content (for ADD_NOTE)",
                },
                targetPhaseName: {
                  type: "string",
                  description: "Phase to update (for STATUS_UPDATE)",
                },
                newPhaseStatus: {
                  type: "string",
                  enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"],
                  description: "New phase status (for STATUS_UPDATE)",
                },
              },
            },
          },
          required: ["actionType", "description", "data"],
        },
      },
    },
    required: ["classification", "summary", "actions"],
  },
}

export async function processInboxMessage(messageId: string): Promise<void> {
  const message = await db.inboxMessage.findUniqueOrThrow({
    where: { id: messageId },
    include: {
      project: {
        include: {
          phases: {
            orderBy: { orderIndex: "asc" },
            include: {
              tasks: {
                orderBy: { orderIndex: "asc" },
                take: 30,
                include: {
                  assignee: { select: { id: true, name: true } },
                },
              },
            },
          },
          members: {
            include: {
              user: { select: { id: true, name: true, role: true } },
            },
          },
        },
      },
      sender: { select: { id: true, name: true } },
    },
  })

  // Mark as processing
  await db.inboxMessage.update({
    where: { id: messageId },
    data: { status: "PROCESSING" },
  })

  try {
    const project = message.project

    // Build context for the LLM
    const phaseContext = project.phases
      .map((p) => {
        const taskList = p.tasks
          .map(
            (t) =>
              `  - "${t.title}" [${t.status}]${t.assignee ? ` (assigned to ${t.assignee.name})` : ""}`
          )
          .join("\n")
        return `Phase: "${p.name}" [${p.status}]\n${taskList || "  (no tasks)"}`
      })
      .join("\n\n")

    const memberContext = project.members
      .map((m) => `- ${m.user.name} (${m.role})`)
      .join("\n")

    const systemPrompt = `You are a healthcare Quality Improvement assistant. You process inbound messages sent to QI projects and extract structured actions.

Rules:
- Only extract actions that are clearly stated or strongly implied in the message
- Match phase names exactly to existing phases listed below
- Match assignee names to existing project members listed below
- For meeting notes or long messages, extract multiple action items
- If the message is just an observation or status report with no clear actions, use ADD_NOTE
- Be conservative — do not invent tasks that aren't mentioned`

    const userPrompt = `Project: "${project.title}"
Methodology: ${project.methodology}
Target Metric: ${project.targetMetric || "Not set"}
Baseline → Goal: ${project.baselineValue || "?"} → ${project.goalValue || "?"}

Team Members:
${memberContext}

Current Phases and Tasks:
${phaseContext}

---

Inbound Message:
Channel: ${message.channel}
Sender: ${message.sender?.name || message.senderIdentifier}
${message.subject ? `Subject: ${message.subject}` : ""}

${message.rawBody}`

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      tools: [PROCESS_TOOL],
      tool_choice: { type: "tool", name: "process_inbox_message" },
      messages: [{ role: "user", content: userPrompt }],
    })

    // Extract tool use result
    const toolBlock = response.content.find(
      (block): block is Anthropic.Messages.ToolUseBlock =>
        block.type === "tool_use"
    )

    if (!toolBlock) {
      throw new Error("LLM did not return a tool_use response")
    }

    const result = toolBlock.input as {
      classification: string
      summary: string
      actions: Array<{
        actionType: string
        description: string
        data: Record<string, unknown>
      }>
    }

    // Create InboxAction records
    for (const action of result.actions) {
      await db.inboxAction.create({
        data: {
          inboxMessageId: messageId,
          actionType: action.actionType as "CREATE_TASK" | "UPDATE_TASK" | "COMPLETE_TASK" | "ADD_NOTE" | "STATUS_UPDATE",
          description: action.description,
          extractedData: action.data as object,
        },
      })
    }

    // Update message with results
    await db.inboxMessage.update({
      where: { id: messageId },
      data: {
        status: "REVIEWED",
        processedSummary: result.summary,
        classification: result.classification,
        llmResponse: result as object,
        processedAt: new Date(),
      },
    })

    // If auto-apply is enabled, apply all actions
    if (project.inboxAutoApply && message.senderId) {
      const { applyAllPendingActions } = await import("@/lib/inbox-actions")
      await applyAllPendingActions(messageId, message.senderId)
    }
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Unknown processing error"

    await db.inboxMessage.update({
      where: { id: messageId },
      data: {
        status: "FAILED",
        errorMessage: errorMsg,
        processedAt: new Date(),
      },
    })

    throw error
  }
}
