import { z } from "zod"

export const createProjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  methodology: z
    .enum(["DMAIC", "PDSA", "LEAN", "SIX_SIGMA", "OTHER"])
    .default("PDSA"),
  department: z.string().optional(),
  unit: z.string().optional(),
  targetMetric: z.string().optional(),
  baselineValue: z.string().optional(),
  goalValue: z.string().optional(),
  startDate: z.string().datetime().optional().nullable(),
  targetEndDate: z.string().datetime().optional().nullable(),
})

export const updateProjectSchema = createProjectSchema.partial().extend({
  status: z
    .enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"])
    .optional(),
})
