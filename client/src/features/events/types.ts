import type { BadgeTone } from '@/components/ui/Badge'
import type { Attachment, UserSummary } from '@/types/common'

export const eventCategories = ['Academic', 'Workshop', 'Competition', 'Seminar', 'Social'] as const
export type EventCategory = (typeof eventCategories)[number]

export const categoryTones: Record<EventCategory, BadgeTone> = {
  Academic: 'info',
  Workshop: 'primary',
  Competition: 'warning',
  Seminar: 'neutral',
  Social: 'success',
}

export interface DepartmentEvent {
  id: number
  title: string
  description: string
  venue: string
  category: EventCategory
  startsAtUtc: string
  endsAtUtc: string
  status: 'Scheduled' | 'Cancelled'
  cancellationReason: string | null
  organizer: UserSummary
  attachments: Attachment[]
}
