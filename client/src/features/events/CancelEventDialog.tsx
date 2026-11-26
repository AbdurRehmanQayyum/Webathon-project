import { useToast } from '@/components/feedback/toast-context'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useEventActions } from './api'

export function CancelEventDialog({
  eventId,
  onClose,
}: {
  eventId: number | null
  onClose: () => void
}) {
  const { cancel } = useEventActions()
  const toast = useToast()

  return (
    <ConfirmDialog
      open={eventId !== null}
      onClose={onClose}
      title="Cancel this event?"
      description="It stays on the calendar, clearly marked as cancelled."
      confirmLabel="Cancel event"
      danger
      reason={{ label: 'Reason shown to students', required: true }}
      loading={cancel.isPending}
      onConfirm={(reason) => {
        if (eventId === null) return
        cancel.mutate(
          { id: eventId, reason },
          {
            onSuccess: () => {
              toast.success('Event cancelled')
              onClose()
            },
            onError: toast.error,
          },
        )
      }}
    />
  )
}
