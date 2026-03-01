import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function DELETE(
  _req: Request,
  {
    params,
  }: {
    params: Promise<{
      projectId: string
      metricId: string
      dataPointId: string
    }>
  }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, metricId, dataPointId } = await params

    if (session.user.role !== "DIRECTOR") {
      const membership = await db.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: session.user.id } },
      })
      if (!membership || membership.role !== "LEAD") {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
      }
    }

    const dataPoint = await db.metricDataPoint.findUnique({
      where: { id: dataPointId },
      include: { metric: { select: { projectId: true } } },
    })

    if (
      !dataPoint ||
      dataPoint.metricId !== metricId ||
      dataPoint.metric.projectId !== projectId
    ) {
      return NextResponse.json({ error: "Data point not found" }, { status: 404 })
    }

    await db.metricDataPoint.delete({ where: { id: dataPointId } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
