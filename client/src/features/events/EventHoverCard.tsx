import { CalendarDays, Clock, MapPin, UserRound } from 'lucide-react'
import { HoverCard } from 'radix-ui'
import type { ReactElement } from 'react'
import { Badge } from '@/components/ui/Badge'
import { popupStyles } from '@/components/ui/input-styles'
import { cn } from '@/lib/cn'
import { formatDate, formatTimeRange } from '@/lib/format'
import { categoryTones, type DepartmentEvent } from './types'

// Details on hover or keyboard focus; activating the link opens the event
export function EventHoverCard({
  event,
  children,
}: {
  event: DepartmentEvent
  children: ReactElement
}) {
  const isCancelled = event.status === 'Cancelled'
  const sameDay =
    new Date(event.startsAtUtc).toDateString() === new Date(event.endsAtUtc).toDateString()

  return (
    <HoverCard.Root openDelay={150} closeDelay={100}>
      <HoverCard.Trigger asChild>{children}</HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side="top"
          align="center"
          sideOffset={6}
          collisionPadding={8}
          className={cn(popupStyles, 'grid w-72 gap-2 p-3 text-left')}
        >
          <div className="flex flex-wrap gap-1.5">
            <Badge tone={categoryTones[event.category]}>{event.category}</Badge>
            {isCancelled && <Badge tone="danger">Cancelled</Badge>}
          </div>
          <p className="wrap-text text-sm font-semibold">{event.title}</p>
          <dl className="grid gap-1.5 text-xs text-muted">
            {[
              {
                label: 'Date',
                Icon: CalendarDays,
                value: sameDay
                  ? formatDate(event.startsAtUtc)
                  : `${formatDate(event.startsAtUtc)} – ${formatDate(event.endsAtUtc)}`,
              },
              {
                label: 'Time',
                Icon: Clock,
                value: formatTimeRange(event.startsAtUtc, event.endsAtUtc),
              },
              { label: 'Venue', Icon: MapPin, value: event.venue },
              { label: 'Organiser', Icon: UserRound, value: event.organizer.fullName },
            ].map(({ label, Icon, value }) => (
              <div key={label} className="flex items-start gap-2">
                <dt>
                  <Icon className="mt-px size-3.5 text-link" aria-label={label} />
                </dt>
                <dd className="wrap-text min-w-0">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="wrap-text line-clamp-3 text-xs">
            {isCancelled ? event.cancellationReason : event.description}
          </p>
          <HoverCard.Arrow className="fill-line" />
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  )
}
