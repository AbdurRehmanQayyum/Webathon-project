import { motion } from 'motion/react'
import { ToggleGroup } from 'radix-ui'
import { useId } from 'react'
import { cn } from '@/lib/cn'

interface Segment<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  label: string
  value: T
  onChange: (value: T) => void
  segments: Segment<T>[]
  className?: string
}

export function SegmentedControl<T extends string>({
  label,
  value,
  onChange,
  segments,
  className,
}: SegmentedControlProps<T>) {
  const indicatorId = useId()

  return (
    <ToggleGroup.Root
      type="single"
      aria-label={label}
      value={value}
      onValueChange={(next) => next && onChange(next as T)}
      className={cn('inline-flex rounded-control bg-surface-alt p-1', className)}
    >
      {segments.map((segment) => (
        <ToggleGroup.Item
          key={segment.value}
          value={segment.value}
          className="relative flex-1 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap text-muted transition-colors hover:text-fg data-[state=on]:text-fg pointer-coarse:py-2"
        >
          {segment.value === value && (
            <motion.span
              layoutId={indicatorId}
              className="absolute inset-0 rounded-md bg-surface shadow-card"
              transition={{ duration: 0.2 }}
            />
          )}
          <span className="relative">{segment.label}</span>
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  )
}
