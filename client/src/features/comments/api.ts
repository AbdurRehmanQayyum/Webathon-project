import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { refreshDiscussions } from '@/features/posts/api'
import { api } from '@/services/api-client'
import type { Comment } from './types'

export const useComments = (postId: number) =>
  useQuery({
    queryKey: ['comments', postId],
    queryFn: () => api.get<Comment[]>(`/api/posts/${postId}/comments`),
  })

export function useCommentActions(postId: number) {
  const queryClient = useQueryClient()
  const onSuccess = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['comments', postId] }),
      refreshDiscussions(queryClient),
    ])

  return {
    add: useMutation({
      mutationFn: (comment: { body: string; parentCommentId: number | null }) =>
        api.post(`/api/posts/${postId}/comments`, comment),
      onSuccess,
    }),
    edit: useMutation({
      mutationFn: ({ id, body }: { id: number; body: string }) =>
        api.put(`/api/comments/${id}`, { body }),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (id: number) => api.delete(`/api/comments/${id}`),
      onSuccess,
    }),
  }
}

export type CommentActions = ReturnType<typeof useCommentActions>
