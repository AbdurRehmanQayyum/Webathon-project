import { useState } from 'react'
import { FormField } from '@/components/forms/FormField'
import { Button } from './Button'
import { Textarea } from './Input'
import { Modal, ModalActions } from './Modal'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  title: string
  description: string
  confirmLabel: string
  onConfirm: (reason: string) => void
  loading?: boolean
  danger?: boolean
  reason?: { label: string; required: boolean }
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={props.title}
      description={props.description}
    >
      {/* Mounted with the dialog, so the reason starts empty every time */}
      <ConfirmForm {...props} />
    </Modal>
  )
}

function ConfirmForm({
  onClose,
  confirmLabel,
  onConfirm,
  loading,
  danger,
  reason,
}: ConfirmDialogProps) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string>()

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (reason?.required && text.trim().length < 5) {
          setError('Give a reason of at least 5 characters.')
          return
        }
        onConfirm(text.trim())
      }}
    >
      {reason && (
        <FormField label={reason.label} error={error} optional={!reason.required}>
          {(field) => (
            <Textarea
              {...field}
              rows={3}
              maxLength={500}
              value={text}
              onChange={(event) => {
                setText(event.target.value)
                setError(undefined)
              }}
            />
          )}
        </FormField>
      )}
      <ModalActions>
        <Button onClick={onClose}>Keep as is</Button>
        <Button type="submit" variant={danger ? 'danger' : 'primary'} loading={loading}>
          {confirmLabel}
        </Button>
      </ModalActions>
    </form>
  )
}
