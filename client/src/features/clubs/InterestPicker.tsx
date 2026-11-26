import { Check } from 'lucide-react'
import { Skeleton } from '@/components/feedback/Skeleton'
import { cn } from '@/lib/cn'
import { useCategories } from './api'
import { ClubIcon } from './ClubIcon'

const MAX_INTERESTS = 8

// Interests only shape club suggestions and the "For you" feed
export function InterestPicker({
  value,
  onChange,
  className,
}: {
  value: number[]
  onChange: (ids: number[]) => void
  className?: string
}) {
  const categories = useCategories()

  if (categories.isPending) return <Skeleton className="h-20" />

  return (
    <div role="group" aria-label="Interests" className={cn('flex flex-wrap gap-2', className)}>
      {categories.data?.map((category) => {
        const selected = value.includes(category.id)
        return (
          <button
            key={category.id}
            type="button"
            aria-pressed={selected}
            disabled={!selected && value.length >= MAX_INTERESTS}
            onClick={() =>
              onChange(
                selected ? value.filter((id) => id !== category.id) : [...value, category.id],
              )
            }
            className={cn(
              'inline-flex items-center gap-2 rounded-full border py-1.5 pr-3 pl-1.5 text-sm font-medium transition-colors disabled:opacity-50',
              selected
                ? 'border-primary bg-selected text-selected-fg'
                : 'border-line text-muted hover:border-primary hover:text-fg',
            )}
          >
            <ClubIcon iconKey={category.iconKey} logoFileId={null} size="xs" />
            {category.name}
            {selected && <Check className="size-4" aria-hidden="true" />}
          </button>
        )
      })}
      {categories.isError && (
        <p className="text-sm text-muted">Interests could not be loaded. You can add them later.</p>
      )}
    </div>
  )
}
