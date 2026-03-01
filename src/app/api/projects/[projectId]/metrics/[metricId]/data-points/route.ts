import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { addDataPointSchema } from "@/lib/validations/metric"
import { logActivity } from "@/lib/activity-logger"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string; metricId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, metricId } = await params

    if (session.user.role !== "DIRECTOR") {
      const membership = await db.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: session.user.id } },
      })
      if (!membership || membership.role === "STAKEHOLDER") {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
      }
    }

    const body = await req.json()
    const parsed = addDataPointSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const data = parsed.data

    const metric = await db.metricDefinition.findUnique({
      where: { id: metricId },
    })
    if (!metric || metric.projectId !== projectId) {
      return NextResponse.json({ error: "Metric not found" }, { status: 404 })
    }

    const dataPoint = await db.metricDataPoint.create({
      data: {
        metricId,
        value: data.value,
        recordedAt: new Date(data.recordedAt),
        notes: data.notes ?? null,
        recordedById: session.user.id,
      },
      include: {
        recordedBy: { select: { id: true, name: true, avatarUrl: true } },
      },
    })

    await logActivity({
      projectId,
      userId: session.user.id,
      action: "DATA_POINT_ADDED",
      details: `Added data point (${data.value}) to metric "${metric.name}"`,
      metadata: { metricId, dataPointId: dataPoint.id, value: data.value },
    })

    return NextResponse.json(dataPoint, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
