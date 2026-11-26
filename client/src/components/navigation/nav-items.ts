import {
  Bookmark,
  CalendarDays,
  House,
  Megaphone,
  ShieldCheck,
  UsersRound,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { useCurrentUser } from '@/features/auth/current-user'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export const primaryItems: NavItem[] = [
  { to: '/', label: 'Home', icon: House },
  { to: '/clubs', label: 'Clubs', icon: UsersRound },
  { to: '/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/events', label: 'Events', icon: CalendarDays },
  { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
]

// Role-based navigation; the API enforces the same rules
export function useManagementItems() {
  const { isAdmin, canModerate } = useCurrentUser()
  const items: NavItem[] = []
  if (canModerate) items.push({ to: '/moderation', label: 'Moderation', icon: ShieldCheck })
  if (isAdmin) items.push({ to: '/admin', label: 'Administration', icon: Wrench })
  return items
}
