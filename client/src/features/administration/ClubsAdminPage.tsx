import { Archive, ArchiveRestore, Pencil, Plus, UserCog } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { PageHeader } from '@/components/common/PageHeader'
import { QueryState } from '@/components/common/QueryState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useToast } from '@/components/feedback/toast-context'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DataTable } from '@/components/ui/DataTable'
import { IconButton } from '@/components/ui/IconButton'
import { Pagination } from '@/components/ui/Pagination'
import { SearchInput } from '@/components/ui/SearchInput'
import { Select } from '@/components/ui/Select'
import { useCurrentUser } from '@/features/auth/current-user'
import { permissions } from '@/features/auth/permissions'
import { ClubIcon } from '@/features/clubs/ClubIcon'
import type { Club } from '@/features/clubs/types'
import { useListParams } from '@/hooks/useListParams'
import { useAdminClubs, useClubAdminActions } from './api'
import { ClubEditor } from './ClubEditor'
import { ModeratorsDialog } from './ModeratorsDialog'

type Dialog = { type: 'edit' | 'moderators' | 'status'; clubId: number } | { type: 'create' }

export function ClubsAdminPage() {
  const location = useLocation()
  const { page, get, set } = useListParams()
  const { can } = useCurrentUser()
  const canManage = can(permissions.manageClubs)
  const search = get('q')
  const status = get('status') || 'all'
  const onSearch = useCallback((q: string) => set({ q }), [set])
  const clubs = useAdminClubs({
    search,
    status: status === 'all' ? null : status,
    sort: 'Name',
    pageNumber: page,
    pageSize: 10,
  })
  const { setStatus } = useClubAdminActions()
  const toast = useToast()
  const [dialog, setDialog] = useState<Dialog | null>(null)
  // Read the live row so dialogs reflect changes as they happen
  const target: Club | null =
    dialog && 'clubId' in dialog
      ? (clubs.data?.items.find((club) => club.id === dialog.clubId) ?? null)
      : null
  const isArchiving = target?.status === 'Active'
  const close = () => setDialog(null)

  return (
    <>
      <PageHeader
        title="Clubs"
        description="Create clubs, assign moderators and manage status."
        actions={
          canManage && (
            <Button
              variant="primary"
              icon={<Plus className="size-4" />}
              onClick={() => setDialog({ type: 'create' })}
            >
              New club
            </Button>
          )
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchInput
          label="Search clubs"
          value={search}
          onSearch={onSearch}
          className="min-w-52 flex-1"
        />
        <Select
          aria-label="Club status"
          value={status}
          onChange={(value) => set({ status: value === 'all' ? null : value })}
          options={[
            { value: 'all', label: 'Any status' },
            { value: 'Active', label: 'Active' },
            { value: 'Archived', label: 'Archived' },
          ]}
          className="w-full sm:w-44"
        />
      </div>
      <QueryState
        query={clubs}
        view={location.search}
        isEmpty={(data) => data.items.length === 0}
        empty={<EmptyState title="No clubs match" description="Adjust the search or filters." />}
      >
        {(data) => (
          <>
            <DataTable
              caption="Clubs"
              rows={data.items}
              rowKey={(club) => club.id}
              columns={[
                {
                  header: 'Club',
                  cell: (club) => (
                    <div className="flex items-center gap-3">
                      <ClubIcon iconKey={club.category.iconKey} logoFileId={club.logoFileId} />
                      <div className="min-w-0">
                        <Link to={`/clubs/${club.slug}`} className="font-medium hover:text-link">
                          {club.name}
                        </Link>
                        <p className="text-xs text-muted">{club.category.name}</p>
                      </div>
                    </div>
                  ),
                },
                { header: 'Members', cell: (club) => club.memberCount },
                {
                  header: 'Moderators',
                  cell: (club) =>
                    club.moderators.map((moderator) => moderator.fullName).join(', ') || (
                      <span className="text-muted">None</span>
                    ),
                },
                {
                  header: 'Status',
                  cell: (club) => (
                    <Badge tone={club.status === 'Active' ? 'success' : 'neutral'}>
                      {club.status}
                    </Badge>
                  ),
                },
              ]}
              actions={(club) => (
                <>
                  {canManage && (
                    <IconButton
                      size="icon-sm"
                      label={`Edit ${club.name}`}
                      icon={<Pencil className="size-4" />}
                      onClick={() => setDialog({ type: 'edit', clubId: club.id })}
                    />
                  )}
                  {can(permissions.assignModerators) && (
                    <IconButton
                      size="icon-sm"
                      label={`Moderators of ${club.name}`}
                      icon={<UserCog className="size-4" />}
                      onClick={() => setDialog({ type: 'moderators', clubId: club.id })}
                    />
                  )}
                  {canManage && (
                    <IconButton
                      size="icon-sm"
                      label={`${club.status === 'Active' ? 'Archive' : 'Restore'} ${club.name}`}
                      icon={
                        club.status === 'Active' ? (
                          <Archive className="size-4" />
                        ) : (
                          <ArchiveRestore className="size-4" />
                        )
                      }
                      onClick={() => setDialog({ type: 'status', clubId: club.id })}
                    />
                  )}
                </>
              )}
            />
            <Pagination
              page={data.pageNumber}
              totalPages={data.totalPages}
              onChange={(next) => set({ page: next })}
            />
          </>
        )}
      </QueryState>

      <ClubEditor
        open={dialog?.type === 'create' || (dialog?.type === 'edit' && target !== null)}
        club={dialog?.type === 'edit' ? target : null}
        onClose={close}
      />
      <ModeratorsDialog club={dialog?.type === 'moderators' ? target : null} onClose={close} />
      <ConfirmDialog
        open={dialog?.type === 'status' && target !== null}
        onClose={close}
        title={isArchiving ? 'Archive this club?' : 'Restore this club?'}
        description={
          isArchiving
            ? 'It leaves the club list and its discussions become read-only.'
            : 'Members will be able to post again.'
        }
        confirmLabel={isArchiving ? 'Archive club' : 'Restore club'}
        danger={isArchiving}
        loading={setStatus.isPending}
        onConfirm={() => {
          if (!target) return
          setStatus.mutate(
            { id: target.id, status: isArchiving ? 'Archived' : 'Active' },
            {
              onSuccess: () => {
                toast.success(isArchiving ? 'Club archived' : 'Club restored')
                close()
              },
              onError: toast.error,
            },
          )
        }}
      />
    </>
  )
}
