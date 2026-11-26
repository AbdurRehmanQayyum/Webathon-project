import type { Attachment } from '@/types/common'
import { AttachmentGallery } from './AttachmentGallery'
import { FileUploader } from './FileUploader'
import { useFileUploader } from './useFileUploader'

export const MAX_ATTACHMENTS = 6

// Existing files plus immediate uploads for a saved record
export function AttachmentManager({
  attachments,
  uploadPath,
}: {
  attachments: Attachment[]
  uploadPath: string
}) {
  const uploader = useFileUploader({
    uploadPath,
    maxFiles: MAX_ATTACHMENTS,
    existingCount: attachments.length,
  })

  return (
    <div className="grid gap-3">
      <AttachmentGallery attachments={attachments} removable />
      <FileUploader uploader={uploader} label="Add images, video, audio or documents" />
    </div>
  )
}
