import { createContext, useContext } from 'react'
import { permissions, type Permission } from './permissions'
import type { CurrentUser } from './types'

export const CurrentUserContext = createContext<CurrentUser | null>(null)

// Available inside protected routes
export function useCurrentUser() {
  const user = useContext(CurrentUserContext)
  if (!user) throw new Error('useCurrentUser requires an authenticated route')

  const isAdmin = user.roles.includes('Admin')
  const can = (permission: Permission) => isAdmin || user.permissions.includes(permission)
  const moderates =
    can(permissions.moderatePosts) ||
    can(permissions.moderateComments) ||
    can(permissions.pinPosts)

  return {
    user,
    isAdmin,
    can,
    canModerate: isAdmin || (moderates && user.moderatedClubs.length > 0),
  }
}
