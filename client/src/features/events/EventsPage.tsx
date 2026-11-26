import { Settings2 } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Reveal } from '@/components/common/Reveal'
import { ButtonLink } from '@/components/ui/Button'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Select } from '@/components/ui/Select'
import { useCurrentUser } from '@/features/auth/current-user'
import { permissions } from '@/features/auth/permissions'
import { useListParams } from '@/hooks/useListParams'
import { useEvents } from './api'
import { EventCalendar } from './EventCalendar'
import { EventResults } from './EventResults'
import { eventCategories, type EventCategory } from './types'

type View = 'calendar' | 'Upcoming' | 'Past'

export function EventsPage() {
  const { can } = useCurrentUser()
  const { get, set } = useListParams()
  const view = (['Upcoming', 'Past'].find((value) => value === get('view')) ?? 'calendar') as View
  const category = eventCategories.find((value) => value === get('category')) ?? null

  return (
    <>
      <PageHeader
        title="Events"
        description="Department workshops, seminars and activities."
        actions={
          can(permissions.manageEvents) && (
            <ButtonLink to="/admin/events" icon={<Settings2 className="size-4" />}>
              Manage
            </ButtonLink>
          )
        }
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <SegmentedControl
          label="Event view"
          value={view}
          onChange={(value) => set({ view: value === 'calendar' ? null : value })}
          segments={[
            { value: 'calendar', label: 'Calendar' },
            { value: 'Upcoming', label: 'Upcoming' },
            { value: 'Past', label: 'Past' },
          ]}
          className="w-full sm:w-80"
        />
        <Select
          aria-label="Event category"
          value={category ?? 'all'}
          onChange={(value) => set({ category: value === 'all' ? null : value })}
          options={[
            { value: 'all', label: 'All categories' },
            ...eventCategories.map((value) => ({ value, label: value })),
          ]}
          className="w-full sm:w-48"
        />
      </div>
      <Reveal when={view}>
        {view === 'calendar' ? (
          <EventCalendar category={category} />
        ) : (
          <EventTimeline key={view} scope={view} category={category} />
        )}
      </Reveal>
    </>
  )
}

function EventTimeline({
  scope,
  category,
}: {
  scope: 'Upcoming' | 'Past'
  category: EventCategory | null
}) {
  const { page, set } = useListParams()
  const events = useEvents({ scope, category, pageNumber: page, pageSize: 10 })

  return (
    <EventResults
      query={events}
      onPage={(next) => set({ page: next })}
      emptyTitle={scope === 'Upcoming' ? 'No upcoming events' : 'No past events'}
    />
  )
}
