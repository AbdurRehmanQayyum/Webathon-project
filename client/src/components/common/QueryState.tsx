import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ListSkeleton } from '@/components/feedback/Skeleton'

interface QueryStateProps<T> {
  query: UseQueryResult<T>
  children: (data: T) => ReactNode
  skeleton?: ReactNode
  isEmpty?: (data: T) => boolean
  empty?: ReactNode
}

// One place for loading, error and empty handling
export function QueryState<T>({ query, children, skeleton, isEmpty, empty }: QueryStateProps<T>) {
  if (query.data === undefined) {
    return query.isError ? (
      <ErrorState error={query.error} onRetry={() => void query.refetch()} />
    ) : (
      (skeleton ?? <ListSkeleton />)
    )
  }

  return isEmpty?.(query.data) ? empty : children(query.data)
}
