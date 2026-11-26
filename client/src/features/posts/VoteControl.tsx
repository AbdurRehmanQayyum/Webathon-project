import { ArrowBigDown, ArrowBigUp } from 'lucide-react'
import { motion } from 'motion/react'
import { useToast } from '@/components/feedback/toast-context'
import { cn } from '@/lib/cn'
import { useVote } from './api'
import type { Post } from './types'

const buttonStyle =
  'grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-selected hover:text-selected-fg active:scale-90 disabled:pointer-events-none disabled:opacity-50 pointer-coarse:size-10'

export function VoteControl({ post }: { post: Post }) {
  const vote = useVote(post.id)
  const toast = useToast()
  const isDisabled = post.status !== 'Published'

  const cast = (value: number) =>
    vote.mutate(post.myVote === value ? 0 : value, { onError: toast.error })

  return (
    <div
      role="group"
      aria-label="Vote"
      className="inline-flex items-center rounded-full bg-surface-alt"
    >
      <button
        type="button"
        aria-label="Upvote"
        aria-pressed={post.myVote === 1}
        disabled={isDisabled}
        onClick={() => cast(1)}
        className={cn(buttonStyle, post.myVote === 1 && 'text-selected-fg')}
      >
        <ArrowBigUp className="size-5" fill={post.myVote === 1 ? 'currentColor' : 'none'} />
      </button>
      <motion.span
        key={post.score}
        initial={{ y: 4, opacity: 0.4 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.15 }}
        aria-live="polite"
        className="min-w-6 text-center text-sm font-semibold tabular-nums"
      >
        <span className="sr-only">Score </span>
        {post.score}
      </motion.span>
      <button
        type="button"
        aria-label="Downvote"
        aria-pressed={post.myVote === -1}
        disabled={isDisabled}
        onClick={() => cast(-1)}
        className={cn(buttonStyle, post.myVote === -1 && 'text-selected-fg')}
      >
        <ArrowBigDown className="size-5" fill={post.myVote === -1 ? 'currentColor' : 'none'} />
      </button>
    </div>
  )
}
