import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Alert } from '@/components/feedback/Alert'
import { useToast } from '@/components/feedback/toast-context'
import { FormField } from '@/components/forms/FormField'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Modal, ModalActions } from '@/components/ui/Modal'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Switch } from '@/components/ui/Switch'
import { AttachmentManager, MAX_ATTACHMENTS } from '@/features/files/AttachmentManager'
import { FileUploader } from '@/features/files/FileUploader'
import { useFileUploader } from '@/features/files/useFileUploader'
import { webUrlSchema } from '@/features/posts/schemas'
import { applyServerErrors } from '@/lib/form-errors'
import { useAnnouncementActions } from './api'
import type { Announcement } from './types'

const announcementSchema = z.object({
  title: z.string().trim().min(5, 'Use at least 5 characters.').max(200),
  body: z.string().trim().min(10, 'Write at least 10 characters.').max(20000),
  linkUrl: z.union([z.literal(''), webUrlSchema]),
  linkLabel: z.string().max(100),
  priority: z.enum(['Normal', 'Important']),
  publish: z.boolean(),
})

type AnnouncementValues = z.infer<typeof announcementSchema>

interface EditorProps {
  announcement: Announcement | null
  onClose: () => void
}

export function AnnouncementEditor({ open, ...props }: EditorProps & { open: boolean }) {
  return (
    <Modal
      open={open}
      onClose={props.onClose}
      title={props.announcement ? 'Edit announcement' : 'New announcement'}
      wide
    >
      <AnnouncementForm {...props} />
    </Modal>
  )
}

function AnnouncementForm({ announcement, onClose }: EditorProps) {
  const { save } = useAnnouncementActions()
  const toast = useToast()
  const uploader = useFileUploader({ maxFiles: MAX_ATTACHMENTS })
  const [formError, setFormError] = useState<string | null>(null)
  const { register, control, handleSubmit, setError, formState } = useForm<AnnouncementValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: announcement?.title ?? '',
      body: announcement?.body ?? '',
      linkUrl: announcement?.linkUrl ?? '',
      linkLabel: announcement?.linkLabel ?? '',
      priority: announcement?.priority ?? 'Normal',
      publish: announcement?.isPublished ?? true,
    },
  })
  const { errors, isSubmitting } = formState

  const submit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      const id = await save.mutateAsync({
        ...values,
        id: announcement?.id,
        linkUrl: values.linkUrl || null,
        linkLabel: values.linkLabel.trim() || null,
      })
      const failures = await uploader.uploadAll(`/api/announcements/${id}/attachments`)
      if (failures > 0) {
        toast.error(new Error(`Saved, but ${failures} file(s) failed to upload.`))
      } else {
        toast.success(values.publish ? 'Announcement published' : 'Draft saved')
      }
      onClose()
    } catch (error) {
      setFormError(applyServerErrors(error, setError, ['title', 'body', 'linkUrl', 'linkLabel']))
    }
  })

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      {formError && <Alert tone="danger">{formError}</Alert>}
      <FormField label="Title" error={errors.title?.message}>
        {(field) => <Input {...field} {...register('title')} maxLength={200} />}
      </FormField>
      <FormField label="Message" error={errors.body?.message}>
        {(field) => <Textarea {...field} {...register('body')} rows={6} />}
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Link" optional error={errors.linkUrl?.message}>
          {(field) => (
            <Input {...field} {...register('linkUrl')} type="url" placeholder="https://" />
          )}
        </FormField>
        <FormField label="Link label" optional error={errors.linkLabel?.message}>
          {(field) => <Input {...field} {...register('linkLabel')} />}
        </FormField>
      </div>
      <div className="grid gap-1.5">
        <span className="text-sm font-medium">Priority</span>
        <Controller
          control={control}
          name="priority"
          render={({ field }) => (
            <SegmentedControl
              label="Priority"
              value={field.value}
              onChange={field.onChange}
              segments={[
                { value: 'Normal', label: 'Normal' },
                { value: 'Important', label: 'Important' },
              ]}
              className="w-fit"
            />
          )}
        />
      </div>
      <Controller
        control={control}
        name="publish"
        render={({ field }) => (
          <Switch
            label="Published"
            description="Students can see published announcements."
            checked={field.value}
            onChange={field.onChange}
          />
        )}
      />
      {announcement ? (
        <AttachmentManager
          attachments={announcement.attachments}
          uploadPath={`/api/announcements/${announcement.id}/attachments`}
        />
      ) : (
        <FileUploader uploader={uploader} label="Attach files (optional)" />
      )}
      <ModalActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary" loading={isSubmitting}>
          Save
        </Button>
      </ModalActions>
    </form>
  )
}
