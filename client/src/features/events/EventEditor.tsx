import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Alert } from '@/components/feedback/Alert'
import { useToast } from '@/components/feedback/toast-context'
import { DatePicker } from '@/components/forms/DatePicker'
import { FormField } from '@/components/forms/FormField'
import { TimePicker } from '@/components/forms/TimePicker'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Modal, ModalActions } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { AttachmentManager, MAX_ATTACHMENTS } from '@/features/files/AttachmentManager'
import { FileUploader } from '@/features/files/FileUploader'
import { useFileUploader } from '@/features/files/useFileUploader'
import { combineDateAndTime, toTimeValue } from '@/lib/dates'
import { applyServerErrors } from '@/lib/form-errors'
import { useEventActions } from './api'
import { eventSchema, type EventValues } from './schemas'
import { eventCategories, type DepartmentEvent } from './types'

interface EditorProps {
  event: DepartmentEvent | null
  onClose: () => void
}

export function EventEditor({ open, ...props }: EditorProps & { open: boolean }) {
  return (
    <Modal
      open={open}
      onClose={props.onClose}
      title={props.event ? 'Edit event' : 'New event'}
      description="Times are shown in your local time zone."
      wide
    >
      <EventForm {...props} />
    </Modal>
  )
}

function defaults(event: DepartmentEvent | null): Partial<EventValues> {
  if (!event) {
    return { title: '', description: '', venue: '', startTime: '10:00', endTime: '12:00' }
  }

  const startsAt = new Date(event.startsAtUtc)
  const endsAt = new Date(event.endsAtUtc)
  return {
    title: event.title,
    description: event.description,
    venue: event.venue,
    category: event.category,
    startDate: startsAt,
    startTime: toTimeValue(startsAt),
    endDate: endsAt,
    endTime: toTimeValue(endsAt),
  }
}

function EventForm({ event, onClose }: EditorProps) {
  const { save } = useEventActions()
  const toast = useToast()
  const uploader = useFileUploader({ maxFiles: MAX_ATTACHMENTS })
  const [formError, setFormError] = useState<string | null>(null)
  const { register, control, handleSubmit, setError, setValue, getValues, formState } =
    useForm<EventValues>({ resolver: zodResolver(eventSchema), defaultValues: defaults(event) })
  const { errors, isSubmitting } = formState

  const submit = handleSubmit(async ({ startDate, startTime, endDate, endTime, ...values }) => {
    setFormError(null)
    try {
      const id = await save.mutateAsync({
        ...values,
        id: event?.id,
        startsAt: combineDateAndTime(startDate, startTime).toISOString(),
        endsAt: combineDateAndTime(endDate, endTime).toISOString(),
      })
      const failures = await uploader.uploadAll(`/api/events/${id}/attachments`)
      if (failures > 0) toast.error(new Error(`Saved, but ${failures} file(s) failed to upload.`))
      else toast.success(event ? 'Event updated' : 'Event created')
      onClose()
    } catch (error) {
      setFormError(applyServerErrors(error, setError, ['title', 'description', 'venue']))
    }
  })

  const dateField = (name: 'startDate' | 'endDate', label: string) => (
    <FormField label={label} error={errors[name]?.message}>
      {(field) => (
        <Controller
          control={control}
          name={name}
          render={({ field: input }) => (
            <DatePicker
              {...field}
              value={input.value ?? null}
              onChange={(date) => {
                input.onChange(date)
                // Most events start and end on the same day
                if (name === 'startDate' && !getValues('endDate')) setValue('endDate', date)
              }}
            />
          )}
        />
      )}
    </FormField>
  )

  const timeField = (name: 'startTime' | 'endTime', label: string) => (
    <FormField label={label} error={errors[name]?.message}>
      {(field) => (
        <Controller
          control={control}
          name={name}
          render={({ field: input }) => (
            <TimePicker {...field} value={input.value} onChange={input.onChange} />
          )}
        />
      )}
    </FormField>
  )

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      {formError && <Alert tone="danger">{formError}</Alert>}
      <FormField label="Title" error={errors.title?.message}>
        {(field) => <Input {...field} {...register('title')} maxLength={200} />}
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Category" error={errors.category?.message}>
          {(field) => (
            <Controller
              control={control}
              name="category"
              render={({ field: input }) => (
                <Select
                  {...field}
                  value={input.value ?? ''}
                  onChange={input.onChange}
                  options={eventCategories.map((value) => ({ value, label: value }))}
                  placeholder="Choose a category"
                />
              )}
            />
          )}
        </FormField>
        <FormField label="Venue" error={errors.venue?.message}>
          {(field) => <Input {...field} {...register('venue')} />}
        </FormField>
        {dateField('startDate', 'Start date')}
        {timeField('startTime', 'Start time')}
        {dateField('endDate', 'End date')}
        {timeField('endTime', 'End time')}
      </div>
      <FormField label="Description" error={errors.description?.message}>
        {(field) => <Textarea {...field} {...register('description')} rows={4} />}
      </FormField>
      {event ? (
        <AttachmentManager
          attachments={event.attachments}
          uploadPath={`/api/events/${event.id}/attachments`}
        />
      ) : (
        <FileUploader uploader={uploader} label="Attach files (optional)" />
      )}
      <ModalActions>
        <Button onClick={onClose}>Close</Button>
        <Button type="submit" variant="primary" loading={isSubmitting}>
          Save event
        </Button>
      </ModalActions>
    </form>
  )
}
