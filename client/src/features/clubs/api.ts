import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type QueryParams } from '@/services/api-client'
import type { PagedResult } from '@/types/common'
import type { ClubRequestValues } from './schemas'
import type { Club, ClubCategory, ClubRequest } from './types'

export const useCategories = () =>
  useQuery({
    queryKey: ['clubs', 'categories'],
    queryFn: () => api.get<ClubCategory[]>('/api/clubs/categories'),
    staleTime: Infinity,
  })

export const useClubs = (params: QueryParams) =>
  useQuery({
    queryKey: ['clubs', 'list', params],
    queryFn: ({ signal }) => api.get<PagedResult<Club>>('/api/clubs', params, signal),
    placeholderData: keepPreviousData,
  })

export const useClub = (slug: string) =>
  useQuery({
    queryKey: ['clubs', 'detail', slug],
    queryFn: () => api.get<Club>(`/api/clubs/${encodeURIComponent(slug)}`),
  })

type ClubCache = PagedResult<Club> | Club | ClubCategory[]

function withMembership(club: Club, clubId: number, isMember: boolean): Club {
  if (club.id !== clubId || club.isMember === isMember) return club
  return { ...club, isMember, memberCount: club.memberCount + (isMember ? 1 : -1) }
}

// Optimistic join and leave, reconciled with the server afterwards
export function useMembership(clubId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (join: boolean) =>
      join
        ? api.post(`/api/clubs/${clubId}/membership`)
        : api.delete(`/api/clubs/${clubId}/membership`),
    onMutate: async (join) => {
      await queryClient.cancelQueries({ queryKey: ['clubs'] })
      queryClient.setQueriesData<ClubCache>({ queryKey: ['clubs'] }, (data) => {
        if (!data || Array.isArray(data)) return data
        if ('items' in data) {
          return { ...data, items: data.items.map((club) => withMembership(club, clubId, join)) }
        }
        return withMembership(data, clubId, join)
      })
    },
    onSettled: () =>
      Promise.all(
        ['clubs', 'posts', 'session', 'users'].map((key) =>
          queryClient.invalidateQueries({ queryKey: [key] }),
        ),
      ),
  })
}

export const useMyClubRequests = (params: QueryParams) =>
  useQuery({
    queryKey: ['club-requests', 'mine', params],
    queryFn: () => api.get<PagedResult<ClubRequest>>('/api/club-requests/mine', params),
    placeholderData: keepPreviousData,
  })

export function useSubmitClubRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: ClubRequestValues) =>
      api.post('/api/club-requests', { ...values, categoryId: Number(values.categoryId) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['club-requests'] }),
  })
}
