import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { FormField } from '@/components/forms/FormField'
import { Alert } from '@/components/feedback/Alert'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { applyServerErrors } from '@/lib/form-errors'
import { useLogin } from './api'
import { loginSchema, type LoginValues } from './schemas'

export function LoginPage() {
  useDocumentTitle('Sign in')
  const login = useLogin()
  const [formError, setFormError] = useState<string | null>(null)
  const { register, control, handleSubmit, setError, formState } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  })

  const submit = handleSubmit((values) => {
    setFormError(null)
    login.mutate(values, {
      onError: (error) => setFormError(applyServerErrors(error, setError, ['email', 'password'])),
    })
  })

  return (
    <>
      <h1 className="text-2xl font-semibold">Welcome back</h1>
      <p className="mt-1 text-sm text-muted">Sign in to your department community.</p>

      <form onSubmit={submit} noValidate className="mt-6 grid gap-4">
        {formError && <Alert tone="danger">{formError}</Alert>}
        <FormField label="Email" error={formState.errors.email?.message}>
          {(field) => (
            <Input {...field} {...register('email')} type="email" autoComplete="username" />
          )}
        </FormField>
        <FormField label="Password" error={formState.errors.password?.message}>
          {(field) => (
            <PasswordInput {...field} {...register('password')} autoComplete="current-password" />
          )}
        </FormField>
        <Controller
          control={control}
          name="rememberMe"
          render={({ field }) => (
            <Checkbox
              label="Keep me signed in on this device"
              checked={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Button type="submit" variant="primary" loading={login.isPending}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted">
        New to Campus Connect?{' '}
        <Link to="/register" className="rounded font-medium text-link hover:underline">
          Create a student account
        </Link>
      </p>
    </>
  )
}
