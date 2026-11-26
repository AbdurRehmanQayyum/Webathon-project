import { NavLink, Outlet } from 'react-router'
import { cn } from '@/lib/cn'

const sections = [
  { to: '/admin', label: 'Overview' },
  { to: '/admin/requests', label: 'Club requests' },
  { to: '/admin/clubs', label: 'Clubs' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/announcements', label: 'Announcements' },
  { to: '/admin/events', label: 'Events' },
]

export function AdminLayout() {
  return (
    <>
      <nav
        aria-label="Administration"
        className="mb-6 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-line"
      >
        {sections.map((section) => (
          <NavLink
            key={section.to}
            to={section.to}
            end={section.to === '/admin'}
            className={({ isActive }) =>
              cn(
                '-mb-px border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
                isActive ? 'border-primary text-fg' : 'border-transparent text-muted hover:text-fg',
              )
            }
          >
            {section.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </>
  )
}
