import {
  AtSign,
  Bell,
  Building2,
  Check,
  CheckCheck,
  Reply,
  ShieldCheck,
  Trash2,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { PageHeader } from '@/components/common/PageHeader'
import { QueryState } from '@/components/common/QueryState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useToast } from '@/components/feedback/toast-context'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { IconButton } from '@/components/ui/IconButton'
import { Pagination } from '@/components/ui/Pagination'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useListParams } from '@/hooks/useListParams'
import { cn } from '@/lib/cn'
import { pluralize } from '@/lib/format'
import {
  useNotificationActions,
  useNotifications,
  type Notification,
  type NotificationCategory,
} from './api'
import { NotificationItem } from './NotificationItem'

const categories: { value: NotificationCategory; label: string; Icon: LucideIcon }[] = [
  { value: 'All', label: 'Everything', Icon: Bell },
  { value: 'Mentions', label: 'Mentions', Icon: AtSign },
  { value: 'Replies', label: 'Replies', Icon: Reply },
  { value: 'Clubs', label: 'Clubs', Icon: UsersRound },
  { value: 'Department', label: 'Department', Icon: Building2 },
  { value: 'Moderation', label: 'Moderation', Icon: ShieldCheck },
]

const DAY = 86_400_000

// Newest first, so each group stays contiguous
function groupByAge(items: Notification[]) {
  const today = new Date().setHours(0, 0, 0, 0)
  const groupOf = (value: string) => {
    const time = new Date(value).getTime()
    if (time >= today) return 'Today'
    if (time >= today - DAY) return 'Yesterday'
    return time >= today - 6 * DAY ? 'This week' : 'Earlier'
  }

  const groups = new Map<string, Notification[]>()
  items.forEach((item) => {
    const key = groupOf(item.createdAtUtc)
    groups.set(key, [...(groups.get(key) ?? []), item])
  })
  return [...groups]
}

export function NotificationsPage() {
  const { page, get, set } = useListParams()
  const category = categories.find((item) => item.value === get('category'))?.value ?? 'All'
  const unreadOnly = get('show') === 'unread'
  const feed = useNotifications({ category, unreadOnly, pageNumber: page, pageSize: 15 })
  const actions = useNotificationActions()
  const navigate = useNavigate()
  const toast = useToast()
  const [isClearing, setClearing] = useState(false)
  const unread = feed.data?.unreadCount ?? 0

  const open = (notification: Notification) => {
    if (!notification.isRead) actions.read.mutate(notification.id)
    void navigate(notification.linkPath)
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        description={unread > 0 ? pluralize(unread, 'unread notification') : 'You are all caught up.'}
        actions={
          <>
            <Button
              icon={<CheckCheck className="size-4" />}
              disabled={unread === 0}
              loading={actions.readAll.isPending}
              onClick={() => actions.readAll.mutate(undefined, { onError: toast.error })}
            >
              Mark all read
            </Button>
            <Button
              icon={<Trash2 className="size-4" />}
              disabled={category === 'All' && !unreadOnly && feed.data?.page.totalCount === 0}
              onClick={() => setClearing(true)}
            >
              Clear read
            </Button>
          </>
        }
      />
      <div className="grid items-start gap-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <nav
          aria-label="Notification categories"
          className="no-scrollbar flex gap-2 overflow-x-auto lg:sticky lg:top-20 lg:grid lg:gap-1 lg:overflow-visible lg:rounded-panel lg:border lg:border-line lg:bg-surface lg:p-2"
        >
          {categories.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              aria-current={category === value ? 'true' : undefined}
              onClick={() => set({ category: value === 'All' ? null : value })}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-control border border-line px-3 py-2 text-sm font-medium transition-colors lg:border-transparent',
                category === value
                  ? 'border-primary bg-selected text-selected-fg'
                  : 'text-muted hover:bg-surface-alt hover:text-fg',
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>
        <div className="grid min-w-0 gap-3">
          <SegmentedControl
            label="Read state"
            value={unreadOnly ? 'unread' : 'all'}
            onChange={(value) => set({ show: value === 'all' ? null : value })}
            segments={[
              { value: 'all', label: 'All' },
              { value: 'unread', label: 'Unread' },
            ]}
            className="w-full sm:w-60"
          />
          <QueryState
            query={feed}
            view={`${category}:${unreadOnly}:${page}`}
            className="grid gap-3"
            isEmpty={(data) => data.page.items.length === 0}
            empty={
              <EmptyState
                title={unreadOnly ? 'Nothing unread' : 'No notifications'}
                description="Mentions, replies and department updates appear here."
              />
            }
          >
            {(data) => (
              <>
                {groupByAge(data.page.items).map(([label, items]) => (
                  <section key={label} aria-label={label}>
                    <h2 className="mb-1.5 text-xs font-semibold text-muted">{label}</h2>
                    <Card className="p-1.5">
                      <ul className="grid gap-0.5">
                        {items.map((item) => (
                          <li key={item.id}>
                            <NotificationItem
                              detailed
                              notification={item}
                              onOpen={open}
                              actions={
                                <>
                                  {!item.isRead && (
                                    <IconButton
                                      size="icon-sm"
                                      label="Mark as read"
                                      icon={<Check className="size-4" />}
                                      onClick={() =>
                                        actions.read.mutate(item.id, { onError: toast.error })
                                      }
                                    />
                                  )}
                                  <IconButton
                                    size="icon-sm"
                                    label="Delete notification"
                                    icon={<Trash2 className="size-4" />}
                                    onClick={() =>
                                      actions.remove.mutate(item.id, { onError: toast.error })
                                    }
                                  />
                                </>
                              }
                            />
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </section>
                ))}
                <Pagination
                  page={data.page.pageNumber}
                  totalPages={data.page.totalPages}
                  onChange={(next) => set({ page: next })}
                />
              </>
            )}
          </QueryState>
        </div>
      </div>
      <ConfirmDialog
        open={isClearing}
        onClose={() => setClearing(false)}
        title="Clear read notifications?"
        description="Every notification you have already read is deleted. This cannot be undone."
        confirmLabel="Clear read"
        danger
        loading={actions.clearRead.isPending}
        onConfirm={() =>
          actions.clearRead.mutate(undefined, {
            onSuccess: () => {
              setClearing(false)
              toast.success('Read notifications cleared')
            },
            onError: toast.error,
          })
        }
      />
    </>
  )
}
