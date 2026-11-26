import { PenLine } from 'lucide-react'
import { useCallback } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { ButtonLink } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/SearchInput'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Select } from '@/components/ui/Select'
import { useCurrentUser } from '@/features/auth/current-user'
import { useClubs } from '@/features/clubs/api'
import { PostList } from '@/features/posts/PostList'
import { useListParams } from '@/hooks/useListParams'
import { ContextSidebar } from './ContextSidebar'

export function HomePage() {
  const { user } = useCurrentUser()
  const { get, set } = useListParams()
  const scope = get('scope') === 'all' ? 'all' : 'joined'
  const sort = get('sort') === 'Popular' ? 'Popular' : 'Recent'
  const club = get('club') || 'any'
  const search = get('q')
  const onSearch = useCallback((q: string) => set({ q }), [set])
  const clubs = useClubs({ joinedOnly: scope === 'joined', sort: 'Name', pageSize: 100 })
  const hasFilters = search !== '' || club !== 'any'

  return (
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_19rem]">
      <div className="mx-auto w-full max-w-3xl">
        <PageHeader
          title={`Hello, ${user.fullName.replace(/^Dr\.\s+/, '').split(' ')[0]}`}
          description="The latest from your department community."
          actions={
            <ButtonLink to="/posts/new" variant="primary" icon={<PenLine className="size-4" />}>
              Create post
            </ButtonLink>
          }
        />
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <SegmentedControl
            label="Feed"
            value={scope}
            onChange={(value) => set({ scope: value === 'joined' ? null : value, club: null })}
            segments={[
              { value: 'joined', label: 'My clubs' },
              { value: 'all', label: 'All clubs' },
            ]}
          />
          <SegmentedControl
            label="Sort posts"
            value={sort}
            onChange={(value) => set({ sort: value === 'Recent' ? null : value })}
            segments={[
              { value: 'Recent', label: 'Recent' },
              { value: 'Popular', label: 'Popular' },
            ]}
          />
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          <SearchInput
            label="Search the feed"
            value={search}
            onSearch={onSearch}
            className="min-w-52 flex-1"
          />
          <Select
            aria-label="Filter by club"
            value={club}
            onChange={(value) => set({ club: value === 'any' ? null : value })}
            options={[
              { value: 'any', label: 'Every club' },
              ...(clubs.data?.items ?? []).map((item) => ({
                value: String(item.id),
                label: item.name,
              })),
            ]}
            className="w-full sm:w-60"
          />
        </div>
        <PostList
          params={{
            joinedOnly: scope === 'joined',
            clubId: club === 'any' ? null : club,
            sort,
            search,
          }}
          emptyTitle={hasFilters ? 'No posts match' : 'Your feed is empty'}
          emptyDescription={
            hasFilters
              ? 'Try different words or another club.'
              : 'Join clubs to see their discussions here.'
          }
          emptyAction={
            !hasFilters && (
              <ButtonLink to="/clubs" variant="primary">
                Browse clubs
              </ButtonLink>
            )
          }
        />
      </div>
      <ContextSidebar />
    </div>
  )
}
