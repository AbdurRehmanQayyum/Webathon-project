import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'

interface CommentFormProps {
  label: string
  submitLabel: string
  initialValue?: string
  loading: boolean
  autoFocus?: boolean
  onSubmit: (body: string, reset: () => void) => void
  onCancel?: () => void
}

export function CommentForm({
  label,
  submitLabel,
  initialValue = '',
  loading,
  autoFocus,
  onSubmit,
  onCancel,
}: CommentFormProps) {
  const [body, setBody] = useState(initialValue)
  const isEmpty = body.trim().length === 0

  const submit = () => {
    if (!isEmpty && !loading) onSubmit(body.trim(), () => setBody(''))
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      className="grid gap-2"
    >
      <Textarea
        aria-label={label}
        placeholder={label}
        rows={3}
        maxLength={4000}
        value={body}
        autoFocus={autoFocus}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) submit()
        }}
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" variant="primary" loading={loading} disabled={isEmpty}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
