import { z } from 'zod'

export const webUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => /^https?:\/\/[^\s]+\.[^\s]+/i.test(value), {
    message: 'Enter a full web address starting with http:// or https://.',
  })

export const postSchema = z
  .object({
    clubId: z.string().min(1, 'Choose a club.'),
    type: z.enum(['Text', 'Link']),
    title: z.string().trim().min(5, 'Use at least 5 characters.').max(200),
    body: z.string().max(20000),
    linkUrl: z.string(),
  })
  .superRefine((values, context) => {
    if (values.type === 'Text' && !values.body.trim()) {
      context.addIssue({ code: 'custom', path: ['body'], message: 'Write something in your post.' })
    }
    if (values.type === 'Link') {
      const result = webUrlSchema.safeParse(values.linkUrl)
      if (!result.success) {
        context.addIssue({
          code: 'custom',
          path: ['linkUrl'],
          message: result.error.issues[0]?.message ?? 'Enter a web address.',
        })
      }
    }
  })

export type PostValues = z.infer<typeof postSchema>
