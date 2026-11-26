import { Tooltip as Primitive } from 'radix-ui'
import type { ReactElement } from 'react'

export function Tooltip({ label, children }: { label: string; children: ReactElement }) {
  return (
    <Primitive.Root>
      <Primitive.Trigger asChild>{children}</Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Content
          sideOffset={6}
          className="z-[60] rounded-md bg-fg px-2 py-1 text-xs font-medium text-bg shadow-pop animate-fade-in pointer-coarse:hidden"
        >
          {label}
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  )
}
