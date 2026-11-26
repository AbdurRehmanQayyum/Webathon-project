import { Download, Eye, Paperclip, Play, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/components/feedback/toast-context'
import { IconButton } from '@/components/ui/IconButton'
import { cn } from '@/lib/cn'
import { formatBytes, pluralize } from '@/lib/format'
import { downloadUrl, fileUrl } from '@/services/api-client'
import type { Attachment } from '@/types/common'
import { useDeleteFile } from './api'
import { isVisual, mediaIcon, mediaKind } from './media'
import { PreviewDialog } from './PreviewDialog'

interface AttachmentGalleryProps {
  attachments: Attachment[]
  removable?: boolean
  compact?: boolean
}

// Preview and download section for posts, announcements and events
export function AttachmentGallery({ attachments, removable, compact }: AttachmentGalleryProps) {
  const [preview, setPreview] = useState<number | null>(null)
  const remove = useDeleteFile()
  const toast = useToast()
  if (attachments.length === 0) return null

  const open = (file: Attachment) => setPreview(attachments.indexOf(file))
  const visuals = attachments.filter(isVisual)
  const others = attachments.filter((file) => !isVisual(file))

  const actions = (file: Attachment) => (
    <span className="flex shrink-0">
      <IconButton
        size="icon-sm"
        label={`Preview ${file.fileName}`}
        icon={<Eye className="size-4" />}
        onClick={() => open(file)}
      />
      <a
        href={downloadUrl(file.id)}
        aria-label={`Download ${file.fileName}`}
        className="grid size-8 place-items-center rounded-control text-muted hover:bg-surface-alt hover:text-fg pointer-coarse:size-10"
      >
        <Download className="size-4" />
      </a>
      {removable && (
        <IconButton
          size="icon-sm"
          label={`Remove ${file.fileName}`}
          icon={<Trash2 className="size-4" />}
          disabled={remove.isPending}
          onClick={() =>
            remove.mutate(file.id, {
              onSuccess: () => toast.success('File removed'),
              onError: toast.error,
            })
          }
        />
      )}
    </span>
  )

  return (
    <section aria-label="Attachments" className="grid gap-2">
      <h3 className="flex items-center gap-1.5 text-xs font-semibold text-muted">
        <Paperclip className="size-3.5" aria-hidden="true" />
        {pluralize(attachments.length, 'attachment')}
      </h3>
      {visuals.length > 0 && (
        <ul
          className={cn(
            'grid gap-2',
            compact ? 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6' : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4',
          )}
        >
          {visuals.map((file) => (
            <li key={file.id} className="overflow-hidden rounded-control border border-line">
              <button
                type="button"
                onClick={() => open(file)}
                aria-label={`Preview ${file.fileName}`}
                className="group relative block aspect-4/3 w-full bg-surface-alt"
              >
                {mediaKind(file.contentType) === 'image' ? (
                  <img
                    src={fileUrl(file.id)}
                    alt=""
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <>
                    <video
                      src={`${fileUrl(file.id)}#t=0.1`}
                      preload="metadata"
                      muted
                      playsInline
                      className="size-full object-cover"
                    />
                    <span className="absolute inset-0 grid place-items-center">
                      <span className="grid size-10 place-items-center rounded-full bg-primary text-on-primary shadow-pop">
                        <Play className="size-5" fill="currentColor" aria-hidden="true" />
                      </span>
                    </span>
                  </>
                )}
              </button>
              {!compact && (
                <div className="flex items-center justify-between gap-1 py-0.5 pr-0.5 pl-2">
                  <span className="truncate text-xs text-muted">{file.fileName}</span>
                  {actions(file)}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {others.length > 0 && (
        <ul className={cn('grid gap-2', !compact && 'lg:grid-cols-2')}>
          {others.map((file) => {
            const Icon = mediaIcon(file)
            return (
              <li key={file.id} className="grid gap-1 rounded-control border border-line p-2">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-md bg-selected text-selected-fg">
                    <Icon className="size-4.5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{file.fileName}</span>
                    <span className="block text-xs text-muted">{formatBytes(file.sizeBytes)}</span>
                  </span>
                  {actions(file)}
                </div>
                {mediaKind(file.contentType) === 'audio' && (
                  <audio src={fileUrl(file.id)} controls preload="none" className="h-9 w-full" />
                )}
              </li>
            )
          })}
        </ul>
      )}
      <PreviewDialog attachments={attachments} index={preview} onIndex={setPreview} />
    </section>
  )
}
