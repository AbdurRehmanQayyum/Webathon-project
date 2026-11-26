import { Clock, MapPin } from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'
import { formatTimeRange } from '@/lib/format'
import { categoryTones, type DepartmentEvent } from './types'

export function DateBlock({ date, muted }: { date: string; muted?: boolean }) {
  const value = new Date(date)
  return (
    <time
      dateTime={date}
      className={cn(
        'grid w-13 shrink-0 justify-items-center self-start rounded-control py-1.5 leading-tight',
        muted ? 'bg-surface-alt text-muted' : 'bg-selected text-selected-fg',
      )}
    >
      <span className="text-xs font-medium uppercase">
        {value.toLocaleDateString(undefined, { month: 'short' })}
      </span>
      <span className="text-xl font-semibold">{value.getDate()}</span>
    </time>
  )
}

export function EventCard({ event }: { event: DepartmentEvent }) {
  const isCancelled = event.status === 'Cancelled'

  return (
    <article className="flex gap-3 rounded-panel border border-line bg-surface p-3 sm:p-4">
      <DateBlock date={event.startsAtUtc} muted={isCancelled} />
      <div className="grid min-w-0 flex-1 content-start gap-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={categoryTones[event.category]}>{event.category}</Badge>
          {isCancelled && <Badge tone="danger">Cancelled</Badge>}
        </div>
        <h2 className="text-base font-semibold">
          <Link
            to={`/events/${event.id}`}
            className={cn(
              'wrap-text rounded hover:text-link',
              isCancelled && 'text-muted line-through',
            )}
          >
            {event.title}
          </Link>
        </h2>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden="true" />
            {formatTimeRange(event.startsAtUtc, event.endsAtUtc)}
          </span>
          <span className="wrap-text inline-flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            {event.venue}
          </span>
        </p>
      </div>
    </article>
  )
}
