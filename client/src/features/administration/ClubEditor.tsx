import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Alert } from '@/components/feedback/Alert'
import { useToast } from '@/components/feedback/toast-context'
import { FormField } from '@/components/forms/FormField'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Modal, ModalActions } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { useCategories } from '@/features/clubs/api'
import { clubSchema, type ClubValues } from '@/features/clubs/schemas'
import type { Club } from '@/features/clubs/types'
import { ImageUploader } from '@/features/files/ImageUploader'
import { applyServerErrors } from '@/lib/form-errors'
import { useClubAdminActions } from './api'

interface ClubEditorProps {
  club: Club | null
  onClose: () => void
}

export function ClubEditor({ open, ...props }: ClubEditorProps & { open: boolean }) {
  return (
    <Modal open={open} onClose={props.onClose} title={props.club ? 'Edit club' : 'New club'} size="wide">
      <ClubForm {...props} />
    </Modal>
  )
}

function ClubForm({ club, onClose }: ClubEditorProps) {
  const categories = useCategories()
  const { save } = useClubAdminActions()
  const toast = useToast()
  const [formError, setFormError] = useState<string | null>(null)
  const { register, control, handleSubmit, setError, formState } = useForm<ClubValues>({
    resolver: zodResolver(clubSchema),
    defaultValues: {
      name: club?.name ?? '',
      categoryId: club ? String(club.category.id) : '',
      description: club?.description ?? '',
      rules: club?.rules ?? '',
    },
  })
  const { errors } = formState

  const submit = handleSubmit((values) => {
    setFormError(null)
    save.mutate(
      { ...values, id: club?.id },
      {
        onSuccess: () => {
          toast.success(club ? 'Club updated' : 'Club created')
          onClose()
        },
        onError: (error) =>
          setFormError(
            applyServerErrors(error, setError, ['name', 'categoryId', 'description', 'rules']),
          ),
      },
    )
  })

  return (
    <>
      <form onSubmit={submit} noValidate className="grid gap-4">
        {formError && <Alert tone="danger">{formError}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Club name" error={errors.name?.message}>
            {(field) => <Input {...field} {...register('name')} />}
          </FormField>
          <FormField label="Category" error={errors.categoryId?.message}>
            {(field) => (
              <Controller
                control={control}
                name="categoryId"
                render={({ field: input }) => (
                  <Select
                    {...field}
                    value={input.value}
                    onChange={input.onChange}
                    options={(categories.data ?? []).map((category) => ({
                      value: String(category.id),
                      label: category.name,
                    }))}
                    placeholder="Choose a category"
                  />
                )}
              />
            )}
          </FormField>
        </div>
        <FormField label="Description" error={errors.description?.message}>
          {(field) => <Textarea {...field} {...register('description')} rows={3} />}
        </FormField>
        <FormField label="Rules" optional error={errors.rules?.message}>
          {(field) => <Textarea {...field} {...register('rules')} rows={4} />}
        </FormField>
        <ModalActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" loading={save.isPending}>
            Save club
          </Button>
        </ModalActions>
      </form>
      {club && (
        <div className="mt-6 grid gap-6 border-t border-line pt-5">
          <ImageUploader
            title="Logo"
            shape="square"
            fileId={club.logoFileId}
            uploadPath={`/api/clubs/${club.id}/logo`}
          />
          <ImageUploader
            title="Cover"
            shape="wide"
            fileId={club.coverFileId}
            uploadPath={`/api/clubs/${club.id}/cover`}
          />
        </div>
      )}
    </>
  )
}
