import { useEffect } from 'react'
import { Link } from 'react-router'
import { QueryState } from '@/components/common/QueryState'
import { Alert } from '@/components/feedback/Alert'
import { ListSkeleton } from '@/components/feedback/Skeleton'
import { useToast } from '@/components/feedback/toast-context'
import { Button } from '@/components/ui/Button'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import type { Post } from '@/features/posts/types'
import { useListParams } from '@/hooks/useListParams'
import { watchPost } from '@/services/live'
import { useCommentActions, useComments } from './api'
import { CommentForm } from './CommentForm'
import { CommentItem } from './CommentItem'
import { buildCommentTree } from './tree'
import type { CommentSort } from './types'

const sorts: { value: CommentSort; label: string }[] = [
  { value: 'Recent', label: 'Recent' },
  { value: 'Popular', label: 'Popular' },
  { value: 'Oldest', label: 'Oldest' },
]

export function CommentSection({ post }: { post: Post }) {
  const { get, set } = useListParams()
  const sort = sorts.find((option) => option.value === get('comments'))?.value ?? 'Recent'
  const comments = useComments(post.id, sort)
  const actions = useCommentActions(post.id)
  const toast = useToast()

  // New replies appear while the discussion is open
  useEffect(() => watchPost(post.id), [post.id])

  return (
    <section aria-labelledby="comments-heading" className="mt-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="comments-heading" className="text-base font-semibold">
          Discussion
        </h2>
        <SegmentedControl
          label="Sort comments"
          value={sort}
          onChange={(value) => set({ comments: value === 'Recent' ? null : value })}
          segments={sorts}
        />
      </div>
      {post.canComment ? (
        <CommentForm
          label="Add a comment"
          submitLabel="Comment"
          loading={actions.add.isPending && !actions.add.variables?.parentCommentId}
          onSubmit={(body, reset) =>
            actions.add.mutate(
              { body, parentCommentId: null },
              { onSuccess: reset, onError: toast.error },
            )
          }
        />
      ) : (
        post.status === 'Published' && (
          <Alert>
            <Link to={`/clubs/${post.club.slug}`} className="font-medium underline">
              Join {post.club.name}
            </Link>{' '}
            to take part in this discussion.
          </Alert>
        )
      )}
      <div className="mt-5">
        <QueryState
          query={comments}
          view={sort}
          skeleton={<ListSkeleton rows={2} />}
          isEmpty={(data) => buildCommentTree(data.pages.flatMap((page) => page.items)).length === 0}
          empty={
            <p className="py-6 text-center text-sm text-muted">
              No comments yet. Start the discussion.
            </p>
          }
        >
          {(data) => (
            <ul className="grid gap-5">
              {buildCommentTree(data.pages.flatMap((page) => page.items)).map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  depth={0}
                  canReply={post.canComment}
                  actions={actions}
                />
              ))}
            </ul>
          )}
        </QueryState>
        {comments.hasNextPage && (
          <div className="mt-5 flex justify-center">
            <Button
              loading={comments.isFetchingNextPage}
              onClick={() => void comments.fetchNextPage()}
            >
              Load more comments
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
