import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router'
import { PageHeader } from '@/components/common/PageHeader'
import { QueryState } from '@/components/common/QueryState'
import { Alert } from '@/components/feedback/Alert'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useToast } from '@/components/feedback/toast-context'
import { FormField } from '@/components/forms/FormField'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Select } from '@/components/ui/Select'
import { useCurrentUser } from '@/features/auth/current-user'
import { useClubs } from '@/features/clubs/api'
import type { Club } from '@/features/clubs/types'
import { MAX_ATTACHMENTS } from '@/features/files/AttachmentManager'
import { FileUploader } from '@/features/files/FileUploader'
import { useFileUploader } from '@/features/files/useFileUploader'
import { applyServerErrors } from '@/lib/form-errors'
import { useCreatePost } from './api'
import { postSchema, type PostValues } from './schemas'

export function CreatePostPage() {
  const { isAdmin } = useCurrentUser()
  const clubs = useClubs({ joinedOnly: !isAdmin, sort: 'Name', pageSize: 100 })

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Create a post" description="Share a question, a resource or an update." />
      <QueryState
        query={clubs}
        isEmpty={(data) => data.items.length === 0}
        empty={
          <EmptyState
            title="Join a club first"
            description="Posts live inside clubs. Join one to start a discussion."
            action={
              <ButtonLink to="/clubs" variant="primary">
                Browse clubs
              </ButtonLink>
            }
          />
        }
      >
        {(data) => <CreatePostForm clubs={data.items} />}
      </QueryState>
    </div>
  )
}

function CreatePostForm({ clubs }: { clubs: Club[] }) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const createPost = useCreatePost()
  const uploader = useFileUploader({ maxFiles: MAX_ATTACHMENTS })
  const [formError, setFormError] = useState<string | null>(null)
  const requested = searchParams.get('club') ?? ''

  const { register, control, handleSubmit, setError, formState } = useForm<PostValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      clubId: clubs.some((club) => String(club.id) === requested) ? requested : '',
      type: 'Text',
      title: '',
      body: '',
      linkUrl: '',
    },
  })
  const type = useWatch({ control, name: 'type' })
  const { errors, isSubmitting } = formState

  const submit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      const { id } = await createPost.mutateAsync({
        clubId: Number(values.clubId),
        type: values.type,
        title: values.title,
        body: values.body.trim() || null,
        linkUrl: values.type === 'Link' ? values.linkUrl.trim() : null,
      })
      const failures = await uploader.uploadAll(`/api/posts/${id}/attachments`)
      if (failures > 0) {
        toast.error(
          new Error(`Post published, but ${failures} file(s) failed. Add them by editing.`),
        )
      } else {
        toast.success('Post published')
      }
      await navigate(`/posts/${id}`)
    } catch (error) {
      setFormError(applyServerErrors(error, setError, ['clubId', 'title', 'body', 'linkUrl']))
    }
  })

  return (
    <Card className="p-4 sm:p-6">
      <form onSubmit={submit} noValidate className="grid gap-4">
        {formError && <Alert tone="danger">{formError}</Alert>}
        <FormField label="Club" error={errors.clubId?.message}>
          {(field) => (
            <Controller
              control={control}
              name="clubId"
              render={({ field: input }) => (
                <Select
                  {...field}
                  value={input.value}
                  onChange={input.onChange}
                  options={clubs.map((club) => ({ value: String(club.id), label: club.name }))}
                  placeholder="Choose a club"
                />
              )}
            />
          )}
        </FormField>
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <SegmentedControl
              label="Post type"
              value={field.value}
              onChange={field.onChange}
              segments={[
                { value: 'Text', label: 'Text post' },
                { value: 'Link', label: 'Link' },
              ]}
              className="w-full sm:w-72"
            />
          )}
        />
        <FormField label="Title" error={errors.title?.message}>
          {(field) => <Input {...field} {...register('title')} maxLength={200} />}
        </FormField>
        {type === 'Link' && (
          <FormField label="Web address" error={errors.linkUrl?.message}>
            {(field) => (
              <Input {...field} {...register('linkUrl')} type="url" placeholder="https://" />
            )}
          </FormField>
        )}
        <FormField
          label={type === 'Text' ? 'Body' : 'Description'}
          optional={type === 'Link'}
          error={errors.body?.message}
        >
          {(field) => <Textarea {...field} {...register('body')} rows={7} />}
        </FormField>
        <FileUploader uploader={uploader} label="Attach images or documents (optional)" />
        <div className="flex justify-end gap-2">
          <Button onClick={() => void navigate(-1)}>Cancel</Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            Publish post
          </Button>
        </div>
      </form>
    </Card>
  )
}
