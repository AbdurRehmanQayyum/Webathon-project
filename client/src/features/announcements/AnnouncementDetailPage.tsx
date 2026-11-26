import { ExternalLink as ExternalIcon } from 'lucide-react'
import { useParams } from 'react-router'
import { ExternalLink } from '@/components/common/ExternalLink'
import { Breadcrumb } from '@/components/common/PageHeader'
import { QueryState } from '@/components/common/QueryState'
import { RichContent } from '@/components/editor/RichContent'
import { Avatar } from '@/components/ui/Avatar'
import { buttonStyles } from '@/components/ui/button-styles'
import { Card } from '@/components/ui/Card'
import { AttachmentGallery } from '@/features/files/AttachmentGallery'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDate, formatTime } from '@/lib/format'
import { useAnnouncement } from './api'
import { OfficialMarks } from './AnnouncementCard'

export function AnnouncementDetailPage() {
  const announcement = useAnnouncement(Number(useParams().announcementId))
  useDocumentTitle(announcement.data?.title)

  return (
    <>
      <QueryState query={announcement}>
        {(data) => {
          const published = data.publishedAtUtc ?? data.createdAtUtc
          return (
            <>
              <Breadcrumb
                items={[{ label: 'Announcements', to: '/announcements' }, { label: data.title }]}
              />
              <Card className="grid gap-4 border-t-4 border-t-primary p-4 sm:p-6">
                <OfficialMarks announcement={data} />
                <h1 className="wrap-text text-xl font-semibold sm:text-2xl">{data.title}</h1>
                <div className="flex items-center gap-3 border-b border-line pb-4">
                  <Avatar name={data.author.fullName} fileId={data.author.avatarFileId} size="md" />
                  <div className="text-sm">
                    <p className="font-medium">
                      {data.author.fullName}
                      {data.author.title && (
                        <span className="font-normal text-muted"> · {data.author.title}</span>
                      )}
                    </p>
                    <p className="text-muted">
                      {data.isPublished ? 'Published' : 'Drafted'}{' '}
                      <time dateTime={published}>
                        {formatDate(published)} at {formatTime(published)}
                      </time>
                    </p>
                  </div>
                </div>
                <RichContent html={data.body} className="leading-relaxed" />
                {data.linkUrl && (
                  <ExternalLink
                    href={data.linkUrl}
                    className={buttonStyles(
                      'secondary',
                      'md',
                      'w-fit max-w-full hover:no-underline',
                    )}
                  >
                    <ExternalIcon className="size-4" aria-hidden="true" />
                    <span className="truncate">{data.linkLabel ?? 'Open link'}</span>
                  </ExternalLink>
                )}
                <AttachmentGallery attachments={data.attachments} />
              </Card>
            </>
          )
        }}
      </QueryState>
    </>
  )
}
