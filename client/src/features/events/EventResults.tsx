import type { UseQueryResult } from '@tanstack/react-query'
import { QueryState } from '@/components/common/QueryState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import type { PagedResult } from '@/types/common'
import { EventCard } from './EventCard'
import type { DepartmentEvent } from './types'

interface EventResultsProps {
  query: UseQueryResult<PagedResult<DepartmentEvent>>
  onPage: (page: number) => void
  emptyTitle: string
}

export function EventResults({ query, onPage, emptyTitle }: EventResultsProps) {
  return (
    <QueryState
      query={query}
      isEmpty={(data) => data.items.length === 0}
      empty={<EmptyState title={emptyTitle} description="Department events will be listed here." />}
    >
      {(data) => (
        <>
          <div className="grid gap-3">
            {data.items.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          <Pagination page={data.pageNumber} totalPages={data.totalPages} onChange={onPage} />
        </>
      )}
    </QueryState>
  )
}
