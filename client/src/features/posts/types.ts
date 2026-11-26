import type { Attachment, ClubReference, ContentStatus, UserSummary } from '@/types/common'

export type PostType = 'Text' | 'Link'

export interface Post {
  id: number
  type: PostType
  title: string
  body: string | null
  isBodyTruncated: boolean
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
  attachments: Attachment[]
  canEdit: boolean
  canDelete: boolean
  canModerate: boolean
  canComment: boolean
}
