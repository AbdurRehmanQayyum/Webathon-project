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
    // Markup from the editor; the server also limits the visible text
    body: z.string().max(60000, 'This post is too long.'),
    tags: z.array(z.string()).max(8, 'Use up to 8 tags.'),
    linkUrl: z.string(),
  })
  .superRefine((values, context) => {
    if (values.type === 'Text' && !values.body) {
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
