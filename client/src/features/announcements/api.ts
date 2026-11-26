import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type QueryParams } from '@/services/api-client'
import type { PagedResult } from '@/types/common'
import type { Announcement, AnnouncementPriority } from './types'

export const useAnnouncements = (params: QueryParams) =>
  useQuery({
    queryKey: ['announcements', 'list', params],
    queryFn: ({ signal }) =>
      api.get<PagedResult<Announcement>>('/api/announcements', params, signal),
    placeholderData: keepPreviousData,
  })

export const useAnnouncement = (id: number) =>
  useQuery({
    queryKey: ['announcements', 'detail', id],
    queryFn: () => api.get<Announcement>(`/api/announcements/${id}`),
  })

export interface AnnouncementPayload {
  title: string
  body: string
  linkUrl: string | null
  linkLabel: string | null
  priority: AnnouncementPriority
  publish: boolean
}

export function useAnnouncementActions() {
  const queryClient = useQueryClient()
  const onSuccess = () =>
    Promise.all(
      ['announcements', 'admin'].map((key) => queryClient.invalidateQueries({ queryKey: [key] })),
    )

  return {
    save: useMutation({
      mutationFn: async ({ id, ...payload }: AnnouncementPayload & { id?: number }) => {
        if (id) {
          await api.put(`/api/announcements/${id}`, payload)
          return id
        }
        return (await api.post<{ id: number }>('/api/announcements', payload)).id
      },
      onSuccess,
    }),
    setPublished: useMutation({
      mutationFn: ({ id, isPublished }: { id: number; isPublished: boolean }) =>
        api.put(`/api/announcements/${id}/publication`, { isPublished }),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (id: number) => api.delete(`/api/announcements/${id}`),
      onSuccess,
    }),
  }
}
