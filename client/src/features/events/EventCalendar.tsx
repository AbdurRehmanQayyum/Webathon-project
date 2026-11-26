import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Reveal } from '@/components/common/Reveal'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { cn } from '@/lib/cn'
import {
  addDays,
  addMonths,
  buildMonthGrid,
  isSameDay,
  monthLabel,
  startOfDay,
  weekdayLabels,
} from '@/lib/dates'
import { formatDate, formatTime, pluralize } from '@/lib/format'
import { useEvents } from './api'
import { EventCard } from './EventCard'
import { EventHoverCard } from './EventHoverCard'
import type { DepartmentEvent, EventCategory } from './types'

const MAX_CHIPS = 3

const occursOn = (event: DepartmentEvent, day: Date) =>
  new Date(event.startsAtUtc) < addDays(day, 1) && new Date(event.endsAtUtc) > startOfDay(day)

export function EventCalendar({ category }: { category: EventCategory | null }) {
  const today = new Date()
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState<Date | null>(null)
  const days = buildMonthGrid(month)
  const events = useEvents({
    from: days[0]?.toISOString(),
    to: addDays(days.at(-1) ?? month, 1).toISOString(),
    category,
    pageSize: 100,
  })
  const items = events.data?.items ?? []
  const inMonth = items.filter((event) => {
    const starts = new Date(event.startsAtUtc)
    return starts.getMonth() === month.getMonth() && starts.getFullYear() === month.getFullYear()
  })
  const agenda = selected ? items.filter((event) => occursOn(event, selected)) : inMonth

  const showMonth = (next: Date) => {
    setMonth(new Date(next.getFullYear(), next.getMonth(), 1))
    setSelected(null)
  }

  if (events.isError) {
    return <ErrorState error={events.error} onRetry={() => void events.refetch()} />
  }

  return (
    <div className="grid gap-5">
      <div className="overflow-hidden rounded-panel border border-line bg-surface">
        <div className="flex items-center justify-between gap-2 border-b border-line p-3">
          <h2 className="text-base font-semibold" aria-live="polite">
            {monthLabel(month)}
          </h2>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => showMonth(today)}>
              Today
            </Button>
            <IconButton
              size="icon-sm"
              label="Previous month"
              icon={<ChevronLeft className="size-4" />}
              onClick={() => showMonth(addMonths(month, -1))}
            />
            <IconButton
              size="icon-sm"
              label="Next month"
              icon={<ChevronRight className="size-4" />}
              onClick={() => showMonth(addMonths(month, 1))}
            />
          </div>
        </div>
        <div
          className="grid grid-cols-7 border-b border-line text-center text-xs font-medium text-muted"
          aria-hidden="true"
        >
          {weekdayLabels.map((day) => (
            <span key={day} className="py-2">
              {day}
            </span>
          ))}
        </div>
        <motion.div
          key={month.toISOString()}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-7"
        >
          {days.map((day) => {
            const dayEvents = items.filter((event) => occursOn(event, day))
            const isToday = isSameDay(day, today)
            const isSelected = selected !== null && isSameDay(day, selected)
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'min-h-14 min-w-0 border-r border-b border-line p-1 nth-[7n]:border-r-0 nth-last-[-n+7]:border-b-0 md:min-h-26',
                  day.getMonth() !== month.getMonth() && 'bg-surface-alt/50 text-muted',
                  isSelected && 'bg-selected',
                )}
              >
                <button
                  type="button"
                  onClick={() => setSelected(isSelected ? null : day)}
                  aria-pressed={isSelected}
                  aria-current={isToday ? 'date' : undefined}
                  aria-label={`${formatDate(day)}, ${pluralize(dayEvents.length, 'event')}`}
                  className="grid w-full justify-items-center gap-1 rounded-md md:justify-items-start"
                >
                  <span
                    className={cn(
                      'grid size-7 place-items-center rounded-full text-sm',
                      isToday && 'bg-primary font-semibold text-on-primary',
                    )}
                  >
                    {day.getDate()}
                  </span>
                  <span className="flex h-1.5 gap-0.5 md:hidden" aria-hidden="true">
                    {dayEvents.slice(0, MAX_CHIPS).map((event) => (
                      <span
                        key={event.id}
                        className={cn(
                          'size-1.5 rounded-full',
                          event.status === 'Cancelled' ? 'bg-danger' : 'bg-secondary',
                        )}
                      />
                    ))}
                  </span>
                </button>
                <ul className="mt-1 hidden grid-cols-1 gap-1 md:grid">
                  {dayEvents.slice(0, MAX_CHIPS).map((event) => (
                    <li key={event.id} className="min-w-0">
                      <EventHoverCard event={event}>
                        <Link
                          to={`/events/${event.id}`}
                          className={cn(
                            'block truncate rounded px-1.5 py-0.5 text-xs',
                            event.status === 'Cancelled'
                              ? 'bg-danger-soft text-danger-fg line-through'
                              : 'bg-selected text-selected-fg hover:underline',
                          )}
                        >
                          {formatTime(event.startsAtUtc)} {event.title}
                        </Link>
                      </EventHoverCard>
                    </li>
                  ))}
                  {dayEvents.length > MAX_CHIPS && (
                    <li className="px-1.5 text-xs text-muted">
                      +{dayEvents.length - MAX_CHIPS} more
                    </li>
                  )}
                </ul>
              </div>
            )
          })}
        </motion.div>
      </div>

      <section aria-labelledby="agenda-heading">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 id="agenda-heading" className="text-base font-semibold">
            {selected ? `Events on ${formatDate(selected)}` : 'Agenda this month'}
          </h2>
          {selected && (
            <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>
              Show whole month
            </Button>
          )}
        </div>
        <Reveal when={(selected ?? month).toISOString()}>
          {agenda.length === 0 ? (
            <p className="rounded-panel border border-dashed border-line-strong p-6 text-center text-sm text-muted">
              {events.isPending ? 'Loading events…' : 'No events scheduled.'}
            </p>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {agenda.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </Reveal>
      </section>
    </div>
  )
}
