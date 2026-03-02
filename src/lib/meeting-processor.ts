import { db } from "@/lib/db"
import { anthropic } from "@/lib/ai"
import { Prisma } from "@/generated/prisma/client"
import type { Anthropic } from "@anthropic-ai/sdk"

const PROCESS_MEETING_TOOL: Anthropic.Messages.Tool = {
  name: "process_meeting_notes",
  description:
    "Extract a structured summary, key decisions, and action items from QI meeting notes or transcripts",
  input_schema: {
    type: "object" as const,
    properties: {
      meetingSummary: {
        type: "string",
        description:
          "A 3-5 sentence summary of the meeting covering the main topics discussed and outcomes",
      },
      keyDecisions: {
        type: "array",
        items: { type: "string" },
        description:
          "Important decisions made during the meeting (e.g., 'Decided to switch to daily catheter assessments')",
      },
      actions: {
        type: "array",
        description:
          "Concrete actions to apply to the project. Extract as many as are clearly stated or assigned.",
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
                title: {
                  type: "string",
                  description: "Task title (for CREATE_TASK)",
                },
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
                  description:
                    "Phase name to place the task in (must match an existing phase)",
                },
                assigneeName: {
                  type: "string",
                  description:
                    "Name of the person to assign to (must match a project member)",
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
    required: ["meetingSummary", "keyDecisions", "actions"],
  },
}

export async function processMeetingNote(meetingNoteId: string): Promise<void> {
  const meetingNote = await db.meetingNote.findUniqueOrThrow({
    where: { id: meetingNoteId },
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
      submittedBy: { select: { id: true, name: true } },
    },
  })

  // Mark as processing
  await db.meetingNote.update({
    where: { id: meetingNoteId },
    data: { status: "PROCESSING" },
  })

  try {
    const project = meetingNote.project

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

    const systemPrompt = `You are a healthcare Quality Improvement assistant. You process meeting notes and transcripts from QI team meetings and extract structured summaries, key decisions, and action items.

Rules:
- Provide a concise 3-5 sentence meeting summary covering the main topics and outcomes
- Extract key decisions as clear, actionable statements
- Only extract actions that are clearly stated or assigned in the meeting notes
- Match phase names exactly to existing phases listed below
- Match assignee names to existing project members listed below
- If someone volunteers or is assigned a task, use CREATE_TASK with their name as assignee
- If someone reports a task is done, use COMPLETE_TASK
- If progress is discussed on an existing task, use UPDATE_TASK
- Notes about process observations or data should be ADD_NOTE
- Be conservative — do not invent actions that aren't mentioned in the notes`

    const userPrompt = `Project: "${project.title}"
Methodology: ${project.methodology}
Target Metric: ${project.targetMetric || "Not set"}
Baseline → Goal: ${project.baselineValue || "?"} → ${project.goalValue || "?"}

Team Members:
${memberContext}

Current Phases and Tasks:
${phaseContext}

---

Meeting Notes:
Title: ${meetingNote.title}
Date: ${meetingNote.meetingDate.toISOString().split("T")[0]}
${meetingNote.attendees ? `Attendees: ${meetingNote.attendees}` : ""}
${meetingNote.duration ? `Duration: ${meetingNote.duration} minutes` : ""}
Submitted by: ${meetingNote.submittedBy.name}

${meetingNote.rawTranscript}`

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      tools: [PROCESS_MEETING_TOOL],
      tool_choice: { type: "tool", name: "process_meeting_notes" },
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
      meetingSummary: string
      keyDecisions: string[]
      actions: Array<{
        actionType: string
        description: string
        data: Record<string, unknown>
      }>
    }

    // Create MeetingAction records
    for (const action of result.actions) {
      await db.meetingAction.create({
        data: {
          meetingNoteId,
          actionType: action.actionType as
            | "CREATE_TASK"
            | "UPDATE_TASK"
            | "COMPLETE_TASK"
            | "ADD_NOTE"
            | "STATUS_UPDATE",
          description: action.description,
          extractedData: action.data as object,
        },
      })
    }

    // Update meeting note with results
    await db.meetingNote.update({
      where: { id: meetingNoteId },
      data: {
        status: "REVIEWED",
        processedSummary: result.meetingSummary,
        keyDecisions: result.keyDecisions as unknown as Prisma.InputJsonValue,
        llmResponse: result as object,
        processedAt: new Date(),
      },
    })
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Unknown processing error"

    await db.meetingNote.update({
      where: { id: meetingNoteId },
      data: {
        status: "FAILED",
        errorMessage: errorMsg,
        processedAt: new Date(),
      },
    })

    throw error
  }
}
