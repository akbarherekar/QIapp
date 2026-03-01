import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { updateMetricSchema } from "@/lib/validations/metric"
import { logActivity } from "@/lib/activity-logger"

export async function GET(
  _req: Request,
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
      if (!membership) {
        return NextResponse.json({ error: "Not a project member" }, { status: 403 })
      }
    }

    const metric = await db.metricDefinition.findUnique({
      where: { id: metricId },
      include: {
        dataPoints: {
          orderBy: { recordedAt: "asc" },
          include: {
            recordedBy: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    })

    if (!metric || metric.projectId !== projectId) {
      return NextResponse.json({ error: "Metric not found" }, { status: 404 })
    }

    return NextResponse.json(metric)
  } catch {
    return NextResponse.json({ error: "Failed to fetch metric" }, { status: 500 })
  }
}

export async function PATCH(
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
      if (!membership || membership.role !== "LEAD") {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
      }
    }

    const body = await req.json()
    const parsed = updateMetricSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const data = parsed.data

    const existing = await db.metricDefinition.findUnique({
      where: { id: metricId },
    })
    if (!existing || existing.projectId !== projectId) {
      return NextResponse.json({ error: "Metric not found" }, { status: 404 })
    }

    const metric = await db.metricDefinition.update({
      where: { id: metricId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.unit !== undefined && { unit: data.unit }),
        ...(data.lowerBound !== undefined && { lowerBound: data.lowerBound }),
        ...(data.upperBound !== undefined && { upperBound: data.upperBound }),
        ...(data.target !== undefined && { target: data.target }),
      },
      include: { dataPoints: true },
    })

    await logActivity({
      projectId,
      userId: session.user.id,
      action: "METRIC_UPDATED",
      details: `Updated metric "${metric.name}"`,
      metadata: { metricId: metric.id, changes: Object.keys(data) },
    })

    return NextResponse.json(metric)
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

export async function DELETE(
  _req: Request,
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
      if (!membership || membership.role !== "LEAD") {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
      }
    }

    const existing = await db.metricDefinition.findUnique({
      where: { id: metricId },
    })
    if (!existing || existing.projectId !== projectId) {
      return NextResponse.json({ error: "Metric not found" }, { status: 404 })
    }

    await db.metricDefinition.delete({ where: { id: metricId } })

    await logActivity({
      projectId,
      userId: session.user.id,
      action: "METRIC_DELETED",
      details: `Deleted metric "${existing.name}"`,
      metadata: { metricId },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
