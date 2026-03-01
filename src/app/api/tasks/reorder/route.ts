import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { reorderTasksSchema } from "@/lib/validations/task"

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { tasks } = reorderTasksSchema.parse(body)

    // Update all tasks in parallel
    await Promise.all(
      tasks.map((task) =>
        db.task.update({
          where: { id: task.id },
          data: {
            projectPhaseId: task.projectPhaseId,
            orderIndex: task.orderIndex,
          },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Failed to reorder tasks:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
