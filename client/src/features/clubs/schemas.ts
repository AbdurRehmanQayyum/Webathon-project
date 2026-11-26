import { z } from 'zod'

const name = z.string().trim().min(3, 'Use at least 3 characters.').max(80)
const categoryId = z.string().min(1, 'Choose a category.')
const description = z
  .string()
  .trim()
  .min(20, 'Describe the club in at least 20 characters.')
  .max(500)

export const clubSchema = z.object({
  name,
  categoryId,
  description,
  rules: z.string().max(2000),
})

export const clubRequestSchema = z.object({
  proposedName: name,
  categoryId,
  description,
  justification: z.string().trim().min(20, 'Explain the need in at least 20 characters.').max(1000),
})

export type ClubValues = z.infer<typeof clubSchema>
export type ClubRequestValues = z.infer<typeof clubRequestSchema>
