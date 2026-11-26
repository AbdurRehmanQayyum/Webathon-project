import {
  AtSign,
  BadgeCheck,
  CalendarPlus,
  CalendarX,
  CircleCheck,
  CircleX,
  MessageSquare,
  Reply,
  ShieldCheck,
  ShieldX,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/cn'
import { formatDateTime, formatRelative } from '@/lib/format'
import type { Notification, NotificationType } from './api'

const notificationKinds: Record<NotificationType, { label: string; Icon: LucideIcon }> = {
  CommentOnPost: { label: 'Comment', Icon: MessageSquare },
  ReplyToComment: { label: 'Reply', Icon: Reply },
  Mention: { label: 'Mention', Icon: AtSign },
  ClubRequestApproved: { label: 'Request approved', Icon: CircleCheck },
  ClubRequestRejected: { label: 'Request declined', Icon: CircleX },
  ModeratorAssigned: { label: 'Moderator role', Icon: ShieldCheck },
  ContentRemoved: { label: 'Moderation', Icon: ShieldX },
  AnnouncementPublished: { label: 'Announcement', Icon: BadgeCheck },
  EventScheduled: { label: 'New event', Icon: CalendarPlus },
  EventCancelled: { label: 'Event cancelled', Icon: CalendarX },
}

interface NotificationItemProps {
  notification: Notification
  onOpen: (notification: Notification) => void
  actions?: ReactNode
  detailed?: boolean
}

export function NotificationItem({ notification, onOpen, actions, detailed }: NotificationItemProps) {
  const { label, Icon } = notificationKinds[notification.type]
  const { actor, isRead } = notification

  return (
    <div
      className={cn(
        'flex items-start gap-1 rounded-control transition-colors hover:bg-surface-alt',
        detailed && !isRead && 'bg-selected/40',
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(notification)}
        className="flex min-w-0 flex-1 gap-3 rounded-control px-2.5 py-2.5 text-left"
      >
        <span className="relative shrink-0">
          {actor ? (
            <Avatar name={actor.fullName} fileId={actor.avatarFileId} size={detailed ? 'md' : 'sm'} />
          ) : (
            <span
              className={cn(
                'grid place-items-center rounded-full bg-selected text-selected-fg',
                detailed ? 'size-10' : 'size-8',
              )}
            >
              <Icon className="size-4.5" aria-hidden="true" />
            </span>
          )}
          {actor && (
            <span className="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full border-2 border-surface bg-primary text-on-primary">
              <Icon className="size-3" aria-hidden="true" />
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn('wrap-text block text-sm', !isRead && 'font-medium')}>
            {!isRead && <span className="sr-only">Unread: </span>}
            {notification.message}
          </span>
          <span className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted">
            {detailed && <span className="font-medium text-link">{label}</span>}
            <time
              dateTime={notification.createdAtUtc}
              title={formatDateTime(notification.createdAtUtc)}
            >
              {formatRelative(notification.createdAtUtc)}
            </time>
          </span>
        </span>
        <span
          className={cn('mt-2 size-2 shrink-0 rounded-full', !isRead && 'bg-primary')}
          aria-hidden="true"
        />
      </button>
      {actions && <span className="flex shrink-0 py-2 pr-1.5">{actions}</span>}
    </div>
  )
}
