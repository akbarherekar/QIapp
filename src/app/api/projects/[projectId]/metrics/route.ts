import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { createMetricSchema } from "@/lib/validations/metric"
import { logActivity } from "@/lib/activity-logger"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId } = await params

    if (session.user.role !== "DIRECTOR") {
      const membership = await db.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: session.user.id } },
      })
      if (!membership) {
        return NextResponse.json({ error: "Not a project member" }, { status: 403 })
      }
    }

    const metrics = await db.metricDefinition.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: {
        dataPoints: {
          orderBy: { recordedAt: "desc" },
          take: 50,
          include: {
            recordedBy: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    })

    return NextResponse.json(metrics)
  } catch {
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId } = await params

    if (session.user.role !== "DIRECTOR") {
      const membership = await db.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: session.user.id } },
      })
      if (!membership || membership.role !== "LEAD") {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
      }
    }

    const body = await req.json()
    const parsed = createMetricSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const data = parsed.data

    const metric = await db.metricDefinition.create({
      data: {
        projectId,
        name: data.name,
        unit: data.unit ?? null,
        lowerBound: data.lowerBound ?? null,
        upperBound: data.upperBound ?? null,
        target: data.target ?? null,
      },
      include: {
        dataPoints: true,
      },
    })

    await logActivity({
      projectId,
      userId: session.user.id,
      action: "METRIC_CREATED",
      details: `Created metric "${metric.name}"`,
      metadata: { metricId: metric.id },
    })

    return NextResponse.json(metric, { status: 201 })
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
