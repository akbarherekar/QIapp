import { db } from "@/lib/db"
import type { ActivitySource } from "@/generated/prisma/enums"

export async function logActivity(params: {
  projectId: string
  userId: string
  action: string
  details?: string
  source?: ActivitySource
  metadata?: Record<string, unknown>
}) {
  return db.activityLog.create({
    data: {
      projectId: params.projectId,
      userId: params.userId,
      action: params.action,
      details: params.details,
      source: params.source || "MANUAL",
      metadata: params.metadata as object | undefined,
    },
  })
}
