import { UserMinus } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/components/feedback/toast-context'
import { Combobox } from '@/components/forms/Combobox'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { Club } from '@/features/clubs/types'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useClubAdminActions, useUserSearch } from './api'

export function ModeratorsDialog({ club, onClose }: { club: Club | null; onClose: () => void }) {
  return (
    <Modal
      open={club !== null}
      onClose={onClose}
      title="Moderators"
      description={club ? `Moderators manage content in ${club.name} only.` : undefined}
    >
      {club && <ModeratorManager club={club} />}
    </Modal>
  )
}

function ModeratorManager({ club }: { club: Club }) {
  const [query, setQuery] = useState('')
  const search = useDebouncedValue(query.trim())
  const users = useUserSearch(search)
  const { assignModerator, removeModerator } = useClubAdminActions()
  const toast = useToast()

  const options = (users.data ?? [])
    .filter((user) => !club.moderators.some((moderator) => moderator.id === user.id))
    .map((user) => ({ id: user.id, label: user.fullName, detail: `@${user.username}` }))

  return (
    <div className="grid min-h-64 content-start gap-4">
      <Combobox
        label="Search users to assign"
        query={query}
        onQueryChange={setQuery}
        options={search ? options : []}
        loading={users.isFetching || query.trim() !== search}
        disabled={assignModerator.isPending}
        onSelect={(option) =>
          assignModerator.mutate(
            { clubId: club.id, userId: option.id },
            {
              onSuccess: () => {
                setQuery('')
                toast.success(`${option.label} is now a moderator`)
              },
              onError: toast.error,
            },
          )
        }
      />
      {club.moderators.length === 0 ? (
        <p className="text-sm text-muted">No moderators assigned yet.</p>
      ) : (
        <ul className="divide-y divide-line rounded-control border border-line">
          {club.moderators.map((moderator) => (
            <li key={moderator.id} className="flex items-center gap-3 p-2.5">
              <Avatar name={moderator.fullName} fileId={moderator.avatarFileId} />
              <span className="wrap-text flex-1 text-sm font-medium">{moderator.fullName}</span>
              <Button
                size="sm"
                icon={<UserMinus className="size-4" />}
                disabled={removeModerator.isPending}
                onClick={() =>
                  removeModerator.mutate(
                    { clubId: club.id, userId: moderator.id },
                    {
                      onSuccess: () => toast.success('Moderator removed'),
                      onError: toast.error,
                    },
                  )
                }
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
