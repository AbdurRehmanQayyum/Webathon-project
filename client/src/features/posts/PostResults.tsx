import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
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
  return (
    <QueryState
      query={query}
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
          <div className="grid gap-3">
            {data.items.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          <Pagination page={data.pageNumber} totalPages={data.totalPages} onChange={onPage} />
        </>
      )}
    </QueryState>
  )
}
