import { useCallback } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { QueryState } from '@/components/common/QueryState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { SearchInput } from '@/components/ui/SearchInput'
import { Select } from '@/components/ui/Select'
import { Tabs } from '@/components/ui/Tabs'
import { useListParams } from '@/hooks/useListParams'
import { useModeratedClubs, type ModeratedClub } from './api'
import { CommentQueue } from './CommentQueue'
import { PostQueue } from './PostQueue'

export function ModerationPage() {
  const clubs = useModeratedClubs()

  return (
    <>
      <PageHeader
        title="Moderation"
        description="Manage posts and comments in the clubs assigned to you."
      />
      <QueryState
        query={clubs}
        isEmpty={(data) => data.length === 0}
        empty={
          <EmptyState
            title="No clubs assigned"
            description="An administrator assigns moderators to clubs."
          />
        }
      >
        {(data) => <ModerationWorkspace clubs={data} />}
      </QueryState>
    </>
  )
}

function ModerationWorkspace({ clubs }: { clubs: ModeratedClub[] }) {
  const { get, set } = useListParams()
  const selected = clubs.find((club) => String(club.id) === get('club')) ?? clubs[0]
  const tab = get('tab') || 'posts'
  const status = get('status') || 'all'
  const search = get('q')
  const onSearch = useCallback((q: string) => set({ q }), [set])

  if (!selected) return null
  const filters = { search, status: status === 'all' ? null : status }

  const summary = [
    ['Members', selected.memberCount],
    ['Published', selected.publishedPostCount],
    ['Pinned', selected.pinnedPostCount],
    ['Removed', selected.removedPostCount],
  ] as const

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Select
          aria-label="Club"
          value={String(selected.id)}
          onChange={(club) => set({ club, status: null, q: null })}
          options={clubs.map((club) => ({ value: String(club.id), label: club.name }))}
          className="w-full sm:w-72"
        />
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {summary.map(([label, value]) => (
            <div key={label} className="flex items-baseline gap-1.5">
              <dt className="text-muted">{label}</dt>
              <dd className="font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <SearchInput
          label="Search content or author"
          value={search}
          onSearch={onSearch}
          className="min-w-52 flex-1"
        />
        <Select
          aria-label="Status"
          value={status}
          onChange={(value) => set({ status: value === 'all' ? null : value })}
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'Published', label: 'Published' },
            { value: 'Removed', label: 'Removed' },
          ]}
          className="w-full sm:w-44"
        />
      </div>
      <Tabs
        label="Content type"
        value={tab}
        onChange={(value) => set({ tab: value === 'posts' ? null : value })}
        items={[
          {
            value: 'posts',
            label: 'Posts',
            content: <PostQueue clubId={selected.id} filters={filters} />,
          },
          {
            value: 'comments',
            label: 'Comments',
            content: <CommentQueue clubId={selected.id} filters={filters} />,
          },
        ]}
      />
    </>
  )
}
