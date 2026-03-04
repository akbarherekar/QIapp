import { NextResponse } from "next/server"

export async function GET() {
  const timestamp = new Date().toISOString()

  // Always return 200 so Railway health check passes.
  // Database status is informational — check the response body.
  try {
    const { db } = await import("@/lib/db")
    await db.$queryRawUnsafe("SELECT 1")
    return NextResponse.json({
      status: "healthy",
      database: "connected",
      timestamp,
    })
  } catch {
    return NextResponse.json({
      status: "degraded",
      database: "disconnected",
      timestamp,
    })
  }
}
