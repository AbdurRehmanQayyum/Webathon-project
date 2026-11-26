import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, ApiError, resetCsrfToken } from '@/services/api-client'
import type { LoginValues, RegisterPayload } from './schemas'
import type { CurrentUser } from './types'

export const sessionKey = ['session'] as const

async function fetchSession() {
  try {
    return await api.get<CurrentUser>('/api/auth/me')
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

export const useSession = () =>
  useQuery({ queryKey: sessionKey, queryFn: fetchSession, staleTime: 60_000 })

// A new identity starts with an empty cache and a fresh CSRF token
function useStartSession() {
  const queryClient = useQueryClient()
  return (user: CurrentUser | null) => {
    resetCsrfToken()
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== sessionKey[0] })
    queryClient.setQueryData(sessionKey, user)
  }
}

export function useLogin() {
  const startSession = useStartSession()
  return useMutation({
    mutationFn: (values: LoginValues) => api.post<CurrentUser>('/api/auth/login', values),
    onSuccess: startSession,
  })
}

export function useRegister() {
  const startSession = useStartSession()
  return useMutation({
    mutationFn: (values: RegisterPayload) => api.post<CurrentUser>('/api/auth/register', values),
    onSuccess: startSession,
  })
}

export function useLogout() {
  const startSession = useStartSession()
  return useMutation({
    mutationFn: () => api.post('/api/auth/logout'),
    onSuccess: () => startSession(null),
  })
}

export const useChangePassword = () =>
  useMutation({
    mutationFn: (values: { currentPassword: string; newPassword: string }) =>
      api.post('/api/auth/change-password', values),
    onSuccess: resetCsrfToken,
  })
