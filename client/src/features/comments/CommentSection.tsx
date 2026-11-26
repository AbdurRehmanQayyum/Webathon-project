import { useEffect } from 'react'
import { Link } from 'react-router'
import { QueryState } from '@/components/common/QueryState'
import { Alert } from '@/components/feedback/Alert'
import { ListSkeleton } from '@/components/feedback/Skeleton'
import { useToast } from '@/components/feedback/toast-context'
import type { Post } from '@/features/posts/types'
import { watchPost } from '@/services/live'
import { useCommentActions, useComments } from './api'
import { CommentForm } from './CommentForm'
import { CommentItem } from './CommentItem'
import { buildCommentTree } from './tree'

export function CommentSection({ post }: { post: Post }) {
  const comments = useComments(post.id)
  const actions = useCommentActions(post.id)
  const toast = useToast()

  // New replies appear while the discussion is open
  useEffect(() => watchPost(post.id), [post.id])

  return (
    <section aria-labelledby="comments-heading" className="mt-6">
      <h2 id="comments-heading" className="mb-3 text-base font-semibold">
        Discussion
      </h2>
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
          skeleton={<ListSkeleton rows={2} />}
          isEmpty={(data) => buildCommentTree(data).length === 0}
          empty={<p className="py-6 text-center text-sm text-muted">No comments yet.</p>}
        >
          {(data) => (
            <ul className="grid gap-5">
              {buildCommentTree(data).map((comment) => (
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
      </div>
    </section>
  )
}
