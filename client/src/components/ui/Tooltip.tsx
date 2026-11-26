import { Tooltip as Primitive } from 'radix-ui'
import type { ReactElement } from 'react'

interface TooltipProps {
  label: string
  children: ReactElement
  side?: 'top' | 'right' | 'bottom' | 'left'
}

export function Tooltip({ label, children, side }: TooltipProps) {
  return (
    <Primitive.Root>
      <Primitive.Trigger asChild>{children}</Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Content
          side={side}
          sideOffset={6}
          className="z-[60] rounded-md bg-fg px-2 py-1 text-xs font-medium text-bg shadow-pop animate-fade-in data-[state=closed]:animate-fade-out pointer-coarse:hidden"
        >
          {label}
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  )
}
