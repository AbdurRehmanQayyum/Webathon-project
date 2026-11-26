import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { refreshDiscussions } from '@/features/posts/api'
import type { Post } from '@/features/posts/types'
import { api, type QueryParams } from '@/services/api-client'
import type { ContentStatus, PagedResult, UserSummary } from '@/types/common'

export interface ModeratedClub {
  id: number
  name: string
  slug: string
  iconKey: string
  logoFileId: number | null
  memberCount: number
  publishedPostCount: number
  removedPostCount: number
  pinnedPostCount: number
}

export interface ModerationComment {
  id: number
  postId: number
  postTitle: string
  body: string
  status: ContentStatus
  author: UserSummary
  createdAtUtc: string
}

export const useModeratedClubs = () =>
  useQuery({
    queryKey: ['moderation', 'clubs'],
    queryFn: () => api.get<ModeratedClub[]>('/api/moderation/clubs'),
  })

export const useModerationPosts = (clubId: number, params: QueryParams) =>
  useQuery({
    queryKey: ['moderation', 'posts', clubId, params],
    queryFn: () => api.get<PagedResult<Post>>(`/api/moderation/clubs/${clubId}/posts`, params),
    placeholderData: keepPreviousData,
  })

export const useModerationComments = (clubId: number, params: QueryParams) =>
  useQuery({
    queryKey: ['moderation', 'comments', clubId, params],
    queryFn: () =>
      api.get<PagedResult<ModerationComment>>(`/api/moderation/clubs/${clubId}/comments`, params),
    placeholderData: keepPreviousData,
  })

export function useModerationActions() {
  const queryClient = useQueryClient()
  const onSuccess = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['comments'] }),
      refreshDiscussions(queryClient),
    ])

  return {
    setPinned: useMutation({
      mutationFn: ({ postId, isPinned }: { postId: number; isPinned: boolean }) =>
        api.put(`/api/moderation/posts/${postId}/pin`, { isPinned }),
      onSuccess,
    }),
    removePost: useMutation({
      mutationFn: ({ postId, reason }: { postId: number; reason: string | null }) =>
        api.post(`/api/moderation/posts/${postId}/remove`, { reason }),
      onSuccess,
    }),
    restorePost: useMutation({
      mutationFn: (postId: number) => api.post(`/api/moderation/posts/${postId}/restore`),
      onSuccess,
    }),
    removeComment: useMutation({
      mutationFn: (id: number) => api.post(`/api/moderation/comments/${id}/remove`),
      onSuccess,
    }),
    restoreComment: useMutation({
      mutationFn: (id: number) => api.post(`/api/moderation/comments/${id}/restore`),
      onSuccess,
    }),
  }
}
