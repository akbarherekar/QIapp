import { z } from "zod"

export const createSurveySchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional().nullable(),
  questions: z
    .array(
      z.object({
        text: z.string().min(1, "Question text is required").max(500),
        type: z.enum(["TEXT", "RATING", "MULTIPLE_CHOICE", "YES_NO", "LIKERT_SCALE"]),
        required: z.boolean().default(true),
        options: z.array(z.string().min(1)).optional().nullable(),
      })
    )
    .optional(),
})

export const updateSurveySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
})

export const addQuestionSchema = z.object({
  text: z.string().min(1, "Question text is required").max(500),
  type: z.enum(["TEXT", "RATING", "MULTIPLE_CHOICE", "YES_NO", "LIKERT_SCALE"]),
  required: z.boolean().default(true),
  options: z.array(z.string().min(1)).optional().nullable(),
  orderIndex: z.number().int().min(0).optional(),
})

export const updateQuestionSchema = z.object({
  text: z.string().min(1).max(500).optional(),
  type: z.enum(["TEXT", "RATING", "MULTIPLE_CHOICE", "YES_NO", "LIKERT_SCALE"]).optional(),
  required: z.boolean().optional(),
  options: z.array(z.string().min(1)).optional().nullable(),
  orderIndex: z.number().int().min(0).optional(),
})

export const submitResponseSchema = z.object({
  respondentName: z.string().max(200).optional().nullable(),
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      value: z.string(),
    })
  ),
})
