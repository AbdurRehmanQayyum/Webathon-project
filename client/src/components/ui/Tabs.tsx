import { Tabs as Primitive } from 'radix-ui'
import type { ReactNode } from 'react'

interface TabItem {
  value: string
  label: string
  content: ReactNode
}

interface TabsProps {
  label: string
  value: string
  onChange: (value: string) => void
  items: TabItem[]
}

export function Tabs({ label, value, onChange, items }: TabsProps) {
  return (
    <Primitive.Root value={value} onValueChange={onChange}>
      <Primitive.List
        aria-label={label}
        className="mb-5 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-line"
      >
        {items.map((item) => (
          <Primitive.Trigger
            key={item.value}
            value={item.value}
            className="-mb-px border-b-2 border-transparent px-3 py-2.5 text-sm font-medium whitespace-nowrap text-muted transition-colors hover:text-fg data-[state=active]:border-primary data-[state=active]:text-fg"
          >
            {item.label}
          </Primitive.Trigger>
        ))}
      </Primitive.List>
      {items.map((item) => (
        <Primitive.Content key={item.value} value={item.value} className="animate-fade-in">
          {item.content}
        </Primitive.Content>
      ))}
    </Primitive.Root>
  )
}
