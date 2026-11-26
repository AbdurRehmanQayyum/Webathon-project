import { Check, Plus } from 'lucide-react'
import { useToast } from '@/components/feedback/toast-context'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/Tooltip'
import { useCurrentUser } from '@/features/auth/current-user'
import { permissions } from '@/features/auth/permissions'
import { useMembership } from './api'
import type { Club } from './types'

export function MembershipButton({ club }: { club: Club }) {
  const membership = useMembership(club.id)
  const toast = useToast()
  const { can } = useCurrentUser()

  const change = (join: boolean) =>
    membership.mutate(join, {
      onSuccess: () => toast.success(join ? `Joined ${club.name}` : `Left ${club.name}`),
      onError: toast.error,
    })

  if (club.isModerator) {
    return (
      <Tooltip label="Moderators stay members while assigned">
        <span tabIndex={0} className="rounded-control text-sm font-medium text-selected-fg">
          Moderator
        </span>
      </Tooltip>
    )
  }

  if (club.isMember) {
    return (
      <Button
        size="sm"
        className="group min-w-24"
        disabled={membership.isPending}
        aria-label={`Leave ${club.name}`}
        onClick={() => change(false)}
      >
        <span className="inline-flex items-center gap-1.5 group-hover:hidden group-focus-visible:hidden">
          <Check className="size-4" aria-hidden="true" />
          Joined
        </span>
        <span className="hidden text-danger-fg group-hover:inline group-focus-visible:inline">
          Leave
        </span>
      </Button>
    )
  }

  if (club.status === 'Archived' || !can(permissions.joinClubs)) return null

  return (
    <Button
      size="sm"
      variant="primary"
      className="min-w-24"
      icon={<Plus className="size-4" />}
      disabled={membership.isPending}
      aria-label={`Join ${club.name}`}
      onClick={() => change(true)}
    >
      Join
    </Button>
  )
}
