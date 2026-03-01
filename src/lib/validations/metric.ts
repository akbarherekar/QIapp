import { z } from "zod"

export const createMetricSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  unit: z.string().max(50).optional().nullable(),
  lowerBound: z.number().optional().nullable(),
  upperBound: z.number().optional().nullable(),
  target: z.number().optional().nullable(),
})

export const updateMetricSchema = createMetricSchema.partial()

export const addDataPointSchema = z.object({
  value: z.number({ message: "Value must be a number" }),
  recordedAt: z.string().datetime("Invalid date format"),
  notes: z.string().max(1000).optional().nullable(),
})
