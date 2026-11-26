import { useLocation } from 'react-router'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Masonry } from '@/components/common/Masonry'
import { Breadcrumb, PageHeader } from '@/components/common/PageHeader'
import { QueryState } from '@/components/common/QueryState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Button } from '@/components/ui/Button'
import { useCurrentUser } from '@/features/auth/current-user'
import { permissions } from '@/features/auth/permissions'
import { Pagination } from '@/components/ui/Pagination'
import { useListParams } from '@/hooks/useListParams'
import { useMyClubRequests } from './api'
import { ClubRequestCard } from './ClubRequestCard'
import { ClubRequestDialog } from './ClubRequestDialog'

export function ClubRequestsPage() {
  const location = useLocation()
  const { page, set } = useListParams()
  const [isRequesting, setRequesting] = useState(false)
  const requests = useMyClubRequests({ pageNumber: page, pageSize: 8 })
  const { can } = useCurrentUser()

  return (
    <>
      <Breadcrumb items={[{ label: 'Clubs', to: '/clubs' }, { label: 'My requests' }]} />
      <PageHeader
        title="My club requests"
        description="Track the status of clubs you have proposed."
        actions={
          can(permissions.requestClubs) && (
            <Button
              variant="primary"
              icon={<Plus className="size-4" />}
              onClick={() => setRequesting(true)}
            >
              New request
            </Button>
          )
        }
      />
      <QueryState
        query={requests}
        view={location.search}
        isEmpty={(data) => data.items.length === 0}
        empty={
          <EmptyState
            title="No requests yet"
            description="Propose a club when a topic you care about is missing."
          />
        }
      >
        {(data) => (
          <>
            <Masonry columns="xl:grid-cols-2">
              {data.items.map((request) => (
                <ClubRequestCard key={request.id} request={request} />
              ))}
            </Masonry>
            <Pagination
              page={data.pageNumber}
              totalPages={data.totalPages}
              onChange={(next) => set({ page: next })}
            />
          </>
        )}
      </QueryState>
      <ClubRequestDialog open={isRequesting} onClose={() => setRequesting(false)} />
    </>
  )
}
