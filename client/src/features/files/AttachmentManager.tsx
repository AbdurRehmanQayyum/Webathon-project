import type { Attachment } from '@/types/common'
import { AttachmentList } from './AttachmentList'
import { FileUploader } from './FileUploader'
import { useFileUploader } from './useFileUploader'

export const MAX_ATTACHMENTS = 4

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
      <AttachmentList attachments={attachments} removable />
      <FileUploader uploader={uploader} label="Add attachments" />
    </div>
  )
}
