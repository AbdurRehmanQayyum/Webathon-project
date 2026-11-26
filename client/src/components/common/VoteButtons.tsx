import { ArrowBigDown, ArrowBigUp } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/cn'

const buttonStyle =
  'grid place-items-center rounded-full text-muted transition-colors hover:bg-selected hover:text-selected-fg active:scale-90 disabled:pointer-events-none disabled:opacity-50'

interface VoteButtonsProps {
  score: number
  myVote: number
  disabled?: boolean
  size?: 'sm' | 'md'
  onVote: (value: number) => void
}

// Shared by posts and comments; choosing the active vote again clears it
export function VoteButtons({ score, myVote, disabled, size = 'md', onVote }: VoteButtonsProps) {
  const button = cn(
    buttonStyle,
    size === 'md' ? 'size-8 pointer-coarse:size-10' : 'size-7 pointer-coarse:size-9',
  )
  const cast = (value: number) => onVote(myVote === value ? 0 : value)

  return (
    <div
      role="group"
      aria-label="Vote"
      className="inline-flex items-center rounded-full bg-surface-alt"
    >
      <button
        type="button"
        aria-label="Upvote"
        aria-pressed={myVote === 1}
        disabled={disabled}
        onClick={() => cast(1)}
        className={cn(button, myVote === 1 && 'text-selected-fg')}
      >
        <ArrowBigUp className="size-5" fill={myVote === 1 ? 'currentColor' : 'none'} />
      </button>
      <motion.span
        key={score}
        initial={{ y: 4, opacity: 0.4 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.15 }}
        aria-live="polite"
        className="min-w-6 text-center text-sm font-semibold tabular-nums"
      >
        <span className="sr-only">Score </span>
        {score}
      </motion.span>
      <button
        type="button"
        aria-label="Downvote"
        aria-pressed={myVote === -1}
        disabled={disabled}
        onClick={() => cast(-1)}
        className={cn(button, myVote === -1 && 'text-selected-fg')}
      >
        <ArrowBigDown className="size-5" fill={myVote === -1 ? 'currentColor' : 'none'} />
      </button>
    </div>
  )
}
