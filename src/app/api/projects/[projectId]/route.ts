import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { updateProjectSchema } from "@/lib/validations/project"
import { logActivity } from "@/lib/activity-logger"
import { METHODOLOGY_PHASES } from "@/lib/constants"

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

    // Check if methodology is changing — requires phase migration
    if (data.methodology) {
      const current = await db.project.findUnique({
        where: { id: projectId },
        select: { methodology: true, title: true },
      })

      if (current && data.methodology !== current.methodology) {
        const newPhaseNames =
          METHODOLOGY_PHASES[data.methodology] || METHODOLOGY_PHASES.OTHER
        const oldMethodology = current.methodology

        // Perform phase migration in a transaction
        const project = await db.$transaction(async (tx) => {
          // Get all existing phases with their tasks
          const existingPhases = await tx.projectPhase.findMany({
            where: { projectId },
            include: { tasks: { select: { id: true } } },
          })

          // Collect all task IDs across all phases
          const allTaskIds = existingPhases.flatMap((p) =>
            p.tasks.map((t) => t.id)
          )

          // Create new phases
          const createdPhases = []
          for (let i = 0; i < newPhaseNames.length; i++) {
            const phase = await tx.projectPhase.create({
              data: {
                name: newPhaseNames[i],
                orderIndex: i,
                projectId,
              },
            })
            createdPhases.push(phase)
          }

          // Move all existing tasks to the first new phase
          if (allTaskIds.length > 0 && createdPhases.length > 0) {
            await tx.task.updateMany({
              where: { id: { in: allTaskIds } },
              data: { projectPhaseId: createdPhases[0].id },
            })
          }

          // Delete old phases (tasks already moved)
          await tx.projectPhase.deleteMany({
            where: { id: { in: existingPhases.map((p) => p.id) } },
          })

          // Update the project methodology
          const updated = await tx.project.update({
            where: { id: projectId },
            data: { methodology: data.methodology },
            include: {
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
              phases: { orderBy: { orderIndex: "asc" } },
            },
          })

          return updated
        })

        await logActivity({
          projectId,
          userId: session.user.id,
          action: "PROJECT_UPDATED",
          details: `Changed methodology from ${oldMethodology} to ${data.methodology}`,
          metadata: {
            changes: ["methodology"],
            oldMethodology,
            newMethodology: data.methodology,
          },
        })

        return NextResponse.json(project)
      }
    }

    // Standard field update (no methodology change)
    const project = await db.project.update({
      where: { id: projectId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.methodology !== undefined && { methodology: data.methodology }),
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
        ...(data.inboxEnabled !== undefined && { inboxEnabled: data.inboxEnabled }),
        ...(data.inboxAutoApply !== undefined && { inboxAutoApply: data.inboxAutoApply }),
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
    console.error("Failed to update project:", error)
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
