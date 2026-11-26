import { MessageSquare, RotateCcw } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'
import { Breadcrumb } from '@/components/common/PageHeader'
import { QueryState } from '@/components/common/QueryState'
import { RichContent } from '@/components/editor/RichContent'
import { Alert } from '@/components/feedback/Alert'
import { useToast } from '@/components/feedback/toast-context'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CommentSection } from '@/features/comments/CommentSection'
import { AttachmentGallery } from '@/features/files/AttachmentGallery'
import { useModerationActions } from '@/features/moderation/api'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { pluralize } from '@/lib/format'
import { usePost } from './api'
import { BookmarkButton } from './BookmarkButton'
import { PostActions } from './PostActions'
import { LinkPreview, PostMeta } from './PostCard'
import { TagList } from './TagList'
import type { Post } from './types'
import { VoteControl } from './VoteControl'

export function PostDetailPage() {
  const postId = Number(useParams().postId)
  const post = usePost(postId)
  useDocumentTitle(post.data?.title)

  return <QueryState query={post}>{(data) => <PostView post={data} />}</QueryState>
}

function PostView({ post }: { post: Post }) {
  const navigate = useNavigate()
  const toast = useToast()
  const { restorePost } = useModerationActions()

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Clubs', to: '/clubs' },
          { label: post.club.name, to: `/clubs/${post.club.slug}` },
          { label: post.title },
        ]}
      />
      {post.status === 'Removed' && (
        <Alert tone="warning" className="mb-3">
          A moderator removed this post.
          {post.moderationReason && ` Reason: ${post.moderationReason}`}
          {post.canModerate && (
            <Button
              size="sm"
              className="ml-3"
              icon={<RotateCcw className="size-4" />}
              loading={restorePost.isPending}
              onClick={() =>
                restorePost.mutate(post.id, {
                  onSuccess: () => toast.success('Post restored'),
                  onError: toast.error,
                })
              }
            >
              Restore
            </Button>
          )}
        </Alert>
      )}
      <Card className="grid gap-4 p-4 sm:p-6">
        <PostMeta post={post} />
        <h1 className="wrap-text text-xl font-semibold sm:text-2xl">{post.title}</h1>
        {post.linkUrl && <LinkPreview url={post.linkUrl} />}
        {post.body && <RichContent html={post.body} className="leading-relaxed" />}
        <TagList tags={post.tags} />
        <AttachmentGallery attachments={post.attachments} />
        <div className="flex items-center gap-2 border-t border-line pt-3">
          <VoteControl post={post} />
          <span className="inline-flex items-center gap-1.5 px-2 text-sm text-muted">
            <MessageSquare className="size-4" aria-hidden="true" />
            {pluralize(post.commentCount, 'comment')}
          </span>
          <div className="ml-auto flex items-center">
            <BookmarkButton post={post} />
            <PostActions post={post} onDeleted={() => void navigate(`/clubs/${post.club.slug}`)} />
          </div>
        </div>
      </Card>
      <CommentSection post={post} />
    </>
  )
}
