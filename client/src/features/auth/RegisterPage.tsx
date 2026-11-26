import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import { useState, type FormEvent } from 'react'
import { Controller, useForm, useWatch, type Path } from 'react-hook-form'
import { Link } from 'react-router'
import { FormField } from '@/components/forms/FormField'
import { Alert } from '@/components/feedback/Alert'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Select } from '@/components/ui/Select'
import { InterestPicker } from '@/features/clubs/InterestPicker'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { applyServerErrors } from '@/lib/form-errors'
import { ApiError } from '@/services/api-client'
import { useRegister } from './api'
import { PasswordChecklist } from './PasswordChecklist'
import { registerSchema, semesterOptions, type RegisterValues } from './schemas'
import { StepIndicator } from './StepIndicator'

const steps: { title: string; hint: string; fields: Path<RegisterValues>[] }[] = [
  {
    title: 'Your details',
    hint: 'Tell us who you are in the department.',
    fields: ['fullName', 'email', 'registrationNumber', 'semester'],
  },
  {
    title: 'Password',
    hint: 'Choose a password only you know.',
    fields: ['password', 'confirmPassword'],
  },
  {
    title: 'Interests',
    hint: 'Optional. We use this to suggest clubs you might like.',
    fields: ['interestIds', 'bio'],
  },
]

export function RegisterPage() {
  useDocumentTitle('Create account')
  const registration = useRegister()
  const [step, setStep] = useState(0)
  const [formError, setFormError] = useState<string | null>(null)
  const { register, control, handleSubmit, setError, trigger, formState } = useForm<RegisterValues>(
    {
      resolver: zodResolver(registerSchema),
      defaultValues: {
        fullName: '',
        email: '',
        registrationNumber: '',
        semester: '',
        password: '',
        confirmPassword: '',
        bio: '',
        interestIds: [],
      },
    },
  )
  const [password, confirm] = useWatch({ control, name: ['password', 'confirmPassword'] })
  const { errors } = formState
  const isLast = step === steps.length - 1

  // Returns to whichever step holds the first rejected field
  const showStepWith = (names: string[]) => {
    const index = steps.findIndex((item) => item.fields.some((field) => names.includes(field)))
    if (index >= 0) setStep(index)
  }

  const create = handleSubmit(
    (values) => {
      setFormError(null)
      registration.mutate(
        {
          fullName: values.fullName,
          email: values.email,
          registrationNumber: values.registrationNumber,
          password: values.password,
          semester: Number(values.semester),
          bio: values.bio.trim() || null,
          interestIds: values.interestIds,
        },
        {
          onError: (error) => {
            setFormError(
              applyServerErrors(
                error,
                setError,
                steps.flatMap((item) => item.fields),
              ),
            )
            if (error instanceof ApiError) showStepWith(Object.keys(error.fieldErrors))
          },
        },
      )
    },
    (invalid) => showStepWith(Object.keys(invalid)),
  )

  // Enter and the main button advance until the last step, which creates the account
  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (isLast) return create(event)
    if (await trigger(steps[step]?.fields, { shouldFocus: true })) {
      setFormError(null)
      setStep(step + 1)
    }
  }

  return (
    <>
      <header className="text-center">
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <p className="mt-1 text-sm text-muted">For students of the Computer Science Department.</p>
      </header>

      <div className="mt-6">
        <StepIndicator
          titles={steps.map((item) => item.title)}
          current={step}
          onSelect={setStep}
        />
      </div>

      <form onSubmit={(event) => void onSubmit(event)} noValidate className="mt-6 grid gap-5">
        {formError && <Alert tone="danger">{formError}</Alert>}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="grid gap-4"
        >
          <p className="text-center text-sm text-muted">{steps[step]?.hint}</p>

          {step === 0 && (
            <>
              <FormField label="Full name" error={errors.fullName?.message}>
                {(field) => (
                  <Input {...field} {...register('fullName')} autoComplete="name" autoFocus />
                )}
              </FormField>
              <FormField label="Email" error={errors.email?.message}>
                {(field) => (
                  <Input {...field} {...register('email')} type="email" autoComplete="email" />
                )}
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Registration number" error={errors.registrationNumber?.message}>
                  {(field) => (
                    <Input {...field} {...register('registrationNumber')} autoComplete="off" />
                  )}
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
                          options={semesterOptions}
                          placeholder="Choose"
                        />
                      )}
                    />
                  )}
                </FormField>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <FormField label="Password" error={errors.password?.message}>
                {(field) => (
                  <PasswordInput
                    {...field}
                    {...register('password')}
                    autoComplete="new-password"
                    autoFocus
                  />
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
              <PasswordChecklist password={password} confirm={confirm} />
            </>
          )}

          {step === 2 && (
            <>
              <Controller
                control={control}
                name="interestIds"
                render={({ field }) => (
                  <InterestPicker
                    className="justify-center"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              <FormField label="About you" optional error={errors.bio?.message}>
                {(field) => <Textarea {...field} {...register('bio')} rows={3} />}
              </FormField>
            </>
          )}
        </motion.div>

        <div className="flex gap-2">
          {step > 0 && (
            <Button icon={<ArrowLeft className="size-4" />} onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          {/* A fresh button per step, so a double click cannot submit the next one */}
          <Button
            key={step}
            type="submit"
            variant="primary"
            className="flex-1"
            loading={registration.isPending}
          >
            {isLast ? 'Create account' : 'Continue'}
            {!isLast && <ArrowRight className="size-4" aria-hidden="true" />}
          </Button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already registered?{' '}
        <Link to="/login" className="rounded font-medium text-link hover:underline">
          Sign in
        </Link>
      </p>
    </>
  )
}
