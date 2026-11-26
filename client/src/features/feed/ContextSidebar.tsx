import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Skeleton } from '@/components/feedback/Skeleton'
import { useAnnouncements } from '@/features/announcements/api'
import { ClubIcon } from '@/features/clubs/ClubIcon'
import { MembershipButton } from '@/features/clubs/MembershipButton'
import { useEvents } from '@/features/events/api'
import { DateBlock } from '@/features/events/EventCard'
import { tagSearchPath } from '@/features/posts/tag-path'
import { formatDate, formatTime } from '@/lib/format'
import { usePopularTags, useRecommendedClubs } from './recommendations'

function Section({ title, to, children }: { title: string; to: string; children: ReactNode }) {
  return (
    <section className="border-b border-line pb-5 last:border-0">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Link to={to} className="rounded text-xs font-medium text-link hover:underline">
          View all
        </Link>
      </div>
      {children}
    </section>
  )
}

const Quiet = ({ children }: { children: ReactNode }) => (
  <p className="text-sm text-muted">{children}</p>
)

export function ContextSidebar() {
  const events = useEvents({ scope: 'Upcoming', status: 'Scheduled', pageSize: 3 })
  const announcements = useAnnouncements({ pageSize: 3 })
  const suggestions = useRecommendedClubs()
  const tags = usePopularTags()

  return (
    <aside
      aria-label="Department highlights"
      className="stagger-in grid min-w-0 items-start gap-5 md:grid-cols-2 xl:grid-cols-1"
    >
      <Section title="Upcoming events" to="/events?view=Upcoming">
        {events.isPending && <Skeleton className="h-24" />}
        <ul className="grid gap-3">
          {events.data?.items.map((event) => (
            <li key={event.id} className="flex gap-3">
              <DateBlock date={event.startsAtUtc} />
              <div className="min-w-0 text-sm">
                <Link
                  to={`/events/${event.id}`}
                  className="line-clamp-2 rounded font-medium hover:text-link"
                >
                  {event.title}
                </Link>
                <p className="truncate text-xs text-muted">
                  {formatTime(event.startsAtUtc)} · {event.venue}
                </p>
              </div>
            </li>
          ))}
        </ul>
        {events.data?.items.length === 0 && <Quiet>Nothing scheduled.</Quiet>}
      </Section>

      <Section title="Announcements" to="/announcements">
        {announcements.isPending && <Skeleton className="h-24" />}
        <ul className="grid gap-3">
          {announcements.data?.items
            .filter((item) => item.isPublished)
            .map((item) => (
              <li key={item.id} className="border-l-2 border-primary pl-3 text-sm">
                <Link
                  to={`/announcements/${item.id}`}
                  className="line-clamp-2 rounded font-medium hover:text-link"
                >
                  {item.title}
                </Link>
                <p className="text-xs text-muted">
                  {formatDate(item.publishedAtUtc ?? item.createdAtUtc)}
                </p>
              </li>
            ))}
        </ul>
        {announcements.data?.items.length === 0 && <Quiet>No announcements yet.</Quiet>}
      </Section>

      <Section title="Suggested for you" to="/clubs">
        {suggestions.isPending && <Skeleton className="h-24" />}
        <ul className="grid gap-3">
          {suggestions.data?.map(({ club, reason }) => (
            <li key={club.id} className="flex items-center gap-3">
              <ClubIcon iconKey={club.category.iconKey} logoFileId={club.logoFileId} />
              <div className="min-w-0 flex-1 text-sm">
                <Link
                  to={`/clubs/${club.slug}`}
                  className="line-clamp-2 rounded font-medium hover:text-link"
                >
                  {club.name}
                </Link>
                <p className="text-xs text-muted">{reason}</p>
              </div>
              <MembershipButton club={club} />
            </li>
          ))}
        </ul>
        {suggestions.data?.length === 0 && <Quiet>You have joined every suggested club.</Quiet>}
      </Section>

      {tags.data && tags.data.length > 0 && (
        <Section title="Popular tags" to="/search">
          <ul className="flex flex-wrap gap-1.5">
            {tags.data.slice(0, 12).map((tag) => (
              <li key={tag.name}>
                <Link
                  to={tagSearchPath(tag.name)}
                  className="inline-flex items-center gap-1.5 rounded bg-surface-alt px-2 py-1 text-xs font-medium text-link hover:bg-selected"
                >
                  #{tag.name}
                  <span className="text-muted">{tag.postCount}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </aside>
  )
}
