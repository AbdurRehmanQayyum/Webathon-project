import { ExternalLink as ExternalIcon, MessageSquare, Paperclip, Pin } from 'lucide-react'
import { Link } from 'react-router'
import { ExternalLink } from '@/components/common/ExternalLink'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ClubIcon } from '@/features/clubs/ClubIcon'
import { formatDateTime, formatRelative, pluralize } from '@/lib/format'
import { fileUrl } from '@/services/api-client'
import { BookmarkButton } from './BookmarkButton'
import { PostActions } from './PostActions'
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
  const image = post.attachments.find((file) => file.contentType.startsWith('image/'))

  return (
    <Card className="grid gap-2.5 p-4 transition-colors hover:border-line-strong">
      <PostMeta post={post} />
      <div className="flex items-start gap-3">
        <div className="grid min-w-0 flex-1 gap-2">
          <h2 className="text-base font-semibold">
            <Link to={`/posts/${post.id}`} className="wrap-text rounded hover:text-link">
              {post.title}
            </Link>
          </h2>
          {post.body && (
            <p className="wrap-text line-clamp-3 text-sm whitespace-pre-line text-muted">
              {post.body}
              {post.isBodyTruncated && '…'}
            </p>
          )}
          {post.linkUrl && <LinkPreview url={post.linkUrl} />}
        </div>
        {image && (
          <img
            src={fileUrl(image.id)}
            alt=""
            loading="lazy"
            className="size-20 shrink-0 rounded-control bg-surface-alt object-cover sm:size-24"
          />
        )}
      </div>
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
        {post.attachments.length > 0 && (
          <span className="inline-flex items-center gap-1 px-1 text-sm text-muted">
            <Paperclip className="size-4" aria-hidden="true" />
            {post.attachments.length}
            <span className="sr-only"> attachments</span>
          </span>
        )}
        <div className="ml-auto flex items-center">
          <BookmarkButton post={post} />
          <PostActions post={post} />
        </div>
      </div>
    </Card>
  )
}
