import { RotateCcw, ShieldX } from 'lucide-react'
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
import { useModerationActions, useModerationComments } from './api'

export function CommentQueue({ clubId, filters }: { clubId: number; filters: QueryParams }) {
  const { page, set } = useListParams()
  const comments = useModerationComments(clubId, { ...filters, pageNumber: page, pageSize: 10 })
  const actions = useModerationActions()
  const toast = useToast()
  const [removingId, setRemovingId] = useState<number | null>(null)

  const { search } = useLocation()
  return (
    <QueryState
      query={comments}
      view={search}
      isEmpty={(data) => data.items.length === 0}
      empty={<EmptyState title="No comments match" description="Adjust the filters to see more." />}
    >
      {(data) => (
        <>
          <DataTable
            caption="Club comments"
            rows={data.items}
            rowKey={(comment) => comment.id}
            columns={[
              {
                header: 'Comment',
                cell: (comment) => (
                  <div className="max-w-md">
                    <p className="wrap-text line-clamp-3">{comment.body}</p>
                    <Link to={`/posts/${comment.postId}`} className="text-xs text-link">
                      On: {comment.postTitle}
                    </Link>
                  </div>
                ),
              },
              { header: 'Author', cell: (comment) => comment.author.fullName },
              { header: 'Posted', cell: (comment) => formatDate(comment.createdAtUtc) },
              {
                header: 'Status',
                cell: (comment) => (
                  <Badge tone={comment.status === 'Published' ? 'success' : 'danger'}>
                    {comment.status}
                  </Badge>
                ),
              },
            ]}
            actions={(comment) =>
              comment.status === 'Published' ? (
                <Button
                  size="sm"
                  icon={<ShieldX className="size-4" />}
                  onClick={() => setRemovingId(comment.id)}
                >
                  Remove
                </Button>
              ) : (
                <Button
                  size="sm"
                  icon={<RotateCcw className="size-4" />}
                  disabled={actions.restoreComment.isPending}
                  onClick={() =>
                    actions.restoreComment.mutate(comment.id, {
                      onSuccess: () => toast.success('Comment restored'),
                      onError: toast.error,
                    })
                  }
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
            title="Remove this comment?"
            description="Students will no longer see its text. The author is notified."
            confirmLabel="Remove comment"
            danger
            loading={actions.removeComment.isPending}
            onConfirm={() => {
              if (removingId === null) return
              actions.removeComment.mutate(removingId, {
                onSuccess: () => {
                  setRemovingId(null)
                  toast.success('Comment removed')
                },
                onError: toast.error,
              })
            }}
          />
        </>
      )}
    </QueryState>
  )
}
