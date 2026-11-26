import { createContext, useContext } from 'react'
import type { CurrentUser } from './types'

export const CurrentUserContext = createContext<CurrentUser | null>(null)

// Available inside protected routes
export function useCurrentUser() {
  const user = useContext(CurrentUserContext)
  if (!user) throw new Error('useCurrentUser requires an authenticated route')

  const isAdmin = user.roles.includes('Admin')
  return {
    user,
    isAdmin,
    canModerate: isAdmin || user.roles.includes('Moderator'),
  }
}
