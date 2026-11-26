import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { api } from '@/services/api-client'
import { startLiveUpdates } from '@/services/live'

export interface Notification {
  id: number
  type: string
  message: string
  linkPath: string
  isRead: boolean
  createdAtUtc: string
}

const notificationsKey = ['notifications'] as const

export const useNotifications = () =>
  useQuery({
    queryKey: notificationsKey,
    queryFn: () => api.get<{ items: Notification[]; unreadCount: number }>('/api/notifications'),
  })

export function useMarkRead() {
  const queryClient = useQueryClient()
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: notificationsKey })

  return {
    one: useMutation({
      mutationFn: (id: number) => api.post(`/api/notifications/${id}/read`),
      onSuccess,
    }),
    all: useMutation({
      mutationFn: () => api.post('/api/notifications/read-all'),
      onSuccess,
    }),
  }
}

export function useLiveUpdates() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const refresh = (key: unknown[]) => void queryClient.invalidateQueries({ queryKey: key })
    return startLiveUpdates({
      notificationsChanged: () => {
        refresh([...notificationsKey])
        // Role and request changes arrive with their notification
        refresh(['session'])
        refresh(['club-requests'])
      },
      commentsChanged: (postId) => {
        refresh(['comments', postId])
        refresh(['posts', 'detail', postId])
      },
    })
  }, [queryClient])
}
