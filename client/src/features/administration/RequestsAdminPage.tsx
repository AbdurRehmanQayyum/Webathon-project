import { useLocation } from 'react-router'
import { Check, X } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Masonry } from '@/components/common/Masonry'
import { PageHeader } from '@/components/common/PageHeader'
import { QueryState } from '@/components/common/QueryState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useToast } from '@/components/feedback/toast-context'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Pagination } from '@/components/ui/Pagination'
import { SearchInput } from '@/components/ui/SearchInput'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { ClubRequestCard } from '@/features/clubs/ClubRequestCard'
import type { ClubRequest } from '@/features/clubs/types'
import { useListParams } from '@/hooks/useListParams'
import { useAdminRequests, useRequestActions } from './api'

type Filter = 'Pending' | 'Approved' | 'Rejected' | 'All'

export function RequestsAdminPage() {
  const location = useLocation()
  const { page, get, set } = useListParams()
  const filter = (['Approved', 'Rejected', 'All'].find((value) => value === get('status')) ??
    'Pending') as Filter
  const search = get('q')
  const onSearch = useCallback((q: string) => set({ q }), [set])
  const requests = useAdminRequests({
    status: filter === 'All' ? null : filter,
    search,
    pageNumber: page,
    pageSize: 8,
  })
  const actions = useRequestActions()
  const toast = useToast()
  const [decision, setDecision] = useState<{ request: ClubRequest; approve: boolean } | null>(null)

  const decide = (reason: string) => {
    if (!decision) return
    const options = {
      onSuccess: () => {
        toast.success(decision.approve ? 'Club created' : 'Request rejected')
        setDecision(null)
      },
      onError: toast.error,
    }
    if (decision.approve) actions.approve.mutate(decision.request.id, options)
    else actions.reject.mutate({ id: decision.request.id, reason }, options)
  }

  return (
    <>
      <PageHeader title="Club requests" description="Approving a request creates the club." />
      <div className="mb-4 flex flex-wrap gap-2">
        <SegmentedControl
          label="Request status"
          value={filter}
          onChange={(value) => set({ status: value === 'Pending' ? null : value })}
          segments={(['Pending', 'Approved', 'Rejected', 'All'] as const).map((value) => ({
            value,
            label: value,
          }))}
          className="w-full sm:w-auto"
        />
        <SearchInput
          label="Search requests"
          value={search}
          onSearch={onSearch}
          className="min-w-48 flex-1"
        />
      </div>
      <QueryState
        query={requests}
        view={location.search}
        isEmpty={(data) => data.items.length === 0}
        empty={
          <EmptyState title="Nothing to review" description="No requests match this filter." />
        }
      >
        {(data) => (
          <>
            <Masonry columns="xl:grid-cols-2">
              {data.items.map((request) => (
                <ClubRequestCard
                  key={request.id}
                  request={request}
                  showRequester
                  actions={
                    request.status === 'Pending' && (
                      <>
                        <Button
                          size="sm"
                          icon={<X className="size-4" />}
                          onClick={() => setDecision({ request, approve: false })}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          icon={<Check className="size-4" />}
                          onClick={() => setDecision({ request, approve: true })}
                        >
                          Approve
                        </Button>
                      </>
                    )
                  }
                />
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
      <ConfirmDialog
        open={decision !== null}
        onClose={() => setDecision(null)}
        title={decision?.approve ? 'Approve this club?' : 'Reject this request?'}
        description={
          decision?.approve
            ? `${decision.request.proposedName} will be created and ${decision.request.requestedBy.fullName} added as a member.`
            : 'The student can read the reason you give.'
        }
        confirmLabel={decision?.approve ? 'Approve and create' : 'Reject request'}
        danger={!decision?.approve}
        reason={decision?.approve ? undefined : { label: 'Reason', required: true }}
        loading={actions.approve.isPending || actions.reject.isPending}
        onConfirm={decide}
      />
    </>
  )
}
