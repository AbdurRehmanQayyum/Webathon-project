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
import { applyServerErrors } from '@/lib/form-errors'
import { useCategories, useSubmitClubRequest } from './api'
import { clubRequestSchema, type ClubRequestValues } from './schemas'

export function ClubRequestDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request a new club"
      description="An administrator reviews each request."
    >
      <ClubRequestForm onClose={onClose} />
    </Modal>
  )
}

function ClubRequestForm({ onClose }: { onClose: () => void }) {
  const categories = useCategories()
  const submitRequest = useSubmitClubRequest()
  const toast = useToast()
  const [formError, setFormError] = useState<string | null>(null)
  const { register, control, handleSubmit, setError, formState } = useForm<ClubRequestValues>({
    resolver: zodResolver(clubRequestSchema),
    defaultValues: { proposedName: '', categoryId: '', description: '', justification: '' },
  })
  const { errors } = formState

  const submit = handleSubmit((values) => {
    setFormError(null)
    submitRequest.mutate(values, {
      onSuccess: () => {
        toast.success('Request sent for review')
        onClose()
      },
      onError: (error) =>
        setFormError(
          applyServerErrors(error, setError, [
            'proposedName',
            'categoryId',
            'description',
            'justification',
          ]),
        ),
    })
  })

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      {formError && <Alert tone="danger">{formError}</Alert>}
      <FormField label="Club name" error={errors.proposedName?.message}>
        {(field) => <Input {...field} {...register('proposedName')} />}
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
      <FormField label="What will the club do?" error={errors.description?.message}>
        {(field) => <Textarea {...field} {...register('description')} rows={3} />}
      </FormField>
      <FormField label="Why is it needed?" error={errors.justification?.message}>
        {(field) => <Textarea {...field} {...register('justification')} rows={3} />}
      </FormField>
      <ModalActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary" loading={submitRequest.isPending}>
          Send request
        </Button>
      </ModalActions>
    </form>
  )
}
