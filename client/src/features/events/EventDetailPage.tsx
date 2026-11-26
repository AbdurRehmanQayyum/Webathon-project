import { CalendarDays, Clock, MapPin, Pencil, XCircle } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router'
import { Breadcrumb } from '@/components/common/PageHeader'
import { QueryState } from '@/components/common/QueryState'
import { RichText } from '@/components/common/RichText'
import { Alert } from '@/components/feedback/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useCurrentUser } from '@/features/auth/current-user'
import { AttachmentList } from '@/features/files/AttachmentList'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDate, formatTimeRange } from '@/lib/format'
import { useEvent } from './api'
import { CancelEventDialog } from './CancelEventDialog'
import { EventEditor } from './EventEditor'
import { categoryTones, type DepartmentEvent } from './types'

export function EventDetailPage() {
  const event = useEvent(Number(useParams().eventId))
  useDocumentTitle(event.data?.title)

  return (
    <div className="mx-auto max-w-3xl">
      <QueryState query={event}>{(data) => <EventView event={data} />}</QueryState>
    </div>
  )
}

function EventView({ event }: { event: DepartmentEvent }) {
  const { isAdmin } = useCurrentUser()
  const [dialog, setDialog] = useState<'edit' | 'cancel' | null>(null)
  const isCancelled = event.status === 'Cancelled'
  const hasEnded = new Date(event.endsAtUtc) < new Date()
  const details = [
    { label: 'Date', value: formatDate(event.startsAtUtc), Icon: CalendarDays },
    { label: 'Time', value: formatTimeRange(event.startsAtUtc, event.endsAtUtc), Icon: Clock },
    { label: 'Venue', value: event.venue, Icon: MapPin },
  ]

  return (
    <>
      <Breadcrumb items={[{ label: 'Events', to: '/events' }, { label: event.title }]} />
      {isCancelled && (
        <Alert tone="danger" className="mb-3">
          <strong>This event is cancelled.</strong> {event.cancellationReason}
        </Alert>
      )}
      <Card className="grid gap-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={categoryTones[event.category]}>{event.category}</Badge>
          <Badge tone={isCancelled ? 'danger' : hasEnded ? 'neutral' : 'success'}>
            {isCancelled ? 'Cancelled' : hasEnded ? 'Ended' : 'Scheduled'}
          </Badge>
        </div>
        <h1 className="wrap-text text-xl font-semibold sm:text-2xl">{event.title}</h1>
        <dl className="grid gap-3 border-y border-line py-4 sm:grid-cols-3">
          {details.map(({ label, value, Icon }) => (
            <div key={label} className="flex gap-2.5">
              <Icon className="mt-0.5 size-4 shrink-0 text-link" aria-hidden="true" />
              <div className="min-w-0 text-sm">
                <dt className="text-muted">{label}</dt>
                <dd className="wrap-text font-medium">{value}</dd>
              </div>
            </div>
          ))}
        </dl>
        <RichText text={event.description} className="leading-relaxed" />
        <AttachmentList attachments={event.attachments} />
        <p className="text-sm text-muted">Organised by {event.organizer.fullName}</p>
        {isAdmin && !isCancelled && (
          <div className="flex flex-wrap gap-2 border-t border-line pt-4">
            <Button icon={<Pencil className="size-4" />} onClick={() => setDialog('edit')}>
              Edit event
            </Button>
            <Button icon={<XCircle className="size-4" />} onClick={() => setDialog('cancel')}>
              Cancel event
            </Button>
          </div>
        )}
      </Card>
      <EventEditor open={dialog === 'edit'} event={event} onClose={() => setDialog(null)} />
      <CancelEventDialog
        eventId={dialog === 'cancel' ? event.id : null}
        onClose={() => setDialog(null)}
      />
    </>
  )
}
