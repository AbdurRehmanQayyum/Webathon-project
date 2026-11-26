import { Plus } from 'lucide-react'
import { useCallback, useState } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { QueryState } from '@/components/common/QueryState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { SearchInput } from '@/components/ui/SearchInput'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Select } from '@/components/ui/Select'
import { useListParams } from '@/hooks/useListParams'
import { useCategories, useClubs } from './api'
import { ClubCard } from './ClubCard'
import { ClubRequestDialog } from './ClubRequestDialog'

const sortOptions = [
  { value: 'Popular', label: 'Most members' },
  { value: 'Name', label: 'Name' },
  { value: 'Newest', label: 'Newest' },
]

export function ClubsPage() {
  const { page, get, set } = useListParams()
  const [isRequesting, setRequesting] = useState(false)
  const categories = useCategories()
  const search = get('q')
  const category = get('category') || 'all'
  const sort = get('sort') || 'Popular'
  const scope = get('scope') === 'joined' ? 'joined' : 'all'
  const onSearch = useCallback((q: string) => set({ q }), [set])

  const clubs = useClubs({
    search,
    categoryId: category === 'all' ? null : category,
    joinedOnly: scope === 'joined',
    sort,
    pageNumber: page,
    pageSize: 12,
  })

  return (
    <>
      <PageHeader
        title="Clubs"
        description="Find your communities and join the discussion."
        actions={
          <>
            <ButtonLink to="/clubs/requests">My requests</ButtonLink>
            <Button
              variant="primary"
              icon={<Plus className="size-4" />}
              onClick={() => setRequesting(true)}
            >
              Request a club
            </Button>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <SegmentedControl
          label="Club membership"
          value={scope}
          onChange={(value) => set({ scope: value === 'all' ? null : value })}
          segments={[
            { value: 'all', label: 'All clubs' },
            { value: 'joined', label: 'Joined' },
          ]}
        />
        <SearchInput
          label="Search clubs"
          value={search}
          onSearch={onSearch}
          className="min-w-52 flex-1"
        />
        <Select
          aria-label="Category"
          value={category}
          onChange={(value) => set({ category: value === 'all' ? null : value })}
          options={[
            { value: 'all', label: 'All categories' },
            ...(categories.data ?? []).map((item) => ({
              value: String(item.id),
              label: item.name,
            })),
          ]}
          className="w-full sm:w-52"
        />
        <Select
          aria-label="Sort clubs"
          value={sort}
          onChange={(value) => set({ sort: value })}
          options={sortOptions}
          className="w-full sm:w-40"
        />
      </div>

      <QueryState
        query={clubs}
        isEmpty={(data) => data.items.length === 0}
        empty={
          <EmptyState
            title={scope === 'joined' ? 'No joined clubs match' : 'No clubs match'}
            description="Adjust the filters, or request a club for your topic."
          />
        }
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

      <ClubRequestDialog open={isRequesting} onClose={() => setRequesting(false)} />
    </>
  )
}
