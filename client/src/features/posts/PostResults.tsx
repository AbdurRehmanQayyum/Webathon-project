import { useLocation } from 'react-router'
import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Masonry } from '@/components/common/Masonry'
import { QueryState } from '@/components/common/QueryState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import type { PagedResult } from '@/types/common'
import { PostCard } from './PostCard'
import type { Post } from './types'

interface PostResultsProps {
  query: UseQueryResult<PagedResult<Post>>
  onPage: (page: number) => void
  emptyTitle: string
  emptyDescription: string
  emptyAction?: ReactNode
}

export function PostResults({ query, onPage, ...empty }: PostResultsProps) {
  const { search } = useLocation()

  return (
    <QueryState
      query={query}
      view={search}
      isEmpty={(data) => data.items.length === 0}
      empty={
        <EmptyState
          title={empty.emptyTitle}
          description={empty.emptyDescription}
          action={empty.emptyAction}
        />
      }
    >
      {(data) => (
        <>
          <Masonry columns="2xl:grid-cols-2">
            {data.items.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </Masonry>
          <Pagination page={data.pageNumber} totalPages={data.totalPages} onChange={onPage} />
        </>
      )}
    </QueryState>
  )
}
