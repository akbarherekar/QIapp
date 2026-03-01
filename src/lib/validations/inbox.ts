import { z } from "zod"

export const submitInboxMessageSchema = z.object({
  body: z.string().min(1, "Message body is required").max(50000),
  subject: z.string().max(500).optional(),
})

export const reviewActionSchema = z.object({
  approved: z.boolean(),
})
