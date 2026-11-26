import type { Attachment, UserSummary } from '@/types/common'

export type AnnouncementPriority = 'Normal' | 'Important'

export interface Announcement {
  id: number
  title: string
  // Sanitised markup
  body: string
  excerpt: string
  linkUrl: string | null
  linkLabel: string | null
  priority: AnnouncementPriority
  isPublished: boolean
  publishedAtUtc: string | null
  createdAtUtc: string
  updatedAtUtc: string | null
  author: UserSummary
  attachments: Attachment[]
}
