import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api-client'

export type FileKind = 'Image' | 'Document' | 'Audio' | 'Video'

export interface FileType {
  extension: string
  kind: FileKind
  maxSize: number
}

export interface FilePolicy {
  types: FileType[]
  maxAttachments: number
  quotaBytes: number
  usedBytes: number
}

const policyKey = ['files', 'policy'] as const
const contentKeys = [
  'posts',
  'announcements',
  'events',
  'clubs',
  'session',
  'users',
  'moderation',
  'admin',
]

export const useFilePolicy = () =>
  useQuery({ queryKey: policyKey, queryFn: () => api.get<FilePolicy>('/api/files/policy') })

// Files appear inside many views, so every content cache is refreshed
export function useRefreshFiles() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(
      [policyKey[0], ...contentKeys].map((key) =>
        queryClient.invalidateQueries({ queryKey: [key] }),
      ),
    )
}

export function useDeleteFile() {
  const refresh = useRefreshFiles()
  return useMutation({
    mutationFn: (fileId: number) => api.delete(`/api/files/${fileId}`),
    onSuccess: refresh,
  })
}
