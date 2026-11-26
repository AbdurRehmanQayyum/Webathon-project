import { CalendarDays, House, Menu, Plus, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router'
import { Drawer } from '@/components/ui/Drawer'
import { cn } from '@/lib/cn'
import { SidebarLinks } from './SidebarLinks'

const itemStyle =
  'flex h-14 flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-medium text-muted'

const tab = ({ isActive }: { isActive: boolean }) => cn(itemStyle, isActive && 'text-selected-fg')

export function MobileNavigation() {
  const [isOpen, setOpen] = useState(false)

  return (
    <>
      <nav
        aria-label="Primary"
        className="safe-bottom fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface lg:hidden"
      >
        <NavLink to="/" end className={tab}>
          <House className="size-5" aria-hidden="true" />
          Home
        </NavLink>
        <NavLink to="/clubs" className={tab}>
          <UsersRound className="size-5" aria-hidden="true" />
          Clubs
        </NavLink>
        <NavLink to="/posts/new" className={tab} aria-label="Create post">
          <span className="grid size-10 place-items-center rounded-full bg-primary text-on-primary transition-transform active:scale-90">
            <Plus className="size-5" aria-hidden="true" />
          </span>
        </NavLink>
        <NavLink to="/events" className={tab}>
          <CalendarDays className="size-5" aria-hidden="true" />
          Events
        </NavLink>
        <button
          type="button"
          className={itemStyle}
          aria-expanded={isOpen}
          onClick={() => setOpen(true)}
        >
          <Menu className="size-5" aria-hidden="true" />
          More
        </button>
      </nav>
      <Drawer open={isOpen} onClose={() => setOpen(false)} title="Campus Connect">
        <SidebarLinks onNavigate={() => setOpen(false)} />
      </Drawer>
    </>
  )
}
