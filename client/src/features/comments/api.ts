import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import { refreshDiscussions } from '@/features/posts/api'
import { api } from '@/services/api-client'
import type { PagedResult } from '@/types/common'
import type { Comment, CommentSort } from './types'

const THREADS_PER_PAGE = 15

type CommentPages = InfiniteData<PagedResult<Comment>>

// Each page holds whole threads, loaded on request
export const useComments = (postId: number, sort: CommentSort) =>
  useInfiniteQuery({
    queryKey: ['comments', postId, sort],
    queryFn: ({ pageParam, signal }) =>
      api.get<PagedResult<Comment>>(
        `/api/posts/${postId}/comments`,
        { sort, pageNumber: pageParam, pageSize: THREADS_PER_PAGE },
        signal,
      ),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pageNumber < last.totalPages ? last.pageNumber + 1 : undefined,
    placeholderData: keepPreviousData,
  })

export function useCommentActions(postId: number) {
  const queryClient = useQueryClient()
  const key = ['comments', postId]
  const onSuccess = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: key }),
      refreshDiscussions(queryClient),
    ])

  const patch = (id: number, change: (comment: Comment) => Comment) =>
    queryClient.setQueriesData<CommentPages>({ queryKey: key }, (data) =>
      data
        ? {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              items: page.items.map((item) => (item.id === id ? change(item) : item)),
            })),
          }
        : data,
    )

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
    // Optimistic, reconciled with the stored total
    vote: useMutation({
      mutationFn: ({ id, value }: { id: number; value: number }) =>
        api.put<{ score: number; myVote: number }>(`/api/comments/${id}/vote`, { value }),
      onMutate: async ({ id, value }) => {
        await queryClient.cancelQueries({ queryKey: key })
        patch(id, (comment) => ({
          ...comment,
          myVote: value,
          score: comment.score + value - comment.myVote,
        }))
      },
      onSuccess: (result, { id }) => patch(id, (comment) => ({ ...comment, ...result })),
      onError: () => queryClient.invalidateQueries({ queryKey: key }),
    }),
  }
}

export type CommentActions = ReturnType<typeof useCommentActions>
