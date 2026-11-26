import { Bookmark } from 'lucide-react'
import { motion } from 'motion/react'
import { useToast } from '@/components/feedback/toast-context'
import { IconButton } from '@/components/ui/IconButton'
import { useBookmark } from './api'
import type { Post } from './types'

export function BookmarkButton({ post }: { post: Post }) {
  const bookmark = useBookmark(post.id)
  const toast = useToast()
  const saved = post.isBookmarked

  return (
    <IconButton
      size="icon-sm"
      label={saved ? 'Remove bookmark' : 'Bookmark post'}
      aria-pressed={saved}
      disabled={post.status !== 'Published'}
      icon={
        <motion.span key={String(saved)} initial={{ scale: 0.7 }} animate={{ scale: 1 }}>
          <Bookmark className="size-4" fill={saved ? 'currentColor' : 'none'} />
        </motion.span>
      }
      onClick={() =>
        bookmark.mutate(!saved, {
          onSuccess: () => toast.success(saved ? 'Bookmark removed' : 'Saved to bookmarks'),
          onError: toast.error,
        })
      }
    />
  )
}
