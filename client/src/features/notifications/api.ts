import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { api, type QueryParams } from '@/services/api-client'
import { startLiveUpdates } from '@/services/live'
import type { PagedResult, UserSummary } from '@/types/common'

export type NotificationType =
  | 'CommentOnPost'
  | 'ReplyToComment'
  | 'ClubRequestApproved'
  | 'ClubRequestRejected'
  | 'ModeratorAssigned'
  | 'ContentRemoved'
  | 'Mention'
  | 'AnnouncementPublished'
  | 'EventScheduled'
  | 'EventCancelled'

export type NotificationCategory =
  | 'All'
  | 'Mentions'
  | 'Replies'
  | 'Clubs'
  | 'Moderation'
  | 'Department'

export interface Notification {
  id: number
  type: NotificationType
  message: string
  linkPath: string
  isRead: boolean
  createdAtUtc: string
  actor: UserSummary | null
}

export interface NotificationFeed {
  page: PagedResult<Notification>
  unreadCount: number
}

const notificationsKey = ['notifications'] as const

export const useNotifications = (params: QueryParams) =>
  useQuery({
    queryKey: [...notificationsKey, params],
    queryFn: ({ signal }) => api.get<NotificationFeed>('/api/notifications', params, signal),
    placeholderData: keepPreviousData,
  })

export function useNotificationActions() {
  const queryClient = useQueryClient()
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: notificationsKey })

  return {
    read: useMutation({
      mutationFn: (id: number) => api.post(`/api/notifications/${id}/read`),
      onSuccess,
    }),
    readAll: useMutation({
      mutationFn: () => api.post('/api/notifications/read-all'),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (id: number) => api.delete(`/api/notifications/${id}`),
      onSuccess,
    }),
    clearRead: useMutation({
      mutationFn: () => api.delete('/api/notifications/read'),
      onSuccess,
    }),
  }
}

export function useLiveUpdates() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const refresh = (...keys: string[]) =>
      keys.forEach((key) => void queryClient.invalidateQueries({ queryKey: [key] }))
    return startLiveUpdates({
      notificationsChanged: () => {
        // Role, request and department changes arrive with their notification
        refresh('notifications', 'session', 'club-requests', 'announcements', 'events')
      },
      commentsChanged: (postId) => {
        void queryClient.invalidateQueries({ queryKey: ['comments', postId] })
        void queryClient.invalidateQueries({ queryKey: ['posts', 'detail', postId] })
      },
    })
  }, [queryClient])
}
