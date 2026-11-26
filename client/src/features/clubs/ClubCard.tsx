import { Link } from 'react-router'
import { Card } from '@/components/ui/Card'
import { pluralize } from '@/lib/format'
import { ClubIcon } from './ClubIcon'
import { MembershipButton } from './MembershipButton'
import type { Club } from './types'

export function ClubCard({ club }: { club: Club }) {
  return (
    <Card className="flex flex-col gap-3 p-4 transition-colors hover:border-line-strong">
      <div className="flex items-start gap-3">
        <ClubIcon iconKey={club.category.iconKey} logoFileId={club.logoFileId} />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">
            <Link to={`/clubs/${club.slug}`} className="wrap-text rounded hover:text-link">
              {club.name}
            </Link>
          </h2>
          <p className="text-xs text-muted">{club.category.name}</p>
        </div>
      </div>
      <p className="line-clamp-3 text-sm text-muted">{club.description}</p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <p className="text-xs text-muted">
          {pluralize(club.memberCount, 'member')} · {pluralize(club.postCount, 'post')}
        </p>
        <MembershipButton club={club} />
      </div>
    </Card>
  )
}
