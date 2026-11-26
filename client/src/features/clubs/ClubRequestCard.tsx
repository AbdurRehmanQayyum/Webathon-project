import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Alert } from '@/components/feedback/Alert'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { formatDate } from '@/lib/format'
import type { ClubRequest, ClubRequestStatus } from './types'

const statusTones: Record<ClubRequestStatus, BadgeTone> = {
  Pending: 'warning',
  Approved: 'success',
  Rejected: 'danger',
}

interface ClubRequestCardProps {
  request: ClubRequest
  showRequester?: boolean
  actions?: ReactNode
}

export function ClubRequestCard({ request, showRequester, actions }: ClubRequestCardProps) {
  return (
    <Card className="grid gap-2 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="wrap-text text-base font-semibold">{request.proposedName}</h2>
        <Badge tone={statusTones[request.status]}>{request.status}</Badge>
      </div>
      <p className="text-xs text-muted">
        {request.category.name} · Requested {formatDate(request.createdAtUtc)}
        {showRequester && ` by ${request.requestedBy.fullName}`}
        {request.reviewedBy && ` · Reviewed by ${request.reviewedBy.fullName}`}
      </p>
      <p className="wrap-text text-sm">{request.description}</p>
      <p className="wrap-text text-sm text-muted">
        <span className="font-medium text-fg">Reason: </span>
        {request.justification}
      </p>
      {request.rejectionReason && <Alert tone="danger">{request.rejectionReason}</Alert>}
      {request.createdClubSlug && (
        <Link
          to={`/clubs/${request.createdClubSlug}`}
          className="w-fit rounded text-sm font-medium text-link hover:underline"
        >
          Open the club
        </Link>
      )}
      {actions && <div className="flex flex-wrap justify-end gap-2 pt-1">{actions}</div>}
    </Card>
  )
}
