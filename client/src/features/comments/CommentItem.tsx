import { ChevronDown, ChevronRight, Pencil, Reply, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router'
import { RichText } from '@/components/common/RichText'
import { useToast } from '@/components/feedback/toast-context'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useCurrentUser } from '@/features/auth/current-user'
import { cn } from '@/lib/cn'
import { formatDateTime, formatRelative, pluralize } from '@/lib/format'
import type { CommentActions } from './api'
import { CommentForm } from './CommentForm'
import type { CommentNode } from './types'

// Indentation stops growing so deep threads stay readable on phones
const MAX_INDENT = 3

interface CommentItemProps {
  comment: CommentNode
  depth: number
  canReply: boolean
  actions: CommentActions
}

export function CommentItem({ comment, depth, canReply, actions }: CommentItemProps) {
  const { user } = useCurrentUser()
  const toast = useToast()
  const [mode, setMode] = useState<'view' | 'reply' | 'edit'>('view')
  const [isCollapsed, setCollapsed] = useState(false)
  const [isConfirming, setConfirming] = useState(false)
  const isVisible = comment.status === 'Published'
  const isAuthor = comment.author.id === user.id
  const removeLabel = isAuthor ? 'Delete' : 'Remove'

  return (
    <li className="min-w-0">
      <article id={`comment-${comment.id}`} className="grid gap-1.5">
        <header className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
          {isVisible ? (
            <Link
              to={`/users/${comment.author.id}`}
              className="inline-flex items-center gap-2 rounded font-semibold text-fg hover:text-link"
            >
              <Avatar
                name={comment.author.fullName}
                fileId={comment.author.avatarFileId}
                size="xs"
              />
              {comment.author.fullName}
            </Link>
          ) : (
            <span className="italic">
              {comment.status === 'Deleted' ? 'Comment deleted' : 'Removed by a moderator'}
            </span>
          )}
          <time dateTime={comment.createdAtUtc} title={formatDateTime(comment.createdAtUtc)}>
            {formatRelative(comment.createdAtUtc)}
          </time>
          {comment.editedAtUtc && isVisible && <span>edited</span>}
        </header>

        {isVisible &&
          (mode === 'edit' ? (
            <CommentForm
              label="Edit your comment"
              submitLabel="Save"
              initialValue={comment.body ?? ''}
              autoFocus
              loading={actions.edit.isPending}
              onCancel={() => setMode('view')}
              onSubmit={(body) =>
                actions.edit.mutate(
                  { id: comment.id, body },
                  { onSuccess: () => setMode('view'), onError: toast.error },
                )
              }
            />
          ) : (
            <RichText text={comment.body ?? ''} className="text-sm" />
          ))}

        <div className="flex flex-wrap items-center gap-1">
          {comment.replies.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              aria-expanded={!isCollapsed}
              icon={
                isCollapsed ? (
                  <ChevronRight className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )
              }
              onClick={() => setCollapsed((collapsed) => !collapsed)}
            >
              {pluralize(comment.replies.length, 'reply', 'replies')}
            </Button>
          )}
          {canReply && isVisible && (
            <Button
              size="sm"
              variant="ghost"
              icon={<Reply className="size-4" />}
              onClick={() => setMode('reply')}
            >
              Reply
            </Button>
          )}
          {comment.canEdit && (
            <Button
              size="sm"
              variant="ghost"
              icon={<Pencil className="size-4" />}
              onClick={() => setMode('edit')}
            >
              Edit
            </Button>
          )}
          {comment.canDelete && (
            <Button
              size="sm"
              variant="ghost"
              icon={<Trash2 className="size-4" />}
              onClick={() => setConfirming(true)}
            >
              {removeLabel}
            </Button>
          )}
        </div>

        {mode === 'reply' && (
          <CommentForm
            label={`Reply to ${comment.author.fullName}`}
            submitLabel="Reply"
            autoFocus
            loading={actions.add.isPending}
            onCancel={() => setMode('view')}
            onSubmit={(body) =>
              actions.add.mutate(
                { body, parentCommentId: comment.id },
                {
                  onSuccess: () => {
                    setMode('view')
                    setCollapsed(false)
                  },
                  onError: toast.error,
                },
              )
            }
          />
        )}
      </article>

      <AnimatePresence initial={false}>
        {!isCollapsed && comment.replies.length > 0 && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'overflow-hidden',
              depth < MAX_INDENT && 'ml-1.5 border-l-2 border-line pl-3 sm:pl-4',
            )}
          >
            <div className="grid gap-4 pt-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  depth={depth + 1}
                  canReply={canReply}
                  actions={actions}
                />
              ))}
            </div>
          </motion.ul>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={isConfirming}
        onClose={() => setConfirming(false)}
        title={`${removeLabel} this comment?`}
        description="The text will no longer be visible in the discussion."
        confirmLabel={`${removeLabel} comment`}
        danger
        loading={actions.remove.isPending}
        onConfirm={() =>
          actions.remove.mutate(comment.id, {
            onSuccess: () => {
              setConfirming(false)
              toast.success(isAuthor ? 'Comment deleted' : 'Comment removed')
            },
            onError: toast.error,
          })
        }
      />
    </li>
  )
}
