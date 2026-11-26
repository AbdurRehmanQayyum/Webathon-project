import type { UseQueryResult } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ListSkeleton } from '@/components/feedback/Skeleton'
import { cn } from '@/lib/cn'
import { Reveal } from './Reveal'

interface QueryStateProps<T> {
  query: UseQueryResult<T>
  children: (data: T) => ReactNode
  skeleton?: ReactNode
  isEmpty?: (data: T) => boolean
  empty?: ReactNode
  // Identifies the filter, sort or page being shown, so a change animates in
  view?: string
  className?: string
}

// One place for loading, error and empty handling
export function QueryState<T>({
  query,
  children,
  skeleton,
  isEmpty,
  empty,
  view,
  className,
}: QueryStateProps<T>) {
  // Old results stay on screen, dimmed, until the next view has arrived
  const [shown, setShown] = useState(view)
  if (!query.isPlaceholderData && shown !== view) setShown(view)

  if (query.data === undefined) {
    return query.isError ? (
      <Reveal>
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </Reveal>
    ) : (
      // Fast responses finish before the placeholder becomes visible
      <div className="animate-appear-late">{skeleton ?? <ListSkeleton />}</div>
    )
  }

  return (
    <Reveal
      when={shown}
      className={cn(
        'transition-opacity duration-200',
        query.isPlaceholderData && 'opacity-60',
        className,
      )}
    >
      {isEmpty?.(query.data) ? empty : children(query.data)}
    </Reveal>
  )
}
