import { Download, FileText, Trash2 } from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'
import { useToast } from '@/components/feedback/toast-context'
import { formatBytes } from '@/lib/format'
import { fileUrl } from '@/services/api-client'
import type { Attachment } from '@/types/common'
import { useDeleteFile } from './api'

interface AttachmentListProps {
  attachments: Attachment[]
  removable?: boolean
}

export function AttachmentList({ attachments, removable = false }: AttachmentListProps) {
  const remove = useDeleteFile()
  const toast = useToast()
  if (attachments.length === 0) return null

  const removeButton = (file: Attachment) =>
    removable && (
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
    )

  const images = attachments.filter((file) => file.contentType.startsWith('image/'))
  const documents = attachments.filter((file) => !file.contentType.startsWith('image/'))

  return (
    <div className="grid gap-3">
      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label="Images">
          {images.map((file) => (
            <li key={file.id} className="overflow-hidden rounded-control border border-line">
              <a href={fileUrl(file.id)} target="_blank" rel="noopener noreferrer">
                <img
                  src={fileUrl(file.id)}
                  alt={file.fileName}
                  loading="lazy"
                  className="aspect-4/3 w-full bg-surface-alt object-cover"
                />
              </a>
              {removable && (
                <div className="flex items-center justify-between gap-2 px-2 py-1">
                  <span className="truncate text-xs text-muted">{file.fileName}</span>
                  {removeButton(file)}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {documents.length > 0 && (
        <ul className="grid gap-2" aria-label="Documents">
          {documents.map((file) => (
            <li
              key={file.id}
              className="flex items-center gap-2 rounded-control border border-line bg-surface p-2"
            >
              <a
                href={fileUrl(file.id)}
                download={file.fileName}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-md hover:text-link"
              >
                <FileText className="size-5 shrink-0 text-muted" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{file.fileName}</span>
                  <span className="block text-xs text-muted">{formatBytes(file.sizeBytes)}</span>
                </span>
                <Download className="ml-auto size-4 shrink-0 text-muted" aria-label="Download" />
              </a>
              {removeButton(file)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
