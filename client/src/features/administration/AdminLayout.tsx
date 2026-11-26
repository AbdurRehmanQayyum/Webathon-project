import { motion } from 'motion/react'
import { useEffect, useId, useRef } from 'react'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router'
import { AccessDeniedPage } from '@/features/auth/StatusPages'
import { cn } from '@/lib/cn'
import { useAdminSections } from './sections'

export function AdminLayout() {
  const sections = useAdminSections()
  const { pathname } = useLocation()
  const first = sections[0]
  const current = pathname.split('/')[2] ?? ''
  const navRef = useRef<HTMLElement>(null)
  const indicatorId = useId()

  // On narrow screens the open section is brought into view
  useEffect(() => {
    navRef.current
      ?.querySelector('[aria-current="page"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [pathname])

  if (!first) return <AccessDeniedPage />
  const isAllowed = sections.some((section) => section.path === current)
  // The overview is optional, so the entry route may forward to another section
  if (!isAllowed && current === '') return <Navigate to={`/admin/${first.path}`} replace />

  return (
    <>
      <nav
        ref={navRef}
        aria-label="Administration"
        className="no-scrollbar mb-6 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-line"
      >
        {sections.map((section) => (
          <NavLink
            key={section.path}
            to={section.path ? `/admin/${section.path}` : '/admin'}
            end
            className={({ isActive }) =>
              cn(
                'relative px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
                isActive ? 'text-fg' : 'text-muted hover:text-fg',
              )
            }
          >
            {({ isActive }) => (
              <>
                {section.label}
                {isActive && (
                  <motion.span
                    layoutId={indicatorId}
                    layoutDependency={pathname}
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-primary"
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      {isAllowed ? <Outlet /> : <AccessDeniedPage />}
    </>
  )
}
