import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { FormField } from '@/components/forms/FormField'
import { Alert } from '@/components/feedback/Alert'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Select } from '@/components/ui/Select'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { applyServerErrors } from '@/lib/form-errors'
import { useRegister } from './api'
import { registerSchema, semesterOptions, type RegisterValues } from './schemas'

export function RegisterPage() {
  useDocumentTitle('Create account')
  const registration = useRegister()
  const [formError, setFormError] = useState<string | null>(null)
  const { register, control, handleSubmit, setError, formState } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      registrationNumber: '',
      semester: '',
      password: '',
      confirmPassword: '',
      bio: '',
    },
  })
  const { errors } = formState

  const submit = handleSubmit((values) => {
    setFormError(null)
    registration.mutate(
      {
        fullName: values.fullName,
        email: values.email,
        registrationNumber: values.registrationNumber,
        password: values.password,
        semester: Number(values.semester),
        bio: values.bio.trim() || null,
      },
      {
        onError: (error) =>
          setFormError(
            applyServerErrors(error, setError, [
              'fullName',
              'email',
              'registrationNumber',
              'password',
              'bio',
            ]),
          ),
      },
    )
  })

  return (
    <>
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <p className="mt-1 text-sm text-muted">For students of the Computer Science Department.</p>

      <form onSubmit={submit} noValidate className="mt-6 grid gap-4">
        {formError && <Alert tone="danger">{formError}</Alert>}
        <FormField label="Full name" error={errors.fullName?.message}>
          {(field) => <Input {...field} {...register('fullName')} autoComplete="name" />}
        </FormField>
        <FormField label="Email" error={errors.email?.message}>
          {(field) => <Input {...field} {...register('email')} type="email" autoComplete="email" />}
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Registration number" error={errors.registrationNumber?.message}>
            {(field) => <Input {...field} {...register('registrationNumber')} autoComplete="off" />}
          </FormField>
          <FormField label="Semester" error={errors.semester?.message}>
            {(field) => (
              <Controller
                control={control}
                name="semester"
                render={({ field: control }) => (
                  <Select
                    {...field}
                    value={control.value}
                    onChange={control.onChange}
                    options={semesterOptions}
                    placeholder="Choose"
                  />
                )}
              />
            )}
          </FormField>
        </div>
        <FormField
          label="Password"
          error={errors.password?.message}
          hint="At least 8 characters with a letter and a number."
        >
          {(field) => (
            <PasswordInput {...field} {...register('password')} autoComplete="new-password" />
          )}
        </FormField>
        <FormField label="Confirm password" error={errors.confirmPassword?.message}>
          {(field) => (
            <PasswordInput
              {...field}
              {...register('confirmPassword')}
              autoComplete="new-password"
            />
          )}
        </FormField>
        <FormField label="About you" optional error={errors.bio?.message}>
          {(field) => <Textarea {...field} {...register('bio')} rows={2} />}
        </FormField>
        <Button type="submit" variant="primary" loading={registration.isPending}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Already registered?{' '}
        <Link to="/login" className="rounded font-medium text-link hover:underline">
          Sign in
        </Link>
      </p>
    </>
  )
}
