import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'

interface StepIndicatorProps {
  titles: string[]
  current: number
  // Only earlier steps can be revisited
  onSelect: (step: number) => void
}

export function StepIndicator({ titles, current, onSelect }: StepIndicatorProps) {
  return (
    <ol aria-label="Progress" className="grid grid-flow-col auto-cols-fr">
      {titles.map((title, index) => {
        const isDone = index < current
        const isCurrent = index === current
        return (
          <li key={title} className="relative grid justify-items-center">
            {/* Runs between neighbouring circles, stopping short of both */}
            {index > 0 && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute top-4 right-[calc(50%_+_1.5rem)] left-[calc(-50%_+_1.5rem)] h-0.5 -translate-y-1/2 rounded-full transition-colors',
                  isDone || isCurrent ? 'bg-primary' : 'bg-line',
                )}
              />
            )}
            <button
              type="button"
              disabled={!isDone}
              onClick={() => onSelect(index)}
              aria-current={isCurrent ? 'step' : undefined}
              className="relative grid justify-items-center gap-1.5 rounded-control px-1 enabled:cursor-pointer"
            >
              <span
                className={cn(
                  'grid size-8 place-items-center rounded-full border-2 text-sm font-semibold transition-colors',
                  isDone && 'border-primary bg-primary text-on-primary',
                  isCurrent && 'border-primary bg-surface text-link',
                  !isDone && !isCurrent && 'border-line bg-surface text-muted',
                )}
              >
                {isDone ? <Check className="size-4" aria-hidden="true" /> : index + 1}
              </span>
              <span className={cn('text-xs font-medium', isCurrent ? 'text-fg' : 'text-muted')}>
                {title}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
