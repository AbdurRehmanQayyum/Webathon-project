import type { UseQueryResult } from '@tanstack/react-query'
import { QueryState } from '@/components/common/QueryState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import type { PagedResult } from '@/types/common'
import { AnnouncementCard } from './AnnouncementCard'
import type { Announcement } from './types'

interface AnnouncementResultsProps {
  query: UseQueryResult<PagedResult<Announcement>>
  onPage: (page: number) => void
}

export function AnnouncementResults({ query, onPage }: AnnouncementResultsProps) {
  return (
    <QueryState
      query={query}
      isEmpty={(data) => data.items.length === 0}
      empty={
        <EmptyState
          title="No announcements"
          description="Official notices will appear here when published."
        />
      }
    >
      {(data) => (
        <>
          <div className="grid gap-3">
            {data.items.map((announcement) => (
              <AnnouncementCard key={announcement.id} announcement={announcement} />
            ))}
          </div>
          <Pagination page={data.pageNumber} totalPages={data.totalPages} onChange={onPage} />
        </>
      )}
    </QueryState>
  )
}
