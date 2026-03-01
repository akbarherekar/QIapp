import { z } from "zod"

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  projectPhaseId: z.string().min(1),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
})

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  projectPhaseId: z.string().optional(),
  orderIndex: z.number().optional(),
})

export const reorderTasksSchema = z.object({
  tasks: z.array(
    z.object({
      id: z.string(),
      projectPhaseId: z.string(),
      orderIndex: z.number(),
    })
  ),
})
