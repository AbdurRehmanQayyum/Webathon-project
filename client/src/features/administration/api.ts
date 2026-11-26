import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Role } from '@/features/auth/types'
import type { ClubValues } from '@/features/clubs/schemas'
import type { Club, ClubRequest, ClubStatus } from '@/features/clubs/types'
import { api, type QueryParams } from '@/services/api-client'
import type { PagedResult } from '@/types/common'

export interface AdminOverview {
  activeStudents: number
  deactivatedUsers: number
  moderators: number
  activeClubs: number
  pendingClubRequests: number
  publishedPosts: number
  publishedComments: number
  upcomingEvents: number
  draftAnnouncements: number
  largestClubs: { id: number; name: string; slug: string; memberCount: number; postCount: number }[]
}

export interface AdminUser {
  id: number
  fullName: string
  username: string
  avatarFileId: number | null
  email: string
  registrationNumber: string | null
  semester: number | null
  title: string | null
  isActive: boolean
  mustChangePassword: boolean
  createdAtUtc: string
  lastLoginAtUtc: string | null
  roles: Role[]
}

export const useOverview = () =>
  useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: () => api.get<AdminOverview>('/api/admin/overview'),
  })

export const useAdminUsers = (params: QueryParams, enabled = true) =>
  useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: ({ signal }) => api.get<PagedResult<AdminUser>>('/api/admin/users', params, signal),
    placeholderData: keepPreviousData,
    enabled,
  })

export const useUserSearch = (search: string) =>
  useQuery({
    queryKey: ['users', 'search', search],
    queryFn: () =>
      api.get<{ id: number; username: string; fullName: string }[]>('/api/users/search', {
        search,
      }),
    enabled: search.length > 0,
  })

export const useAdminClubs = (params: QueryParams) =>
  useQuery({
    queryKey: ['admin', 'clubs', params],
    queryFn: () => api.get<PagedResult<Club>>('/api/admin/clubs', params),
    placeholderData: keepPreviousData,
  })

export const useAdminRequests = (params: QueryParams) =>
  useQuery({
    queryKey: ['admin', 'requests', params],
    queryFn: () => api.get<PagedResult<ClubRequest>>('/api/admin/club-requests', params),
    placeholderData: keepPreviousData,
  })

// Administrative changes ripple into navigation, feeds and profiles
function useRefreshAll() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries()
}

export interface NewUser {
  fullName: string
  email: string
  role: 'Student' | 'Admin'
  registrationNumber: string | null
  semester: number | null
  title: string | null
  temporaryPassword: string
}

export function useUserActions() {
  const onSuccess = useRefreshAll()
  return {
    create: useMutation({
      mutationFn: (user: NewUser) => api.post<{ id: number }>('/api/admin/users', user),
      onSuccess,
    }),
    setStatus: useMutation({
      mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
        api.put(`/api/admin/users/${id}/status`, { isActive }),
      onSuccess,
    }),
    setAdmin: useMutation({
      mutationFn: ({ id, ...role }: { id: number; isAdmin: boolean; title: string | null }) =>
        api.put(`/api/admin/users/${id}/admin-role`, role),
      onSuccess,
    }),
  }
}

export function useClubAdminActions() {
  const onSuccess = useRefreshAll()
  return {
    save: useMutation({
      mutationFn: ({ id, ...values }: ClubValues & { id?: number }) => {
        const body = {
          ...values,
          categoryId: Number(values.categoryId),
          rules: values.rules.trim() || null,
        }
        return id ? api.put(`/api/admin/clubs/${id}`, body) : api.post('/api/admin/clubs', body)
      },
      onSuccess,
    }),
    setStatus: useMutation({
      mutationFn: ({ id, status }: { id: number; status: ClubStatus }) =>
        api.put(`/api/admin/clubs/${id}/status`, { status }),
      onSuccess,
    }),
    assignModerator: useMutation({
      mutationFn: ({ clubId, userId }: { clubId: number; userId: number }) =>
        api.put(`/api/admin/clubs/${clubId}/moderators/${userId}`),
      onSuccess,
    }),
    removeModerator: useMutation({
      mutationFn: ({ clubId, userId }: { clubId: number; userId: number }) =>
        api.delete(`/api/admin/clubs/${clubId}/moderators/${userId}`),
      onSuccess,
    }),
  }
}

export function useRequestActions() {
  const onSuccess = useRefreshAll()
  return {
    approve: useMutation({
      mutationFn: (id: number) => api.post(`/api/admin/club-requests/${id}/approve`),
      onSuccess,
    }),
    reject: useMutation({
      mutationFn: ({ id, reason }: { id: number; reason: string }) =>
        api.post(`/api/admin/club-requests/${id}/reject`, { reason }),
      onSuccess,
    }),
  }
}
