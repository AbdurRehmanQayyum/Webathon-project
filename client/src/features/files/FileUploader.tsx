import { Eye, RotateCw, UploadCloud, X } from 'lucide-react'
import { useId, useRef, useState, type DragEvent } from 'react'
import { IconButton } from '@/components/ui/IconButton'
import { cn } from '@/lib/cn'
import { formatBytes } from '@/lib/format'
import type { FileType } from './api'
import { MediaIcon } from './MediaIcon'
import type { FileUploaderState, UploadItem } from './useFileUploader'

// "Image up to 5 MB, Video up to 50 MB"
function describeLimits(types: FileType[]) {
  const limits = new Map(types.map((type) => [type.kind, type.maxSize]))
  return [...limits].map(([kind, size]) => `${kind} up to ${formatBytes(size)}`).join(' · ')
}

export function FileUploader({ uploader, label }: { uploader: FileUploaderState; label: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const hintId = useId()
  const [isDragging, setDragging] = useState(false)
  const isDisabled = !uploader.isReady || uploader.isFull

  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
    if (!isDisabled) uploader.add(Array.from(event.dataTransfer.files))
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        disabled={isDisabled}
        aria-describedby={hintId}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'grid w-full justify-items-center gap-1 rounded-panel border border-dashed border-line-strong px-4 py-5 text-center transition-colors',
          'hover:border-primary hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-60',
          isDragging && 'border-primary bg-selected',
        )}
      >
        <UploadCloud className="size-6 text-link" aria-hidden="true" />
        <span className="text-sm font-medium">{label}</span>
        <span id={hintId} className="text-xs text-muted">
          {uploader.isFull
            ? `Limit of ${uploader.maxFiles} files reached`
            : `Drop here or browse · ${describeLimits(uploader.types)}`}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        hidden
        multiple={uploader.maxFiles > 1}
        accept={uploader.types.map((type) => type.extension).join(',')}
        onChange={(event) => {
          uploader.add(Array.from(event.target.files ?? []))
          event.target.value = ''
        }}
      />
      {uploader.notice && (
        <p role="alert" className="text-sm text-danger-fg">
          {uploader.notice}
        </p>
      )}
      {uploader.items.length > 0 && (
        <ul className="grid gap-2" aria-label="Selected files">
          {uploader.items.map((item) => (
            <UploadRow key={item.id} item={item} uploader={uploader} />
          ))}
        </ul>
      )}
    </div>
  )
}

function UploadRow({ item, uploader }: { item: UploadItem; uploader: FileUploaderState }) {
  const isValid = item.status !== 'invalid'
  const isImage = isValid && item.file.type.startsWith('image/')
  const isVideo = isValid && item.file.type.startsWith('video/')
  const isAudio = isValid && item.file.type.startsWith('audio/')
  const canPreview = item.file.type === 'application/pdf' || item.file.type === 'text/plain'
  const isUploading = item.status === 'uploading'

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-control border border-line bg-surface p-2">
      {isImage ? (
        <img src={item.previewUrl} alt="" className="size-11 shrink-0 rounded-md object-cover" />
      ) : isVideo ? (
        <video src={item.previewUrl} muted preload="metadata" className="size-11 shrink-0 rounded-md object-cover" />
      ) : (
        <span className="grid size-11 shrink-0 place-items-center rounded-md bg-surface-alt">
          <MediaIcon contentType={item.file.type} className="size-5 text-muted" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.file.name}</p>
        {item.error ? (
          <p role="alert" className="text-xs text-danger-fg">
            {item.error}
          </p>
        ) : (
          <p className="text-xs text-muted">
            {formatBytes(item.file.size)}
            {isUploading ? ` · Uploading ${item.progress}%` : ' · Ready'}
          </p>
        )}
        {isUploading && (
          <div
            role="progressbar"
            aria-label={`Uploading ${item.file.name}`}
            aria-valuenow={item.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-alt"
          >
            <div
              className="h-full origin-left bg-primary transition-transform duration-200"
              style={{ transform: `scaleX(${item.progress / 100})` }}
            />
          </div>
        )}
      </div>
      {canPreview && !isUploading && (
        <a
          href={item.previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Preview ${item.file.name}`}
          className="grid size-8 place-items-center rounded-control text-muted hover:text-fg"
        >
          <Eye className="size-4" />
        </a>
      )}
      {item.status === 'error' && uploader.canRetry && (
        <IconButton
          size="icon-sm"
          label="Retry upload"
          icon={<RotateCw className="size-4" />}
          onClick={() => uploader.retry(item)}
        />
      )}
      <IconButton
        size="icon-sm"
        label={isUploading ? 'Cancel upload' : 'Remove file'}
        icon={<X className="size-4" />}
        onClick={() => uploader.remove(item)}
      />
      {isAudio && !isUploading && <audio src={item.previewUrl} controls className="h-9 w-full" />}
    </li>
  )
}
