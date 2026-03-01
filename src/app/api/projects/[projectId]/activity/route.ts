import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = await params
  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get("cursor")
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 50)

  const logs = await db.activityLog.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  })

  const hasMore = logs.length > limit
  const items = hasMore ? logs.slice(0, limit) : logs
  const nextCursor = hasMore ? items[items.length - 1].id : null

  return NextResponse.json({ items, nextCursor })
}
