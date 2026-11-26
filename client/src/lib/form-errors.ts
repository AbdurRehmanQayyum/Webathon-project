import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiError } from '@/services/api-client'

// Maps server validation errors onto form fields; returns a message for anything else
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
) {
  if (!(error instanceof ApiError)) return 'Something went wrong. Try again.'

  const matched = fields.filter((field) => error.fieldErrors[field])
  matched.forEach((field, index) =>
    setError(field, { message: error.fieldErrors[field] }, { shouldFocus: index === 0 }),
  )
  return matched.length > 0 ? null : error.message
}
