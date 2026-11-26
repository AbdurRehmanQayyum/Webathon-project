import { Ellipsis, Pencil, Pin, PinOff, ShieldX, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useToast } from '@/components/feedback/toast-context'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { IconButton } from '@/components/ui/IconButton'
import { Menu, type MenuItem } from '@/components/ui/Menu'
import { useCurrentUser } from '@/features/auth/current-user'
import { useModerationActions } from '@/features/moderation/api'
import { useDeletePost } from './api'
import type { Post } from './types'

export function PostActions({ post, onDeleted }: { post: Post; onDeleted?: () => void }) {
  const { user } = useCurrentUser()
  const navigate = useNavigate()
  const toast = useToast()
  const deletePost = useDeletePost()
  const moderation = useModerationActions()
  const [confirming, setConfirming] = useState<'delete' | 'remove' | null>(null)
  const isAuthor = post.author.id === user.id

  const finish = (message: string) => {
    toast.success(message)
    setConfirming(null)
    onDeleted?.()
  }

  const items: MenuItem[] = []
  if (post.canEdit) {
    items.push({
      label: 'Edit post',
      icon: Pencil,
      onSelect: () => void navigate(`/posts/${post.id}/edit`),
    })
  }
  if (post.canModerate && post.status === 'Published') {
    items.push({
      label: post.isPinned ? 'Unpin post' : 'Pin post',
      icon: post.isPinned ? PinOff : Pin,
      onSelect: () =>
        moderation.setPinned.mutate(
          { postId: post.id, isPinned: !post.isPinned },
          {
            onSuccess: () => toast.success(post.isPinned ? 'Post unpinned' : 'Post pinned'),
            onError: toast.error,
          },
        ),
    })
  }
  if (post.canDelete) {
    items.push(
      isAuthor
        ? {
            label: 'Delete post',
            icon: Trash2,
            danger: true,
            onSelect: () => setConfirming('delete'),
          }
        : {
            label: 'Remove post',
            icon: ShieldX,
            danger: true,
            onSelect: () => setConfirming('remove'),
          },
    )
  }

  if (items.length === 0) return null

  return (
    <>
      <Menu
        items={items}
        trigger={
          <IconButton size="icon-sm" label="Post options" icon={<Ellipsis className="size-4" />} />
        }
      />
      <ConfirmDialog
        open={confirming === 'delete'}
        onClose={() => setConfirming(null)}
        title="Delete this post?"
        description="It will disappear from the club for everyone."
        confirmLabel="Delete post"
        danger
        loading={deletePost.isPending}
        onConfirm={() =>
          deletePost.mutate(post.id, {
            onSuccess: () => finish('Post deleted'),
            onError: toast.error,
          })
        }
      />
      <ConfirmDialog
        open={confirming === 'remove'}
        onClose={() => setConfirming(null)}
        title="Remove this post?"
        description="Students will no longer see it. The author is notified."
        confirmLabel="Remove post"
        danger
        reason={{ label: 'Reason', required: false }}
        loading={moderation.removePost.isPending}
        onConfirm={(reason) =>
          moderation.removePost.mutate(
            { postId: post.id, reason: reason || null },
            { onSuccess: () => finish('Post removed'), onError: toast.error },
          )
        }
      />
    </>
  )
}
