import { z } from "zod"

export const submitMeetingNoteSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  meetingDate: z.string().min(1, "Meeting date is required"),
  attendees: z.string().max(2000).optional(),
  duration: z.number().int().min(1).max(600).optional(),
  transcript: z.string().min(1, "Transcript is required").max(100000),
})

export const reviewMeetingActionSchema = z.object({
  approved: z.boolean(),
})
