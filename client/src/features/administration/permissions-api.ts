import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Role } from '@/features/auth/types'
import { api } from '@/services/api-client'

export interface PermissionDefinition {
  key: string
  group: string
  label: string
  description: string
  adminOnly: boolean
}

export interface RolePermissions {
  roleId: number
  role: Role
  isLocked: boolean
  permissions: string[]
}

export interface PermissionMatrix {
  permissions: PermissionDefinition[]
  roles: RolePermissions[]
}

export const usePermissionMatrix = () =>
  useQuery({
    queryKey: ['admin', 'permissions'],
    queryFn: () => api.get<PermissionMatrix>('/api/admin/permissions'),
  })

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ roleId, permissions }: { roleId: number; permissions: string[] }) =>
      api.put(`/api/admin/permissions/${roleId}`, { permissions }),
    onSuccess: () => queryClient.invalidateQueries(),
  })
}
