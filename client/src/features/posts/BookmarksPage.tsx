import { useCallback } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { ButtonLink } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/SearchInput'
import { useListParams } from '@/hooks/useListParams'
import { useBookmarkedPosts } from './api'
import { PostResults } from './PostResults'

export function BookmarksPage() {
  const { page, get, set } = useListParams()
  const search = get('q')
  const onSearch = useCallback((q: string) => set({ q }), [set])
  const bookmarks = useBookmarkedPosts({ search, pageNumber: page, pageSize: 10 })

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Bookmarks" description="Posts you saved for later." />
      <SearchInput label="Search bookmarks" value={search} onSearch={onSearch} className="mb-4" />
      <PostResults
        query={bookmarks}
        onPage={(next) => set({ page: next })}
        emptyTitle={search ? 'No bookmarks match' : 'Nothing saved yet'}
        emptyDescription="Use the bookmark icon on any post to keep it here."
        emptyAction={<ButtonLink to="/">Browse the feed</ButtonLink>}
      />
    </div>
  )
}
