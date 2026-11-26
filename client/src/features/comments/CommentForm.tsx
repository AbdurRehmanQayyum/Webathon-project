import { useState } from 'react'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { Button } from '@/components/ui/Button'

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
  const isEmpty = body.length === 0

  const submit = () => {
    if (!isEmpty && !loading) onSubmit(body, () => setBody(''))
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      className="grid min-w-0 gap-2"
    >
      <RichTextEditor
        compact
        label={label}
        placeholder={`${label}. Use @ to mention and # to tag.`}
        maxLength={4000}
        value={body}
        autoFocus={autoFocus}
        onChange={setBody}
        onSubmit={submit}
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
