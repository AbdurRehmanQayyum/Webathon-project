import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Role } from '@/features/auth/types'
import { api } from '@/services/api-client'
import type { ClubReference } from '@/types/common'

export interface Profile {
  id: number
  fullName: string
  username: string
  avatarFileId: number | null
  semester: number | null
  title: string | null
  bio: string | null
  createdAtUtc: string
  roles: Role[]
  clubs: ClubReference[]
  postCount: number
  commentCount: number
}

export const useProfile = (userId: number) =>
  useQuery({
    queryKey: ['users', userId],
    queryFn: () => api.get<Profile>(`/api/users/${userId}`),
  })

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: {
      fullName: string
      semester: number | null
      bio: string | null
      interestIds: number[]
    }) => api.put('/api/users/me', values),
    onSuccess: () =>
      Promise.all(
        ['session', 'users', 'posts', 'comments', 'clubs'].map((key) =>
          queryClient.invalidateQueries({ queryKey: [key] }),
        ),
      ),
  })
}
