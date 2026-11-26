import { motion } from 'motion/react'
import { Tabs as Primitive } from 'radix-ui'
import { useId, type ReactNode } from 'react'

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
  const indicatorId = useId()

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
            className="relative px-3 py-2.5 text-sm font-medium whitespace-nowrap text-muted transition-colors hover:text-fg data-[state=active]:text-fg"
          >
            {item.label}
            {item.value === value && (
              <motion.span
                layoutId={indicatorId}
                layoutDependency={value}
                className="absolute inset-x-0 bottom-0 h-0.5 bg-primary"
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
          </Primitive.Trigger>
        ))}
      </Primitive.List>
      {items.map((item) => (
        <Primitive.Content key={item.value} value={item.value} className="animate-rise-in">
          {item.content}
        </Primitive.Content>
      ))}
    </Primitive.Root>
  )
}
