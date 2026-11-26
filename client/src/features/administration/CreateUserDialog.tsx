import { zodResolver } from '@hookform/resolvers/zod'
import { Copy, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Alert } from '@/components/feedback/Alert'
import { useToast } from '@/components/feedback/toast-context'
import { FormField } from '@/components/forms/FormField'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Input } from '@/components/ui/Input'
import { Modal, ModalActions } from '@/components/ui/Modal'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Select } from '@/components/ui/Select'
import { fullNameSchema, passwordSchema, semesterOptions } from '@/features/auth/schemas'
import { applyServerErrors } from '@/lib/form-errors'
import { generatePassword } from '@/lib/password'
import { useUserActions } from './api'

const userSchema = z
  .object({
    fullName: fullNameSchema,
    email: z.email('Enter a valid email address.').max(256),
    role: z.enum(['Student', 'Admin']),
    registrationNumber: z
      .string()
      .trim()
      .max(30)
      .regex(/^[A-Za-z0-9\-/]*$/, 'Use letters, numbers, hyphens or slashes only.'),
    semester: z.string(),
    title: z.string().max(60),
    temporaryPassword: passwordSchema,
  })
  .refine((values) => values.role !== 'Student' || values.registrationNumber.length > 0, {
    path: ['registrationNumber'],
    message: 'Students need a registration number.',
  })

type UserValues = z.infer<typeof userSchema>

export function CreateUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New user"
      description="The person must replace the temporary password at first sign-in."
      size="wide"
    >
      <CreateUserForm onClose={onClose} />
    </Modal>
  )
}

function CreateUserForm({ onClose }: { onClose: () => void }) {
  const { create } = useUserActions()
  const toast = useToast()
  const [formError, setFormError] = useState<string | null>(null)
  const [initialPassword] = useState(generatePassword)
  const { register, control, handleSubmit, setError, setValue, getValues, formState } =
    useForm<UserValues>({
      resolver: zodResolver(userSchema),
      defaultValues: {
        fullName: '',
        email: '',
        role: 'Student',
        registrationNumber: '',
        semester: 'none',
        title: '',
        temporaryPassword: initialPassword,
      },
    })
  const role = useWatch({ control, name: 'role' })
  const { errors } = formState

  const copy = () =>
    navigator.clipboard
      .writeText(getValues('temporaryPassword'))
      .then(() => toast.success('Password copied'))
      .catch(() => toast.error(new Error('Copying is blocked by this browser.')))

  const submit = handleSubmit((values) => {
    setFormError(null)
    const isStudent = values.role === 'Student'
    create.mutate(
      {
        fullName: values.fullName,
        email: values.email,
        role: values.role,
        registrationNumber: isStudent ? values.registrationNumber : null,
        semester: isStudent && values.semester !== 'none' ? Number(values.semester) : null,
        title: isStudent ? null : values.title.trim() || null,
        temporaryPassword: values.temporaryPassword,
      },
      {
        onSuccess: () => {
          toast.success(`${values.fullName} can now sign in`)
          onClose()
        },
        onError: (error) =>
          setFormError(
            applyServerErrors(error, setError, [
              'fullName',
              'email',
              'registrationNumber',
              'semester',
              'title',
              'temporaryPassword',
            ]),
          ),
      },
    )
  })

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      {formError && <Alert tone="danger">{formError}</Alert>}
      <Controller
        control={control}
        name="role"
        render={({ field }) => (
          <SegmentedControl
            label="Role"
            value={field.value}
            onChange={field.onChange}
            segments={[
              { value: 'Student', label: 'Student' },
              { value: 'Admin', label: 'Administrator' },
            ]}
            className="w-full sm:w-72"
          />
        )}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Full name" error={errors.fullName?.message}>
          {(field) => <Input {...field} {...register('fullName')} autoComplete="off" />}
        </FormField>
        <FormField label="Email" error={errors.email?.message}>
          {(field) => <Input {...field} {...register('email')} type="email" autoComplete="off" />}
        </FormField>
        {role === 'Student' ? (
          <>
            <FormField label="Registration number" error={errors.registrationNumber?.message}>
              {(field) => <Input {...field} {...register('registrationNumber')} autoComplete="off" />}
            </FormField>
            <FormField label="Semester" optional error={errors.semester?.message}>
              {(field) => (
                <Controller
                  control={control}
                  name="semester"
                  render={({ field: input }) => (
                    <Select
                      {...field}
                      value={input.value}
                      onChange={input.onChange}
                      options={[{ value: 'none', label: 'Not set' }, ...semesterOptions]}
                    />
                  )}
                />
              )}
            </FormField>
          </>
        ) : (
          <FormField label="Title" optional error={errors.title?.message}>
            {(field) => <Input {...field} {...register('title')} maxLength={60} />}
          </FormField>
        )}
      </div>
      <FormField label="Temporary password" error={errors.temporaryPassword?.message}>
        {(field) => (
          <div className="flex gap-2">
            <Input
              {...field}
              {...register('temporaryPassword')}
              autoComplete="off"
              spellCheck={false}
              className="font-mono"
            />
            <IconButton
              label="Generate another password"
              icon={<RefreshCw className="size-4" />}
              onClick={() =>
                setValue('temporaryPassword', generatePassword(), { shouldValidate: true })
              }
            />
            <IconButton label="Copy password" icon={<Copy className="size-4" />} onClick={copy} />
          </div>
        )}
      </FormField>
      <ModalActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary" loading={create.isPending}>
          Create user
        </Button>
      </ModalActions>
    </form>
  )
}
