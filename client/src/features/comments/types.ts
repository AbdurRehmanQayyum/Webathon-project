import type { ContentStatus, UserSummary } from '@/types/common'

export type CommentSort = 'Recent' | 'Popular' | 'Oldest'

export interface Comment {
  id: number
  postId: number
  parentCommentId: number | null
  body: string | null
  status: ContentStatus
  author: UserSummary
  authorUsername: string
  createdAtUtc: string
  editedAtUtc: string | null
  score: number
  myVote: number
  canEdit: boolean
  canDelete: boolean
  canReact: boolean
}

export interface CommentNode extends Comment {
  replies: CommentNode[]
}
