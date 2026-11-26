import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type QueryParams } from '@/services/api-client'
import type { PagedResult } from '@/types/common'
import type { DepartmentEvent, EventCategory } from './types'

export const useEvents = (params: QueryParams) =>
  useQuery({
    queryKey: ['events', 'list', params],
    queryFn: ({ signal }) => api.get<PagedResult<DepartmentEvent>>('/api/events', params, signal),
    placeholderData: keepPreviousData,
  })

export const useEvent = (id: number) =>
  useQuery({
    queryKey: ['events', 'detail', id],
    queryFn: () => api.get<DepartmentEvent>(`/api/events/${id}`),
  })

export interface EventPayload {
  title: string
  description: string
  venue: string
  category: EventCategory
  startsAt: string
  endsAt: string
}

export function useEventActions() {
  const queryClient = useQueryClient()
  const onSuccess = () =>
    Promise.all(
      ['events', 'admin'].map((key) => queryClient.invalidateQueries({ queryKey: [key] })),
    )

  return {
    save: useMutation({
      mutationFn: async ({ id, ...payload }: EventPayload & { id?: number }) => {
        if (id) {
          await api.put(`/api/events/${id}`, payload)
          return id
        }
        return (await api.post<{ id: number }>('/api/events', payload)).id
      },
      onSuccess,
    }),
    cancel: useMutation({
      mutationFn: ({ id, reason }: { id: number; reason: string }) =>
        api.post(`/api/events/${id}/cancel`, { reason }),
      onSuccess,
    }),
  }
}
