import { Pencil, Plus, XCircle } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import { PageHeader } from '@/components/common/PageHeader'
import { QueryState } from '@/components/common/QueryState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { IconButton } from '@/components/ui/IconButton'
import { Pagination } from '@/components/ui/Pagination'
import { SearchInput } from '@/components/ui/SearchInput'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useEvents } from '@/features/events/api'
import { CancelEventDialog } from '@/features/events/CancelEventDialog'
import { EventEditor } from '@/features/events/EventEditor'
import { useListParams } from '@/hooks/useListParams'
import { formatDate, formatTimeRange } from '@/lib/format'

type Scope = 'Upcoming' | 'Past'
type Dialog = { type: 'create' } | { type: 'edit' | 'cancel'; id: number }

export function EventsAdminPage() {
  const { page, get, set } = useListParams()
  const scope: Scope = get('scope') === 'Past' ? 'Past' : 'Upcoming'
  const search = get('q')
  const onSearch = useCallback((q: string) => set({ q }), [set])
  const events = useEvents({ scope, search, pageNumber: page, pageSize: 10 })
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const target =
    dialog && 'id' in dialog
      ? (events.data?.items.find((item) => item.id === dialog.id) ?? null)
      : null
  const close = () => setDialog(null)

  return (
    <>
      <PageHeader
        title="Events"
        description="Schedule, update and cancel department events."
        actions={
          <Button
            variant="primary"
            icon={<Plus className="size-4" />}
            onClick={() => setDialog({ type: 'create' })}
          >
            New event
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <SegmentedControl
          label="Event period"
          value={scope}
          onChange={(value) => set({ scope: value === 'Upcoming' ? null : value })}
          segments={[
            { value: 'Upcoming', label: 'Upcoming' },
            { value: 'Past', label: 'Past' },
          ]}
        />
        <SearchInput
          label="Search title or venue"
          value={search}
          onSearch={onSearch}
          className="min-w-52 flex-1"
        />
      </div>
      <QueryState
        query={events}
        isEmpty={(data) => data.items.length === 0}
        empty={<EmptyState title="No events" description="Schedule the next department event." />}
      >
        {(data) => (
          <>
            <DataTable
              caption="Events"
              rows={data.items}
              rowKey={(row) => row.id}
              columns={[
                {
                  header: 'Event',
                  cell: (row) => (
                    <Link to={`/events/${row.id}`} className="font-medium hover:text-link">
                      {row.title}
                    </Link>
                  ),
                },
                {
                  header: 'When',
                  cell: (row) => (
                    <>
                      {formatDate(row.startsAtUtc)}
                      <span className="block text-xs text-muted">
                        {formatTimeRange(row.startsAtUtc, row.endsAtUtc)}
                      </span>
                    </>
                  ),
                },
                { header: 'Venue', cell: (row) => row.venue },
                {
                  header: 'Status',
                  cell: (row) => (
                    <Badge tone={row.status === 'Cancelled' ? 'danger' : 'success'}>
                      {row.status}
                    </Badge>
                  ),
                },
              ]}
              actions={(row) =>
                row.status === 'Scheduled' && (
                  <>
                    <IconButton
                      size="icon-sm"
                      label={`Edit ${row.title}`}
                      icon={<Pencil className="size-4" />}
                      onClick={() => setDialog({ type: 'edit', id: row.id })}
                    />
                    <IconButton
                      size="icon-sm"
                      label={`Cancel ${row.title}`}
                      icon={<XCircle className="size-4" />}
                      onClick={() => setDialog({ type: 'cancel', id: row.id })}
                    />
                  </>
                )
              }
            />
            <Pagination
              page={data.pageNumber}
              totalPages={data.totalPages}
              onChange={(next) => set({ page: next })}
            />
          </>
        )}
      </QueryState>
      <EventEditor
        open={dialog?.type === 'create' || (dialog?.type === 'edit' && target !== null)}
        event={dialog?.type === 'edit' ? target : null}
        onClose={close}
      />
      <CancelEventDialog eventId={dialog?.type === 'cancel' ? dialog.id : null} onClose={close} />
    </>
  )
}
