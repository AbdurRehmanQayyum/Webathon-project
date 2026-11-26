import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Alert } from '@/components/feedback/Alert'
import { useToast } from '@/components/feedback/toast-context'
import { FormField } from '@/components/forms/FormField'
import { Button } from '@/components/ui/Button'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { useChangePassword } from '@/features/auth/api'
import { changePasswordSchema, type ChangePasswordValues } from '@/features/auth/schemas'
import { applyServerErrors } from '@/lib/form-errors'

export function PasswordForm({ onChanged }: { onChanged?: () => void }) {
  const changePassword = useChangePassword()
  const toast = useToast()
  const [formError, setFormError] = useState<string | null>(null)
  const { register, handleSubmit, setError, reset, formState } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })
  const { errors } = formState

  const submit = handleSubmit(({ currentPassword, newPassword }) => {
    setFormError(null)
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          reset()
          toast.success('Password changed')
          onChanged?.()
        },
        onError: (error) =>
          setFormError(applyServerErrors(error, setError, ['currentPassword', 'newPassword'])),
      },
    )
  })

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      {formError && <Alert tone="danger">{formError}</Alert>}
      <FormField label="Current password" error={errors.currentPassword?.message}>
        {(field) => (
          <PasswordInput
            {...field}
            {...register('currentPassword')}
            autoComplete="current-password"
          />
        )}
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="New password" error={errors.newPassword?.message}>
          {(field) => (
            <PasswordInput {...field} {...register('newPassword')} autoComplete="new-password" />
          )}
        </FormField>
        <FormField label="Confirm new password" error={errors.confirmPassword?.message}>
          {(field) => (
            <PasswordInput
              {...field}
              {...register('confirmPassword')}
              autoComplete="new-password"
            />
          )}
        </FormField>
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="primary" loading={changePassword.isPending}>
          Change password
        </Button>
      </div>
    </form>
  )
}
