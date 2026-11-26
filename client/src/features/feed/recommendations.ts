import { useQuery } from '@tanstack/react-query'
import type { Club } from '@/features/clubs/types'
import { api } from '@/services/api-client'

// Kept under "clubs" and "posts" so joining or posting refreshes them
export const useRecommendedClubs = () =>
  useQuery({
    queryKey: ['clubs', 'recommended'],
    queryFn: () => api.get<{ club: Club; reason: string }[]>('/api/recommendations/clubs'),
  })

export const usePopularTags = () =>
  useQuery({
    queryKey: ['posts', 'tags'],
    queryFn: () => api.get<{ name: string; postCount: number }[]>('/api/tags'),
  })
