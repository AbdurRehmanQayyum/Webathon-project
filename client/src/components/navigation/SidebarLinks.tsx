import { motion } from 'motion/react'
import { useId } from 'react'
import { NavLink, useLocation } from 'react-router'
import { Tooltip } from '@/components/ui/Tooltip'
import { useClubs } from '@/features/clubs/api'
import { ClubIcon } from '@/features/clubs/ClubIcon'
import { cn } from '@/lib/cn'
import { primaryItems, useManagementItems, type NavItem } from './nav-items'

interface SidebarLinksProps {
  collapsed?: boolean
  onNavigate?: () => void
}

const linkStyle = (isActive: boolean, collapsed: boolean) =>
  cn(
    'relative flex h-10 items-center gap-3 rounded-control px-3 text-sm font-medium transition-colors',
    collapsed && 'justify-center px-0',
    isActive ? 'text-selected-fg' : 'text-muted hover:bg-surface-alt hover:text-fg',
  )

export function SidebarLinks({ collapsed = false, onNavigate }: SidebarLinksProps) {
  const indicatorId = useId()
  const { pathname } = useLocation()
  const management = useManagementItems()
  const clubs = useClubs({ joinedOnly: true, sort: 'Name', pageSize: 8 })

  const renderItem = ({ to, label, icon: Icon }: NavItem) => {
    const link = (
      <NavLink
        to={to}
        onClick={onNavigate}
        aria-label={collapsed ? label : undefined}
        className={({ isActive }) => linkStyle(isActive, collapsed)}
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <motion.span
                layoutId={indicatorId}
                // Animate between routes only, never while the sidebar resizes
                layoutDependency={pathname}
                className="absolute inset-0 rounded-control bg-selected"
                transition={{ duration: 0.2 }}
              />
            )}
            <Icon className="relative size-5 shrink-0" aria-hidden="true" />
            {!collapsed && <span className="relative animate-fade-in truncate">{label}</span>}
          </>
        )}
      </NavLink>
    )
    // The tooltip wraps a plain element, so the link keeps its own class function
    return (
      <li key={to}>
        {collapsed ? (
          <Tooltip label={label} side="right">
            <span className="block">{link}</span>
          </Tooltip>
        ) : (
          link
        )}
      </li>
    )
  }

  return (
    <nav aria-label="Main" className="grid gap-5">
      <ul className="grid gap-0.5">{primaryItems.map(renderItem)}</ul>
      {management.length > 0 && (
        <div className="border-t border-line pt-4">
          {!collapsed && <p className="mb-1 px-3 text-xs font-semibold text-muted">Manage</p>}
          <ul className="grid gap-0.5">{management.map(renderItem)}</ul>
        </div>
      )}
      {clubs.data && clubs.data.items.length > 0 && (
        <div className="border-t border-line pt-4">
          {!collapsed && (
            <p className="mb-1 px-3 text-xs font-semibold text-muted">Your clubs</p>
          )}
          <ul className="grid grid-cols-1 gap-0.5">
            {clubs.data.items.map((club) => {
              const link = (
                <NavLink
                  to={`/clubs/${club.slug}`}
                  onClick={onNavigate}
                  aria-label={collapsed ? club.name : undefined}
                  className={({ isActive }) =>
                    cn(linkStyle(isActive, collapsed), isActive && 'bg-selected')
                  }
                >
                  <ClubIcon
                    iconKey={club.category.iconKey}
                    logoFileId={club.logoFileId}
                    size="xs"
                  />
                  {!collapsed && <span className="animate-fade-in truncate">{club.name}</span>}
                </NavLink>
              )
              return (
                <li key={club.id}>
                  {collapsed ? (
                    <Tooltip label={club.name} side="right">
                      <span className="block">{link}</span>
                    </Tooltip>
                  ) : (
                    link
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </nav>
  )
}
