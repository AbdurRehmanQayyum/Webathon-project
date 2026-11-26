import { Ellipsis, ShieldCheck, ShieldOff, UserCheck, UserPlus, UserX } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { PageHeader } from '@/components/common/PageHeader'
import { QueryState } from '@/components/common/QueryState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useToast } from '@/components/feedback/toast-context'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DataTable } from '@/components/ui/DataTable'
import { IconButton } from '@/components/ui/IconButton'
import { Menu } from '@/components/ui/Menu'
import { Pagination } from '@/components/ui/Pagination'
import { SearchInput } from '@/components/ui/SearchInput'
import { Select } from '@/components/ui/Select'
import { useCurrentUser } from '@/features/auth/current-user'
import { useListParams } from '@/hooks/useListParams'
import { useAdminUsers, useUserActions, type AdminUser } from './api'
import { AdminRoleDialog } from './AdminRoleDialog'
import { CreateUserDialog } from './CreateUserDialog'

export function UsersPage() {
  const { user: me, isAdmin: isSelfAdmin } = useCurrentUser()
  const [isCreating, setCreating] = useState(false)
  const location = useLocation()
  const { page, get, set } = useListParams()
  const search = get('q')
  const role = get('role') || 'all'
  const status = get('status') || 'all'
  const onSearch = useCallback((q: string) => set({ q }), [set])
  const users = useAdminUsers({
    search,
    role: role === 'all' ? null : role,
    isActive: status === 'all' ? null : status === 'active',
    pageNumber: page,
    pageSize: 10,
  })
  const actions = useUserActions()
  const toast = useToast()
  const [statusTarget, setStatusTarget] = useState<AdminUser | null>(null)
  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null)

  return (
    <>
      <PageHeader
        title="Users"
        description="Accounts, access and administrator titles."
        actions={
          <Button
            variant="primary"
            icon={<UserPlus className="size-4" />}
            onClick={() => setCreating(true)}
          >
            New user
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchInput
          label="Search name, email or registration number"
          value={search}
          onSearch={onSearch}
          className="min-w-60 flex-1"
        />
        <Select
          aria-label="Role"
          value={role}
          onChange={(value) => set({ role: value === 'all' ? null : value })}
          options={[
            { value: 'all', label: 'All roles' },
            { value: 'Admin', label: 'Administrators' },
            { value: 'Moderator', label: 'Moderators' },
            { value: 'Student', label: 'Students' },
          ]}
          className="w-full sm:w-44"
        />
        <Select
          aria-label="Account status"
          value={status}
          onChange={(value) => set({ status: value === 'all' ? null : value })}
          options={[
            { value: 'all', label: 'Any status' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Deactivated' },
          ]}
          className="w-full sm:w-40"
        />
      </div>
      <QueryState
        query={users}
        view={location.search}
        isEmpty={(data) => data.items.length === 0}
        empty={<EmptyState title="No users match" description="Adjust the search or filters." />}
      >
        {(data) => (
          <>
            <DataTable
              caption="Users"
              rows={data.items}
              rowKey={(row) => row.id}
              columns={[
                {
                  header: 'User',
                  cell: (row) => (
                    <div className="flex items-center gap-3">
                      <Avatar name={row.fullName} fileId={row.avatarFileId} />
                      <div className="min-w-0">
                        <Link to={`/users/${row.id}`} className="font-medium hover:text-link">
                          {row.fullName}
                        </Link>
                        <p className="wrap-text text-xs text-muted">{row.email}</p>
                      </div>
                    </div>
                  ),
                },
                {
                  header: 'Registration',
                  cell: (row) =>
                    row.registrationNumber
                      ? `${row.registrationNumber}${row.semester ? ` · Sem ${row.semester}` : ''}`
                      : '—',
                },
                {
                  header: 'Roles',
                  cell: (row) => (
                    <span className="inline-flex flex-wrap gap-1">
                      {row.roles.map((item) => (
                        <Badge key={item} tone={item === 'Student' ? 'neutral' : 'primary'}>
                          {item === 'Admin' && row.title ? row.title : item}
                        </Badge>
                      ))}
                    </span>
                  ),
                },
                {
                  header: 'Status',
                  cell: (row) => (
                    <span className="inline-flex flex-wrap gap-1">
                      <Badge tone={row.isActive ? 'success' : 'danger'}>
                        {row.isActive ? 'Active' : 'Deactivated'}
                      </Badge>
                      {row.mustChangePassword && <Badge tone="warning">Temporary password</Badge>}
                    </span>
                  ),
                },
              ]}
              actions={(row) => {
                if (row.id === me.id) return <span className="text-xs text-muted">You</span>
                const isAdmin = row.roles.includes('Admin')
                return (
                  <Menu
                    trigger={
                      <IconButton
                        size="icon-sm"
                        label={`Manage ${row.fullName}`}
                        icon={<Ellipsis className="size-4" />}
                      />
                    }
                    items={[
                      // Only administrators may change who is an administrator
                      ...(isSelfAdmin
                        ? [
                            {
                              label: isAdmin ? 'Remove admin access' : 'Make administrator',
                              icon: isAdmin ? ShieldOff : ShieldCheck,
                              onSelect: () => setRoleTarget(row),
                            },
                          ]
                        : []),
                      {
                        label: row.isActive ? 'Deactivate account' : 'Reactivate account',
                        icon: row.isActive ? UserX : UserCheck,
                        danger: row.isActive,
                        onSelect: () => setStatusTarget(row),
                      },
                    ]}
                  />
                )
              }}
            />
            <Pagination
              page={data.pageNumber}
              totalPages={data.totalPages}
              onChange={(next) => set({ page: next })}
            />
          </>
        )}
      </QueryState>
      <ConfirmDialog
        open={statusTarget !== null}
        onClose={() => setStatusTarget(null)}
        title={statusTarget?.isActive ? 'Deactivate account?' : 'Reactivate account?'}
        description={
          statusTarget?.isActive
            ? `${statusTarget.fullName} will be signed out and unable to sign in.`
            : `${statusTarget?.fullName ?? 'This user'} will be able to sign in again.`
        }
        confirmLabel={statusTarget?.isActive ? 'Deactivate' : 'Reactivate'}
        danger={statusTarget?.isActive}
        loading={actions.setStatus.isPending}
        onConfirm={() => {
          if (!statusTarget) return
          actions.setStatus.mutate(
            { id: statusTarget.id, isActive: !statusTarget.isActive },
            {
              onSuccess: () => {
                toast.success('Account updated')
                setStatusTarget(null)
              },
              onError: toast.error,
            },
          )
        }}
      />
      <AdminRoleDialog user={roleTarget} onClose={() => setRoleTarget(null)} />
      <CreateUserDialog open={isCreating} onClose={() => setCreating(false)} />
    </>
  )
}
