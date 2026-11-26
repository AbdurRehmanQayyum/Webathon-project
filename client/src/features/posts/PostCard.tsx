import { ExternalLink as ExternalIcon, MessageSquare, Pin } from 'lucide-react'
import { Link } from 'react-router'
import { ExternalLink } from '@/components/common/ExternalLink'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ClubIcon } from '@/features/clubs/ClubIcon'
import { AttachmentGallery } from '@/features/files/AttachmentGallery'
import { formatDateTime, formatRelative, pluralize } from '@/lib/format'
import { BookmarkButton } from './BookmarkButton'
import { PostActions } from './PostActions'
import { TagList } from './TagList'
import type { Post } from './types'
import { VoteControl } from './VoteControl'

export function PostMeta({ post }: { post: Post }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
      <Link
        to={`/clubs/${post.club.slug}`}
        className="inline-flex items-center gap-1.5 rounded font-semibold text-fg hover:text-link"
      >
        <ClubIcon iconKey={post.club.iconKey} logoFileId={post.club.logoFileId} size="xs" />
        {post.club.name}
      </Link>
      <Link
        to={`/users/${post.author.id}`}
        className="inline-flex items-center gap-1.5 rounded hover:text-link"
      >
        <Avatar name={post.author.fullName} fileId={post.author.avatarFileId} size="xs" />
        {post.author.fullName}
      </Link>
      <time dateTime={post.createdAtUtc} title={formatDateTime(post.createdAtUtc)}>
        {formatRelative(post.createdAtUtc)}
      </time>
      {post.editedAtUtc && <span title={formatDateTime(post.editedAtUtc)}>edited</span>}
      {post.isPinned && (
        <Badge tone="primary">
          <Pin className="size-3" aria-hidden="true" />
          Pinned
        </Badge>
      )}
    </div>
  )
}

export function LinkPreview({ url }: { url: string }) {
  const host = URL.canParse(url) ? new URL(url).hostname.replace(/^www\./, '') : url
  return (
    <ExternalLink
      href={url}
      className="inline-flex w-fit max-w-full items-center gap-2 rounded-control border border-line px-3 py-2 text-sm hover:border-primary hover:no-underline"
    >
      <ExternalIcon className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{host}</span>
    </ExternalLink>
  )
}

export function PostCard({ post }: { post: Post }) {
  return (
    <Card className="grid min-w-0 content-start gap-2.5 p-4 transition-colors hover:border-line-strong">
      <PostMeta post={post} />
      <div className="grid min-w-0 gap-2">
        <h2 className="text-base font-semibold">
          <Link to={`/posts/${post.id}`} className="wrap-text rounded hover:text-link">
            {post.title}
          </Link>
        </h2>
        {post.excerpt && <p className="wrap-text line-clamp-3 text-sm text-muted">{post.excerpt}</p>}
        {post.linkUrl && <LinkPreview url={post.linkUrl} />}
        <TagList tags={post.tags} />
      </div>
      <AttachmentGallery attachments={post.attachments} compact />
      <div className="flex items-center gap-1.5">
        <VoteControl post={post} />
        <Link
          to={`/posts/${post.id}`}
          className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm text-muted hover:bg-surface-alt hover:text-fg"
        >
          <MessageSquare className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">{pluralize(post.commentCount, 'comment')}</span>
          <span className="sm:hidden">
            {post.commentCount}
            <span className="sr-only"> comments</span>
          </span>
        </Link>
        <div className="ml-auto flex items-center">
          <BookmarkButton post={post} />
          <PostActions post={post} />
        </div>
      </div>
    </Card>
  )
}
