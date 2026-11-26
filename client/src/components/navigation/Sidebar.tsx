import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useState } from 'react'
import { Logo } from '@/components/brand/Logo'
import { IconButton } from '@/components/ui/IconButton'
import { cn } from '@/lib/cn'
import { SidebarLinks } from './SidebarLinks'

const STORAGE_KEY = 'campus-connect-sidebar'

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'collapsed',
  )
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose

  const toggle = () => {
    localStorage.setItem(STORAGE_KEY, collapsed ? 'expanded' : 'collapsed')
    setCollapsed(!collapsed)
  }

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-250 lg:flex',
        collapsed ? 'w-17' : 'w-64',
      )}
    >
      <div
        className={cn(
          'flex h-16 shrink-0 items-center px-4',
          collapsed ? 'justify-center px-0' : 'justify-between',
        )}
      >
        <Logo compact={collapsed} />
      </div>
      <div className="flex-1 overflow-x-hidden overflow-y-auto px-3 py-2">
        <SidebarLinks collapsed={collapsed} />
      </div>
      <div className={cn('border-t border-line p-3', collapsed && 'flex justify-center')}>
        <IconButton
          label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          icon={<Icon className="size-5" />}
          onClick={toggle}
        />
      </div>
    </aside>
  )
}
