import type { ReactNode } from 'react'
import { useListParams } from '@/hooks/useListParams'
import type { QueryParams } from '@/services/api-client'
import { usePosts } from './api'
import { PostResults } from './PostResults'

interface PostListProps {
  params: QueryParams
  emptyTitle: string
  emptyDescription: string
  emptyAction?: ReactNode
}

export function PostList({ params, ...empty }: PostListProps) {
  const { page, set } = useListParams()
  const posts = usePosts({ ...params, pageNumber: page, pageSize: 10 })

  return <PostResults query={posts} onPage={(next) => set({ page: next })} {...empty} />
}
