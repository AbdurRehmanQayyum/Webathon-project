import { Link } from 'react-router'
import { PageHeader } from '@/components/common/PageHeader'
import { QueryState } from '@/components/common/QueryState'
import { Card } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import { formatDate } from '@/lib/format'
import { useAdminRequests, useOverview, type AdminOverview } from './api'

export function OverviewPage() {
  const overview = useOverview()

  return (
    <>
      <PageHeader title="Overview" description="Current activity across Campus Connect." />
      <QueryState query={overview}>{(data) => <Overview data={data} />}</QueryState>
    </>
  )
}

function Overview({ data }: { data: AdminOverview }) {
  const figures = [
    { label: 'Active students', value: data.activeStudents, to: '/admin/users' },
    { label: 'Moderators', value: data.moderators, to: '/admin/clubs' },
    { label: 'Active clubs', value: data.activeClubs, to: '/admin/clubs' },
    { label: 'Pending requests', value: data.pendingClubRequests, to: '/admin/requests' },
    { label: 'Published posts', value: data.publishedPosts, to: '/feed?scope=all' },
    { label: 'Comments', value: data.publishedComments, to: '/feed?scope=all' },
    { label: 'Upcoming events', value: data.upcomingEvents, to: '/admin/events' },
    { label: 'Draft announcements', value: data.draftAnnouncements, to: '/admin/announcements' },
  ]

  return (
    <div className="stagger-in grid gap-6">
      <Card className="grid grid-cols-2 overflow-hidden lg:grid-cols-4">
        {figures.map((figure) => (
          <Link
            key={figure.label}
            to={figure.to}
            className="-mr-px -mb-px border-r border-b border-line p-4 hover:bg-surface-alt"
          >
            <span className="block text-2xl font-semibold tabular-nums">{figure.value}</span>
            <span className="text-sm text-muted">{figure.label}</span>
          </Link>
        ))}
      </Card>
      {data.deactivatedUsers > 0 && (
        <p className="text-sm text-muted">Deactivated accounts: {data.deactivatedUsers}</p>
      )}
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <PendingRequests />
        <section>
          <h2 className="mb-3 text-base font-semibold">Largest clubs</h2>
          <DataTable
            caption="Largest clubs"
            rows={data.largestClubs}
            rowKey={(club) => club.id}
            columns={[
              {
                header: 'Club',
                cell: (club) => (
                  <Link to={`/clubs/${club.slug}`} className="font-medium hover:text-link">
                    {club.name}
                  </Link>
                ),
              },
              { header: 'Members', cell: (club) => club.memberCount },
              { header: 'Posts', cell: (club) => club.postCount },
            ]}
          />
        </section>
      </div>
    </div>
  )
}

function PendingRequests() {
  const requests = useAdminRequests({ status: 'Pending', pageSize: 5 })

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">Awaiting review</h2>
        <Link
          to="/admin/requests"
          className="rounded text-sm font-medium text-link hover:underline"
        >
          Review all
        </Link>
      </div>
      <QueryState
        query={requests}
        isEmpty={(data) => data.items.length === 0}
        empty={<p className="text-sm text-muted">No club requests are waiting.</p>}
      >
        {(data) => (
          <Card>
            <ul className="divide-y divide-line">
              {data.items.map((request) => (
                <li key={request.id} className="px-4 py-3 text-sm">
                  <p className="wrap-text font-medium">{request.proposedName}</p>
                  <p className="text-muted">
                    {request.requestedBy.fullName} · {formatDate(request.createdAtUtc)}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </QueryState>
    </section>
  )
}
