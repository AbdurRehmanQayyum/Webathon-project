import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import { QueryState } from '@/components/common/QueryState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ListSkeleton } from '@/components/feedback/Skeleton'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { SearchInput } from '@/components/ui/SearchInput'
import type { Club } from '@/features/clubs/types'
import { formatDate, pluralize } from '@/lib/format'
import { useClubMembers } from './api'

export function MembersDialog({ club, onClose }: { club: Club | null; onClose: () => void }) {
  return (
    <Modal
      open={club !== null}
      onClose={onClose}
      title="Members"
      description={club ? `${pluralize(club.memberCount, 'member')} of ${club.name}` : undefined}
      size="wide"
    >
      {club && <MemberList clubId={club.id} />}
    </Modal>
  )
}

function MemberList({ clubId }: { clubId: number }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const members = useClubMembers(clubId, { search, pageNumber: page, pageSize: 10 })
  const onSearch = useCallback((value: string) => {
    setSearch(value)
    setPage(1)
  }, [])

  return (
    <div className="grid min-h-72 content-start gap-3">
      <SearchInput
        label="Search name, username or registration number"
        value={search}
        onSearch={onSearch}
      />
      <QueryState
        query={members}
        view={`${search}:${page}`}
        skeleton={<ListSkeleton rows={2} />}
        isEmpty={(data) => data.items.length === 0}
        empty={
          <EmptyState
            title={search ? 'No members match' : 'No members yet'}
            description={search ? 'Try a different search.' : 'Students appear here once they join.'}
          />
        }
      >
        {(data) => (
          <>
            <ul className="divide-y divide-line rounded-control border border-line">
              {data.items.map((member) => (
                <li key={member.id} className="flex items-start gap-3 p-3">
                  <Avatar name={member.fullName} fileId={member.avatarFileId} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <Link
                        to={`/users/${member.id}`}
                        className="wrap-text text-sm font-medium hover:text-link"
                      >
                        {member.fullName}
                      </Link>
                      {member.isModerator && <Badge tone="primary">Moderator</Badge>}
                      {!member.isActive && <Badge tone="danger">Deactivated</Badge>}
                    </p>
                    <p className="wrap-text text-xs text-muted">
                      {[
                        `@${member.username}`,
                        member.email,
                        member.registrationNumber,
                        member.semester ? `Semester ${member.semester}` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    <p className="text-xs text-muted">Joined {formatDate(member.joinedAtUtc)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Pagination page={data.pageNumber} totalPages={data.totalPages} onChange={setPage} />
          </>
        )}
      </QueryState>
    </div>
  )
}
