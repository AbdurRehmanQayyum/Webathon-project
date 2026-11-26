import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/feedback/toast-context'
import { cn } from '@/lib/cn'
import { fileUrl } from '@/services/api-client'
import { useDeleteFile } from './api'
import { FileUploader } from './FileUploader'
import { useFileUploader } from './useFileUploader'

interface ImageUploaderProps {
  title: string
  fileId: number | null
  uploadPath: string
  shape: 'round' | 'square' | 'wide'
}

const shapes = {
  round: 'size-20 rounded-full',
  square: 'size-20 rounded-panel',
  wide: 'aspect-4/1 w-full rounded-panel',
}

export function ImageUploader({ title, fileId, uploadPath, shape }: ImageUploaderProps) {
  const uploader = useFileUploader({ uploadPath, imagesOnly: true, maxFiles: 1 })
  const remove = useDeleteFile()
  const toast = useToast()

  return (
    <fieldset className="grid gap-3">
      <legend className="mb-2 text-sm font-medium">{title}</legend>
      {fileId && (
        <div className="flex flex-wrap items-center gap-3">
          <img
            src={fileUrl(fileId)}
            alt={`Current ${title.toLowerCase()}`}
            className={cn('bg-surface-alt object-cover', shapes[shape])}
          />
          <Button
            size="sm"
            icon={<Trash2 className="size-4" />}
            loading={remove.isPending}
            onClick={() =>
              remove.mutate(fileId, {
                onSuccess: () => toast.success('Image removed'),
                onError: toast.error,
              })
            }
          >
            Remove
          </Button>
        </div>
      )}
      <FileUploader uploader={uploader} label={fileId ? 'Replace image' : 'Upload image'} />
    </fieldset>
  )
}
