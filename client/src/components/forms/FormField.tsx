import { CircleAlert } from 'lucide-react'
import { useId, type ReactNode } from 'react'

export interface FieldProps {
  id: string
  'aria-invalid': boolean | undefined
  'aria-describedby': string | undefined
}

interface FormFieldProps {
  label: string
  error?: string
  hint?: string
  optional?: boolean
  children: (field: FieldProps) => ReactNode
}

export function FormField({ label, error, hint, optional, children }: FormFieldProps) {
  const id = useId()
  const messageId = `${id}-message`

  return (
    <div className="grid min-w-0 content-start gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {optional && <span className="font-normal text-muted"> (optional)</span>}
      </label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error || hint ? messageId : undefined,
      })}
      {error ? (
        <p id={messageId} role="alert" className="flex items-start gap-1.5 text-sm text-danger-fg">
          <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : (
        hint && (
          <p id={messageId} className="text-sm text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
