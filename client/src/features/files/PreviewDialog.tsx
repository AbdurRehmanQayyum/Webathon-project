import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { buttonStyles } from '@/components/ui/button-styles'
import { Modal } from '@/components/ui/Modal'
import { formatBytes } from '@/lib/format'
import { downloadUrl, fileUrl } from '@/services/api-client'
import type { Attachment } from '@/types/common'
import { mediaKind } from './media'
import { MediaIcon } from './MediaIcon'

interface PreviewDialogProps {
  attachments: Attachment[]
  index: number | null
  onIndex: (index: number | null) => void
}

export function PreviewDialog({ attachments, index, onIndex }: PreviewDialogProps) {
  const file = index === null ? undefined : attachments[index]
  const step = (offset: number) =>
    onIndex(((index ?? 0) + offset + attachments.length) % attachments.length)

  return (
    <Modal
      open={file !== undefined}
      onClose={() => onIndex(null)}
      title={file?.fileName ?? 'Preview'}
      description={file && formatBytes(file.sizeBytes)}
      size="full"
    >
      {file && (
        <>
          <Preview key={file.id} file={file} />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            {attachments.length > 1 ? (
              <div className="flex items-center gap-2">
                <Button size="sm" icon={<ChevronLeft className="size-4" />} onClick={() => step(-1)}>
                  Previous
                </Button>
                <span className="text-sm text-muted">
                  {(index ?? 0) + 1} of {attachments.length}
                </span>
                <Button size="sm" onClick={() => step(1)}>
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            ) : (
              <span />
            )}
            <a href={downloadUrl(file.id)} className={buttonStyles('primary', 'sm')}>
              <Download className="size-4" aria-hidden="true" />
              Download
            </a>
          </div>
        </>
      )}
    </Modal>
  )
}

function Preview({ file }: { file: Attachment }) {
  const url = fileUrl(file.id)

  switch (mediaKind(file.contentType)) {
    case 'image':
      return (
        <img
          src={url}
          alt={file.fileName}
          className="mx-auto max-h-[65dvh] w-auto max-w-full rounded-control bg-surface-alt object-contain"
        />
      )
    case 'video':
      return (
        <video src={url} controls autoPlay playsInline className="max-h-[65dvh] w-full rounded-control bg-fg">
          Your browser cannot play this video.
        </video>
      )
    case 'audio':
      return (
        <div className="grid justify-items-center gap-4 rounded-control bg-surface-alt p-8">
          <MediaIcon contentType={file.contentType} className="size-12 text-link" />
          <audio src={url} controls autoPlay className="w-full max-w-md">
            Your browser cannot play this audio.
          </audio>
        </div>
      )
    case 'pdf':
    case 'text':
      return (
        <iframe
          src={url}
          title={file.fileName}
          className="h-[65dvh] w-full rounded-control border border-line bg-surface-alt"
        />
      )
    default:
      return (
        <div className="grid justify-items-center gap-3 rounded-control bg-surface-alt p-10 text-center">
          <MediaIcon contentType={file.contentType} className="size-12 text-link" />
          <p className="text-sm text-muted">
            Office documents cannot be previewed here. Download the file to open it.
          </p>
        </div>
      )
  }
}
