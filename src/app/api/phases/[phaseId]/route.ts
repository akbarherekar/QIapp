import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { logActivity } from "@/lib/activity-logger"

const updatePhaseSchema = z.object({
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ phaseId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { phaseId } = await params

  try {
    const body = await req.json()
    const data = updatePhaseSchema.parse(body)

    const existingPhase = await db.projectPhase.findUnique({
      where: { id: phaseId },
      select: { status: true, name: true, projectId: true },
    })

    if (!existingPhase) {
      return NextResponse.json({ error: "Phase not found" }, { status: 404 })
    }

    const phase = await db.projectPhase.update({
      where: { id: phaseId },
      data: { status: data.status },
    })

    await logActivity({
      projectId: existingPhase.projectId,
      userId: session.user.id,
      action: "PHASE_STATUS_CHANGED",
      details: `Changed "${existingPhase.name}" from ${existingPhase.status} to ${data.status}`,
      metadata: {
        phaseId,
        from: existingPhase.status,
        to: data.status,
      },
    })

    return NextResponse.json(phase)
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
