import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router'
import { Breadcrumb, PageHeader } from '@/components/common/PageHeader'
import { QueryState } from '@/components/common/QueryState'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { Alert } from '@/components/feedback/Alert'
import { useToast } from '@/components/feedback/toast-context'
import { FormField } from '@/components/forms/FormField'
import { TagInput } from '@/components/forms/TagInput'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { AccessDeniedPage } from '@/features/auth/StatusPages'
import { AttachmentManager } from '@/features/files/AttachmentManager'
import { applyServerErrors } from '@/lib/form-errors'
import { usePost, useUpdatePost } from './api'
import { postSchema, type PostValues } from './schemas'
import type { Post } from './types'

export function EditPostPage() {
  const postId = Number(useParams().postId)
  const post = usePost(postId)

  return (
    <QueryState query={post}>
      {(data) => (data.canEdit ? <EditPostForm post={data} /> : <AccessDeniedPage />)}
    </QueryState>
  )
}

function EditPostForm({ post }: { post: Post }) {
  const navigate = useNavigate()
  const toast = useToast()
  const updatePost = useUpdatePost(post.id)
  const [formError, setFormError] = useState<string | null>(null)
  const { register, control, handleSubmit, setError, formState } = useForm<PostValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      clubId: String(post.club.id),
      type: post.type,
      title: post.title,
      body: post.body ?? '',
      tags: post.tags,
      linkUrl: post.linkUrl ?? '',
    },
  })
  const { errors } = formState

  const submit = handleSubmit((values) => {
    setFormError(null)
    updatePost.mutate(
      {
        title: values.title,
        body: values.body || null,
        linkUrl: post.type === 'Link' ? values.linkUrl.trim() : null,
        tags: values.tags,
      },
      {
        onSuccess: () => {
          toast.success('Changes saved')
          void navigate(`/posts/${post.id}`)
        },
        onError: (error) =>
          setFormError(applyServerErrors(error, setError, ['title', 'body', 'linkUrl', 'tags'])),
      },
    )
  })

  return (
    <>
      <Breadcrumb items={[{ label: post.title, to: `/posts/${post.id}` }, { label: 'Edit' }]} />
      <PageHeader title="Edit post" description={post.club.name} />
      <Card className="p-4 sm:p-6">
        <form onSubmit={submit} noValidate className="grid gap-4">
          {formError && <Alert tone="danger">{formError}</Alert>}
          <FormField label="Title" error={errors.title?.message}>
            {(field) => <Input {...field} {...register('title')} maxLength={200} />}
          </FormField>
          {post.type === 'Link' && (
            <FormField label="Web address" error={errors.linkUrl?.message}>
              {(field) => <Input {...field} {...register('linkUrl')} type="url" />}
            </FormField>
          )}
          <FormField
            label={post.type === 'Text' ? 'Body' : 'Description'}
            optional={post.type === 'Link'}
            error={errors.body?.message}
          >
            {(field) => (
              <Controller
                control={control}
                name="body"
                render={({ field: input }) => (
                  <RichTextEditor
                    {...field}
                    label={post.type === 'Text' ? 'Body' : 'Description'}
                    value={input.value}
                    onChange={input.onChange}
                    maxLength={20000}
                  />
                )}
              />
            )}
          </FormField>
          <FormField label="Tags" optional error={errors.tags?.message}>
            {(field) => (
              <Controller
                control={control}
                name="tags"
                render={({ field: input }) => (
                  <TagInput {...field} value={input.value} onChange={input.onChange} />
                )}
              />
            )}
          </FormField>
          <div className="flex justify-end gap-2">
            <ButtonLink to={`/posts/${post.id}`}>Cancel</ButtonLink>
            <Button type="submit" variant="primary" loading={updatePost.isPending}>
              Save changes
            </Button>
          </div>
        </form>
      </Card>
      <section className="mt-6">
        <h2 className="mb-3 text-base font-semibold">Attachments</h2>
        <AttachmentManager
          attachments={post.attachments}
          uploadPath={`/api/posts/${post.id}/attachments`}
        />
      </section>
    </>
  )
}
