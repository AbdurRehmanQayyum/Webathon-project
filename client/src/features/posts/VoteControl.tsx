import { VoteButtons } from '@/components/common/VoteButtons'
import { useToast } from '@/components/feedback/toast-context'
import { useVote } from './api'
import type { Post } from './types'

export function VoteControl({ post }: { post: Post }) {
  const vote = useVote(post.id)
  const toast = useToast()

  return (
    <VoteButtons
      score={post.score}
      myVote={post.myVote}
      disabled={!post.canReact}
      onVote={(value) => vote.mutate(value, { onError: toast.error })}
    />
  )
}
