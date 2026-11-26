import { Pin, PinOff, RotateCcw, ShieldX } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { QueryState } from '@/components/common/QueryState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useToast } from '@/components/feedback/toast-context'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DataTable } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { useListParams } from '@/hooks/useListParams'
import { formatDate } from '@/lib/format'
import type { QueryParams } from '@/services/api-client'
import { useModerationActions, useModerationPosts } from './api'

export function PostQueue({ clubId, filters }: { clubId: number; filters: QueryParams }) {
  const { page, set } = useListParams()
  const posts = useModerationPosts(clubId, { ...filters, pageNumber: page, pageSize: 10 })
  const actions = useModerationActions()
  const toast = useToast()
  const [removingId, setRemovingId] = useState<number | null>(null)

  const report = (message: string) => ({
    onSuccess: () => toast.success(message),
    onError: toast.error,
  })

  const { search } = useLocation()
  return (
    <QueryState
      query={posts}
      view={search}
      isEmpty={(data) => data.items.length === 0}
      empty={<EmptyState title="No posts match" description="Adjust the filters to see more." />}
    >
      {(data) => (
        <>
          <DataTable
            caption="Club posts"
            rows={data.items}
            rowKey={(post) => post.id}
            columns={[
              {
                header: 'Post',
                cell: (post) => (
                  <Link to={`/posts/${post.id}`} className="font-medium hover:text-link">
                    {post.title}
                  </Link>
                ),
              },
              { header: 'Author', cell: (post) => post.author.fullName },
              { header: 'Posted', cell: (post) => formatDate(post.createdAtUtc) },
              {
                header: 'Status',
                cell: (post) => (
                  <span className="inline-flex flex-wrap gap-1">
                    <Badge tone={post.status === 'Published' ? 'success' : 'danger'}>
                      {post.status}
                    </Badge>
                    {post.isPinned && <Badge tone="primary">Pinned</Badge>}
                  </span>
                ),
              },
            ]}
            actions={(post) =>
              post.status === 'Published' ? (
                <>
                  <Button
                    size="sm"
                    icon={
                      post.isPinned ? <PinOff className="size-4" /> : <Pin className="size-4" />
                    }
                    disabled={actions.setPinned.isPending}
                    onClick={() =>
                      actions.setPinned.mutate(
                        { postId: post.id, isPinned: !post.isPinned },
                        report(post.isPinned ? 'Post unpinned' : 'Post pinned'),
                      )
                    }
                  >
                    {post.isPinned ? 'Unpin' : 'Pin'}
                  </Button>
                  <Button
                    size="sm"
                    icon={<ShieldX className="size-4" />}
                    onClick={() => setRemovingId(post.id)}
                  >
                    Remove
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  icon={<RotateCcw className="size-4" />}
                  disabled={actions.restorePost.isPending}
                  onClick={() => actions.restorePost.mutate(post.id, report('Post restored'))}
                >
                  Restore
                </Button>
              )
            }
          />
          <Pagination
            page={data.pageNumber}
            totalPages={data.totalPages}
            onChange={(next) => set({ page: next })}
          />
          <ConfirmDialog
            open={removingId !== null}
            onClose={() => setRemovingId(null)}
            title="Remove this post?"
            description="Students will no longer see it. The author is notified."
            confirmLabel="Remove post"
            danger
            reason={{ label: 'Reason', required: false }}
            loading={actions.removePost.isPending}
            onConfirm={(reason) => {
              if (removingId === null) return
              actions.removePost.mutate(
                { postId: removingId, reason: reason || null },
                {
                  onSuccess: () => {
                    setRemovingId(null)
                    toast.success('Post removed')
                  },
                  onError: toast.error,
                },
              )
            }}
          />
        </>
      )}
    </QueryState>
  )
}
