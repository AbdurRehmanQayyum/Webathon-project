import { Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link } from 'react-router'
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
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { AnnouncementEditor } from '@/features/announcements/AnnouncementEditor'
import { useAnnouncementActions, useAnnouncements } from '@/features/announcements/api'
import { useListParams } from '@/hooks/useListParams'
import { formatDateTime } from '@/lib/format'

type Publication = 'All' | 'Published' | 'Draft'
type Dialog = { type: 'create' } | { type: 'edit' | 'delete'; id: number }

export function AnnouncementsAdminPage() {
  const { page, get, set } = useListParams()
  const publication = (['Published', 'Draft'].find((value) => value === get('show')) ??
    'All') as Publication
  const search = get('q')
  const onSearch = useCallback((q: string) => set({ q }), [set])
  const announcements = useAnnouncements({ publication, search, pageNumber: page, pageSize: 10 })
  const actions = useAnnouncementActions()
  const toast = useToast()
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const target =
    dialog && 'id' in dialog
      ? (announcements.data?.items.find((item) => item.id === dialog.id) ?? null)
      : null
  const close = () => setDialog(null)

  return (
    <>
      <PageHeader
        title="Announcements"
        description="Publish official department notices."
        actions={
          <Button
            variant="primary"
            icon={<Plus className="size-4" />}
            onClick={() => setDialog({ type: 'create' })}
          >
            New announcement
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <SegmentedControl
          label="Publication status"
          value={publication}
          onChange={(value) => set({ show: value === 'All' ? null : value })}
          segments={[
            { value: 'All', label: 'All' },
            { value: 'Published', label: 'Published' },
            { value: 'Draft', label: 'Drafts' },
          ]}
        />
        <SearchInput
          label="Search announcements"
          value={search}
          onSearch={onSearch}
          className="min-w-52 flex-1"
        />
      </div>
      <QueryState
        query={announcements}
        isEmpty={(data) => data.items.length === 0}
        empty={<EmptyState title="No announcements" description="Create the first notice." />}
      >
        {(data) => (
          <>
            <DataTable
              caption="Announcements"
              rows={data.items}
              rowKey={(row) => row.id}
              columns={[
                {
                  header: 'Title',
                  cell: (row) => (
                    <Link to={`/announcements/${row.id}`} className="font-medium hover:text-link">
                      {row.title}
                    </Link>
                  ),
                },
                { header: 'Author', cell: (row) => row.author.fullName },
                {
                  header: 'Published',
                  cell: (row) =>
                    row.isPublished && row.publishedAtUtc
                      ? formatDateTime(row.publishedAtUtc)
                      : '—',
                },
                {
                  header: 'Status',
                  cell: (row) => (
                    <span className="inline-flex flex-wrap gap-1">
                      <Badge tone={row.isPublished ? 'success' : 'neutral'}>
                        {row.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                      {row.priority === 'Important' && <Badge tone="warning">Important</Badge>}
                    </span>
                  ),
                },
              ]}
              actions={(row) => (
                <>
                  <IconButton
                    size="icon-sm"
                    label={`Edit ${row.title}`}
                    icon={<Pencil className="size-4" />}
                    onClick={() => setDialog({ type: 'edit', id: row.id })}
                  />
                  <IconButton
                    size="icon-sm"
                    label={`${row.isPublished ? 'Unpublish' : 'Publish'} ${row.title}`}
                    icon={
                      row.isPublished ? <EyeOff className="size-4" /> : <Eye className="size-4" />
                    }
                    disabled={actions.setPublished.isPending}
                    onClick={() =>
                      actions.setPublished.mutate(
                        { id: row.id, isPublished: !row.isPublished },
                        {
                          onSuccess: () =>
                            toast.success(row.isPublished ? 'Unpublished' : 'Published'),
                          onError: toast.error,
                        },
                      )
                    }
                  />
                  <IconButton
                    size="icon-sm"
                    label={`Delete ${row.title}`}
                    icon={<Trash2 className="size-4" />}
                    onClick={() => setDialog({ type: 'delete', id: row.id })}
                  />
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
      <AnnouncementEditor
        open={dialog?.type === 'create' || (dialog?.type === 'edit' && target !== null)}
        announcement={dialog?.type === 'edit' ? target : null}
        onClose={close}
      />
      <ConfirmDialog
        open={dialog?.type === 'delete' && target !== null}
        onClose={close}
        title="Delete this announcement?"
        description="It is removed for students and administrators."
        confirmLabel="Delete announcement"
        danger
        loading={actions.remove.isPending}
        onConfirm={() => {
          if (!target) return
          actions.remove.mutate(target.id, {
            onSuccess: () => {
              toast.success('Announcement deleted')
              close()
            },
            onError: toast.error,
          })
        }}
      />
    </>
  )
}
