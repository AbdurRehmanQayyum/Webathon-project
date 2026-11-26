import { Bell, CheckCheck } from 'lucide-react'
import { Popover } from 'radix-ui'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { QueryState } from '@/components/common/QueryState'
import { ListSkeleton } from '@/components/feedback/Skeleton'
import { Button } from '@/components/ui/Button'
import { buttonStyles } from '@/components/ui/button-styles'
import { popupStyles } from '@/components/ui/input-styles'
import { cn } from '@/lib/cn'
import { useNotificationActions, useNotifications, type Notification } from './api'
import { NotificationItem } from './NotificationItem'

export function NotificationMenu() {
  const [isOpen, setOpen] = useState(false)
  const notifications = useNotifications({ pageSize: 6 })
  const actions = useNotificationActions()
  const navigate = useNavigate()
  const unread = notifications.data?.unreadCount ?? 0

  const open = (notification: Notification) => {
    if (!notification.isRead) actions.read.mutate(notification.id)
    setOpen(false)
    void navigate(notification.linkPath)
  }

  return (
    <Popover.Root open={isOpen} onOpenChange={setOpen}>
      <Popover.Trigger
        className={buttonStyles('ghost', 'icon', 'relative')}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[0.625rem] font-bold text-on-primary">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={6}
          collisionPadding={8}
          className={cn(popupStyles, 'flex max-h-[70dvh] w-[min(24rem,calc(100vw-1rem))] flex-col')}
        >
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <h2 className="text-sm font-semibold">Notifications</h2>
            <Button
              size="sm"
              variant="ghost"
              icon={<CheckCheck className="size-4" />}
              disabled={unread === 0}
              onClick={() => actions.readAll.mutate()}
            >
              Mark all read
            </Button>
          </div>
          <div className="overflow-y-auto p-1">
            <QueryState
              query={notifications}
              skeleton={<ListSkeleton rows={2} />}
              isEmpty={(data) => data.page.items.length === 0}
              empty={<p className="p-6 text-center text-sm text-muted">You are all caught up.</p>}
            >
              {(data) => (
                <ul>
                  {data.page.items.map((notification) => (
                    <li key={notification.id}>
                      <NotificationItem notification={notification} onOpen={open} />
                    </li>
                  ))}
                </ul>
              )}
            </QueryState>
          </div>
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="border-t border-line px-3 py-2.5 text-center text-sm font-medium text-link hover:bg-surface-alt"
          >
            View all notifications
          </Link>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
