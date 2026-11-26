import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { api, type QueryParams } from '@/services/api-client'
import type { PagedResult } from '@/types/common'
import type { Post, PostType } from './types'

export const usePosts = (params: QueryParams) =>
  useQuery({
    queryKey: ['posts', 'list', params],
    queryFn: ({ signal }) => api.get<PagedResult<Post>>('/api/posts', params, signal),
    placeholderData: keepPreviousData,
  })

export const useBookmarkedPosts = (params: QueryParams) =>
  useQuery({
    queryKey: ['posts', 'bookmarks', params],
    queryFn: () => api.get<PagedResult<Post>>('/api/bookmarks', params),
    placeholderData: keepPreviousData,
  })

export const usePost = (postId: number) =>
  useQuery({
    queryKey: ['posts', 'detail', postId],
    queryFn: () => api.get<Post>(`/api/posts/${postId}`),
  })

export const refreshDiscussions = (queryClient: QueryClient) =>
  Promise.all(
    ['posts', 'clubs', 'moderation', 'users', 'admin'].map((key) =>
      queryClient.invalidateQueries({ queryKey: [key] }),
    ),
  )

function patchPost(queryClient: QueryClient, postId: number, change: (post: Post) => Post) {
  queryClient.setQueriesData<PagedResult<Post> | Post>({ queryKey: ['posts'] }, (data) => {
    if (!data) return data
    if ('items' in data) {
      return { ...data, items: data.items.map((p) => (p.id === postId ? change(p) : p)) }
    }
    return data.id === postId ? change(data) : data
  })
}

// Optimistic voting, reconciled with the stored total
export function useVote(postId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (value: number) =>
      api.put<{ score: number; myVote: number }>(`/api/posts/${postId}/vote`, { value }),
    onMutate: async (value) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] })
      patchPost(queryClient, postId, (post) => ({
        ...post,
        myVote: value,
        score: post.score + value - post.myVote,
      }))
    },
    onSuccess: (result) => patchPost(queryClient, postId, (post) => ({ ...post, ...result })),
    onError: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  })
}

export function useBookmark(postId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (save: boolean) =>
      save ? api.put(`/api/posts/${postId}/bookmark`) : api.delete(`/api/posts/${postId}/bookmark`),
    onMutate: async (save) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] })
      patchPost(queryClient, postId, (post) => ({ ...post, isBookmarked: save }))
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  })
}

export interface NewPost {
  clubId: number
  type: PostType
  title: string
  body: string | null
  linkUrl: string | null
}

export function useCreatePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (post: NewPost) => api.post<{ id: number }>('/api/posts', post),
    onSuccess: () => refreshDiscussions(queryClient),
  })
}

export function useUpdatePost(postId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (post: Pick<NewPost, 'title' | 'body' | 'linkUrl'>) =>
      api.put(`/api/posts/${postId}`, post),
    onSuccess: () => refreshDiscussions(queryClient),
  })
}

export function useDeletePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (postId: number) => api.delete(`/api/posts/${postId}`),
    onSuccess: () => refreshDiscussions(queryClient),
  })
}
