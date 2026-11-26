import { useState } from 'react'
import { useToast } from '@/components/feedback/toast-context'
import { FormField } from '@/components/forms/FormField'
import { Button } from '@/components/ui/Button'
import { Modal, ModalActions } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { useUserActions, type AdminUser } from './api'

const titles = ['Head of Department', 'Head CR', 'Head GR']

export function AdminRoleDialog({
  user,
  onClose,
}: {
  user: AdminUser | null
  onClose: () => void
}) {
  const isAdmin = user?.roles.includes('Admin') ?? false

  return (
    <Modal
      open={user !== null}
      onClose={onClose}
      title={isAdmin ? 'Remove administrator access?' : 'Make administrator?'}
      description={
        isAdmin
          ? `${user?.fullName} will lose platform management access.`
          : `${user?.fullName} will be able to manage the whole platform.`
      }
    >
      {user && <RoleForm user={user} isAdmin={isAdmin} onClose={onClose} />}
    </Modal>
  )
}

function RoleForm({
  user,
  isAdmin,
  onClose,
}: {
  user: AdminUser
  isAdmin: boolean
  onClose: () => void
}) {
  const { setAdmin } = useUserActions()
  const toast = useToast()
  const [title, setTitle] = useState(titles[0] ?? '')

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        setAdmin.mutate(
          { id: user.id, isAdmin: !isAdmin, title: isAdmin ? null : title },
          {
            onSuccess: () => {
              toast.success('Access updated')
              onClose()
            },
            onError: toast.error,
          },
        )
      }}
    >
      {!isAdmin && (
        <FormField label="Title" hint="All titles share the same administrator permissions.">
          {(field) => (
            <Select
              {...field}
              value={title}
              onChange={setTitle}
              options={titles.map((value) => ({ value, label: value }))}
            />
          )}
        </FormField>
      )}
      <ModalActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant={isAdmin ? 'danger' : 'primary'} loading={setAdmin.isPending}>
          {isAdmin ? 'Remove access' : 'Grant access'}
        </Button>
      </ModalActions>
    </form>
  )
}
