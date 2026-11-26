import { BadgeCheck, Paperclip } from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'
import { formatDateTime, pluralize } from '@/lib/format'
import type { Announcement } from './types'

export function OfficialMarks({ announcement }: { announcement: Announcement }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge tone="primary">
        <BadgeCheck className="size-3.5" aria-hidden="true" />
        Official
      </Badge>
      {announcement.priority === 'Important' && <Badge tone="warning">Important</Badge>}
      {!announcement.isPublished && <Badge>Draft</Badge>}
    </div>
  )
}

// Official notices carry a brand rule so they never read as community posts
export function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  const published = announcement.publishedAtUtc ?? announcement.createdAtUtc

  return (
    <article
      className={cn(
        'grid gap-2 rounded-r-panel border border-l-4 border-line border-l-primary bg-surface p-4',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <OfficialMarks announcement={announcement} />
        <time dateTime={published} className="text-xs text-muted">
          {formatDateTime(published)}
        </time>
      </div>
      <h2 className="text-base font-semibold">
        <Link
          to={`/announcements/${announcement.id}`}
          className="wrap-text rounded hover:text-link"
        >
          {announcement.title}
        </Link>
      </h2>
      <p className="wrap-text line-clamp-2 text-sm text-muted">{announcement.excerpt}</p>
      <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted">
        <span>
          {announcement.author.fullName}
          {announcement.author.title && `, ${announcement.author.title}`}
        </span>
        {announcement.attachments.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <Paperclip className="size-3.5" aria-hidden="true" />
            {pluralize(announcement.attachments.length, 'attachment')}
          </span>
        )}
      </p>
    </article>
  )
}
