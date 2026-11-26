import { z } from 'zod'
import { combineDateAndTime } from '@/lib/dates'
import { eventCategories } from './types'

export const eventSchema = z
  .object({
    title: z.string().trim().min(5, 'Use at least 5 characters.').max(200),
    description: z
      .string()
      .trim()
      .min(10, 'Describe the event in at least 10 characters.')
      .max(4000),
    venue: z.string().trim().min(2, 'Enter the venue.').max(200),
    category: z.enum(eventCategories, { error: 'Choose a category.' }),
    startDate: z.date({ error: 'Pick a start date.' }),
    startTime: z.string().min(1, 'Pick a start time.'),
    endDate: z.date({ error: 'Pick an end date.' }),
    endTime: z.string().min(1, 'Pick an end time.'),
  })
  .superRefine((values, context) => {
    const startsAt = combineDateAndTime(values.startDate, values.startTime)
    const endsAt = combineDateAndTime(values.endDate, values.endTime)
    if (endsAt <= startsAt) {
      context.addIssue({
        code: 'custom',
        path: ['endTime'],
        message: 'The event must end after it starts.',
      })
    }
  })

export type EventValues = z.infer<typeof eventSchema>
