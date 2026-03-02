import { z } from "zod"

export const createGroupSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional(),
  department: z.string().max(200).optional(),
})

export const updateGroupSchema = createGroupSchema.partial().extend({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
})

export const addGroupMemberSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["CHAIR", "SECRETARY", "MEMBER"]).default("MEMBER"),
})

export const updateGroupMemberSchema = z.object({
  role: z.enum(["CHAIR", "SECRETARY", "MEMBER"]),
})

export const addGroupProjectSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
})

export const submitGroupMeetingNoteSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  meetingDate: z.string().min(1, "Meeting date is required"),
  attendees: z.string().max(2000).optional(),
  duration: z.number().int().min(1).max(600).optional(),
  transcript: z.string().min(1, "Transcript is required").max(100000),
})
