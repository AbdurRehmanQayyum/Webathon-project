import { useCurrentUser } from '@/features/auth/current-user'
import { permissions, type Permission } from '@/features/auth/permissions'

export interface AdminSection {
  path: string
  label: string
  anyOf: Permission[]
}

export const adminSections: AdminSection[] = [
  { path: '', label: 'Overview', anyOf: [permissions.viewDashboard] },
  { path: 'requests', label: 'Club requests', anyOf: [permissions.reviewRequests] },
  { path: 'clubs', label: 'Clubs', anyOf: [permissions.manageClubs, permissions.assignModerators] },
  { path: 'users', label: 'Users', anyOf: [permissions.manageUsers] },
  { path: 'announcements', label: 'Announcements', anyOf: [permissions.manageAnnouncements] },
  { path: 'events', label: 'Events', anyOf: [permissions.manageEvents] },
  { path: 'permissions', label: 'Roles & permissions', anyOf: [permissions.managePermissions] },
]

export function useAdminSections() {
  const { can } = useCurrentUser()
  return adminSections.filter((section) => section.anyOf.some(can))
}
