import type { LucideIcon } from 'lucide-react'
import { DropdownMenu } from 'radix-ui'
import type { ReactElement, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { menuItemStyles, popupStyles } from './input-styles'

export interface MenuItem {
  label: string
  icon: LucideIcon
  onSelect: () => void
  danger?: boolean
}

interface MenuProps {
  trigger: ReactElement
  items: MenuItem[]
  header?: ReactNode
}

export function Menu({ trigger, items, header }: MenuProps) {
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          collisionPadding={8}
          className={cn(popupStyles, 'min-w-48 p-1')}
        >
          {header && <div className="border-b border-line px-2.5 py-2">{header}</div>}
          {items.map(({ label, icon: Icon, onSelect, danger }) => (
            <DropdownMenu.Item
              key={label}
              onSelect={onSelect}
              className={cn(menuItemStyles, danger && 'text-danger-fg')}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
