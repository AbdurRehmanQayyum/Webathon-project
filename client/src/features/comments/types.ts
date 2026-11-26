import type { ContentStatus, UserSummary } from '@/types/common'

export interface Comment {
  id: number
  postId: number
  parentCommentId: number | null
  body: string | null
  status: ContentStatus
  author: UserSummary
  createdAtUtc: string
  editedAtUtc: string | null
  canEdit: boolean
  canDelete: boolean
}

export interface CommentNode extends Comment {
  replies: CommentNode[]
}
