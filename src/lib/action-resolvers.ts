import { db } from "@/lib/db"

export interface ExtractedData {
  title?: string
  taskDescription?: string
  priority?: "HIGH" | "MEDIUM" | "LOW"
  phaseName?: string
  assigneeName?: string
  dueDate?: string
  targetTaskTitle?: string
  status?: "TODO" | "IN_PROGRESS" | "DONE"
  note?: string
  targetPhaseName?: string
  newPhaseStatus?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"
}

export async function resolvePhase(projectId: string, phaseName: string) {
  const phases = await db.projectPhase.findMany({
    where: { projectId },
    orderBy: { orderIndex: "asc" },
  })

  // Exact match first
  const exact = phases.find(
    (p) => p.name.toLowerCase() === phaseName.toLowerCase()
  )
  if (exact) return exact

  // Partial match
  const partial = phases.find(
    (p) =>
      p.name.toLowerCase().includes(phaseName.toLowerCase()) ||
      phaseName.toLowerCase().includes(p.name.toLowerCase())
  )
  if (partial) return partial

  // Default to first phase
  return phases[0] || null
}

export async function resolveAssignee(projectId: string, assigneeName: string) {
  const members = await db.projectMember.findMany({
    where: { projectId },
    include: { user: { select: { id: true, name: true } } },
  })

  const nameLower = assigneeName.toLowerCase()

  // Exact match
  const exact = members.find(
    (m) => m.user.name.toLowerCase() === nameLower
  )
  if (exact) return exact.user

  // Partial match (first/last name)
  const partial = members.find((m) => {
    const parts = m.user.name.toLowerCase().split(" ")
    return parts.some((part) => nameLower.includes(part) || part.includes(nameLower))
  })
  if (partial) return partial.user

  return null
}

export async function resolveTask(projectId: string, taskTitle: string) {
  const tasks = await db.task.findMany({
    where: {
      phase: { projectId },
    },
    include: { phase: true },
  })

  const titleLower = taskTitle.toLowerCase()

  // Exact match
  const exact = tasks.find((t) => t.title.toLowerCase() === titleLower)
  if (exact) return exact

  // Partial match
  const partial = tasks.find(
    (t) =>
      t.title.toLowerCase().includes(titleLower) ||
      titleLower.includes(t.title.toLowerCase())
  )
  return partial || null
}
