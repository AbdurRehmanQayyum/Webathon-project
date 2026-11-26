import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Alert } from '@/components/feedback/Alert'
import { useToast } from '@/components/feedback/toast-context'
import { FormField } from '@/components/forms/FormField'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useCurrentUser } from '@/features/auth/current-user'
import { fullNameSchema, semesterOptions } from '@/features/auth/schemas'
import { applyServerErrors } from '@/lib/form-errors'
import { useUpdateProfile } from './api'

const profileSchema = z.object({
  fullName: fullNameSchema,
  semester: z.string(),
  bio: z.string().max(500, 'Keep it under 500 characters.'),
})

type ProfileValues = z.infer<typeof profileSchema>

export function ProfileForm() {
  const { user } = useCurrentUser()
  const updateProfile = useUpdateProfile()
  const toast = useToast()
  const [formError, setFormError] = useState<string | null>(null)
  const { register, control, handleSubmit, setError, formState } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user.fullName,
      semester: user.semester ? String(user.semester) : 'none',
      bio: user.bio ?? '',
    },
  })
  const { errors } = formState

  const submit = handleSubmit((values) => {
    setFormError(null)
    updateProfile.mutate(
      {
        fullName: values.fullName,
        semester: values.semester === 'none' ? null : Number(values.semester),
        bio: values.bio.trim() || null,
      },
      {
        onSuccess: () => toast.success('Profile updated'),
        onError: (error) =>
          setFormError(applyServerErrors(error, setError, ['fullName', 'semester', 'bio'])),
      },
    )
  })

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      {formError && <Alert tone="danger">{formError}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Full name" error={errors.fullName?.message}>
          {(field) => <Input {...field} {...register('fullName')} autoComplete="name" />}
        </FormField>
        <FormField label="Semester" error={errors.semester?.message}>
          {(field) => (
            <Controller
              control={control}
              name="semester"
              render={({ field: input }) => (
                <Select
                  {...field}
                  value={input.value}
                  onChange={input.onChange}
                  options={[{ value: 'none', label: 'Not applicable' }, ...semesterOptions]}
                />
              )}
            />
          )}
        </FormField>
      </div>
      {user.registrationNumber && (
        <p className="text-sm text-muted">Registration number: {user.registrationNumber}</p>
      )}
      <FormField label="About you" optional error={errors.bio?.message}>
        {(field) => <Textarea {...field} {...register('bio')} rows={3} />}
      </FormField>
      <div className="flex justify-end">
        <Button type="submit" variant="primary" loading={updateProfile.isPending}>
          Save profile
        </Button>
      </div>
    </form>
  )
}
