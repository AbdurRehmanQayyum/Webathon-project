import { useCallback } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { QueryState } from '@/components/common/QueryState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { SearchInput } from '@/components/ui/SearchInput'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useAnnouncements } from '@/features/announcements/api'
import { AnnouncementResults } from '@/features/announcements/AnnouncementResults'
import { useClubs } from '@/features/clubs/api'
import { ClubCard } from '@/features/clubs/ClubCard'
import { useEvents } from '@/features/events/api'
import { EventResults } from '@/features/events/EventResults'
import { PostList } from '@/features/posts/PostList'
import { useListParams } from '@/hooks/useListParams'

const scopes = ['posts', 'clubs', 'announcements', 'events'] as const
type Scope = (typeof scopes)[number]

export function SearchPage() {
  const { get, set } = useListParams()
  const query = get('q')
  const scope: Scope = scopes.find((value) => value === get('in')) ?? 'posts'
  const onSearch = useCallback((q: string) => set({ q }), [set])

  return (
    <>
      <PageHeader title="Search" description="Find posts, clubs, announcements and events." />
      <SearchInput label="Search Campus Connect" value={query} onSearch={onSearch} />
      <SegmentedControl
        label="Search in"
        value={scope}
        onChange={(value) => set({ in: value === 'posts' ? null : value })}
        segments={[
          { value: 'posts', label: 'Posts' },
          { value: 'clubs', label: 'Clubs' },
          { value: 'announcements', label: 'Notices' },
          { value: 'events', label: 'Events' },
        ]}
        className="my-4 w-full sm:w-120"
      />
      {!query && (
        <EmptyState
          title="What are you looking for?"
          description="Type a topic, club name or venue."
        />
      )}
      {query && scope === 'posts' && (
        <PostList
          params={{ search: query }}
          emptyTitle="No posts found"
          emptyDescription="Try a different search."
        />
      )}
      {query && scope === 'clubs' && <ClubMatches search={query} />}
      {query && scope === 'announcements' && <AnnouncementMatches search={query} />}
      {query && scope === 'events' && <EventMatches search={query} />}
    </>
  )
}

function ClubMatches({ search }: { search: string }) {
  const { page, set } = useListParams()
  const clubs = useClubs({ search, pageNumber: page, pageSize: 8 })

  return (
    <QueryState
      query={clubs}
      view={`${search}:${page}`}
      isEmpty={(data) => data.items.length === 0}
      empty={<EmptyState title="No clubs found" description="Try a different search." />}
    >
      {(data) => (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.items.map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>
          <Pagination
            page={data.pageNumber}
            totalPages={data.totalPages}
            onChange={(next) => set({ page: next })}
          />
        </>
      )}
    </QueryState>
  )
}

function AnnouncementMatches({ search }: { search: string }) {
  const { page, set } = useListParams()
  const announcements = useAnnouncements({ search, pageNumber: page, pageSize: 8 })

  return <AnnouncementResults query={announcements} onPage={(next) => set({ page: next })} />
}

function EventMatches({ search }: { search: string }) {
  const { page, set } = useListParams()
  const events = useEvents({ search, pageNumber: page, pageSize: 8 })

  return (
    <EventResults
      query={events}
      onPage={(next) => set({ page: next })}
      emptyTitle="No events found"
    />
  )
}
