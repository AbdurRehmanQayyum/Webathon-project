import type { Attachment, ClubReference, ContentStatus, UserSummary } from '@/types/common'

export type PostType = 'Text' | 'Link'

export interface Post {
  id: number
  type: PostType
  title: string
  // Sanitised markup, returned for a single post only
  body: string | null
  excerpt: string | null
  linkUrl: string | null
  status: ContentStatus
  isPinned: boolean
  moderationReason: string | null
  club: ClubReference
  author: UserSummary
  createdAtUtc: string
  editedAtUtc: string | null
  score: number
  myVote: number
  commentCount: number
  isBookmarked: boolean
  tags: string[]
  attachments: Attachment[]
  canEdit: boolean
  canDelete: boolean
  canModerate: boolean
  canPin: boolean
  canComment: boolean
  canReact: boolean
}
