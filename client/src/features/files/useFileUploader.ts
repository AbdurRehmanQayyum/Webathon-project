import { useCallback, useEffect, useRef, useState } from 'react'
import { formatBytes } from '@/lib/format'
import { uploadFile } from '@/services/api-client'
import { useFilePolicy, useRefreshFiles, type FilePolicy, type FileType } from './api'

export interface UploadItem {
  id: string
  file: File
  progress: number
  status: 'queued' | 'uploading' | 'error' | 'invalid'
  error?: string
  previewUrl: string
}

interface UploaderOptions {
  imagesOnly?: boolean
  maxFiles: number
  existingCount?: number
  // When set, files upload as soon as they are chosen; otherwise call uploadAll
  uploadPath?: string
}

function validate(file: File, policy: FilePolicy, types: FileType[]) {
  const extension = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`
  const type = types.find((candidate) => candidate.extension === extension)
  if (!type) return 'This file type is not allowed.'
  if (file.size === 0) return 'The file is empty.'
  if (file.size > type.maxSize) {
    return `The ${type.kind.toLowerCase()} limit is ${formatBytes(type.maxSize)}.`
  }
  if (policy.usedBytes + file.size > policy.quotaBytes) return 'Not enough storage left.'
  return null
}

export function useFileUploader({
  imagesOnly = false,
  maxFiles,
  existingCount = 0,
  uploadPath,
}: UploaderOptions) {
  const policy = useFilePolicy()
  const refresh = useRefreshFiles()
  const [items, setItems] = useState<UploadItem[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const controllers = useRef(new Map<string, AbortController>())
  const previews = useRef(new Set<string>())

  const types = (policy.data?.types ?? []).filter((type) => !imagesOnly || type.kind === 'Image')

  useEffect(() => {
    const activeUploads = controllers.current
    const activePreviews = previews.current
    return () => {
      activeUploads.forEach((controller) => controller.abort())
      activePreviews.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  const patch = useCallback((id: string, changes: Partial<UploadItem>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...changes } : item)))
  }, [])

  const remove = useCallback((item: UploadItem) => {
    controllers.current.get(item.id)?.abort()
    controllers.current.delete(item.id)
    URL.revokeObjectURL(item.previewUrl)
    previews.current.delete(item.previewUrl)
    setItems((current) => current.filter((other) => other.id !== item.id))
  }, [])

  const upload = useCallback(
    async (item: UploadItem, path: string) => {
      const controller = new AbortController()
      controllers.current.set(item.id, controller)
      patch(item.id, { status: 'uploading', progress: 0, error: undefined })

      try {
        await uploadFile(
          path,
          item.file,
          (progress) => patch(item.id, { progress }),
          controller.signal,
        )
        await refresh()
        remove(item)
        return true
      } catch (error) {
        if (!controller.signal.aborted) {
          patch(item.id, {
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed.',
          })
        }
        return false
      }
    },
    [patch, refresh, remove],
  )

  const add = (files: File[]) => {
    if (!policy.data || files.length === 0) return
    // A single-image field replaces its current choice
    const replaces = maxFiles === 1
    if (replaces) items.forEach(remove)
    const room = replaces ? 1 : maxFiles - existingCount - items.length
    setNotice(files.length > room ? `You can attach up to ${maxFiles} files.` : null)

    const added = files.slice(0, Math.max(room, 0)).map((file): UploadItem => {
      const error = validate(file, policy.data, types)
      const previewUrl = URL.createObjectURL(file)
      previews.current.add(previewUrl)
      return {
        id: crypto.randomUUID(),
        file,
        progress: 0,
        previewUrl,
        status: error ? 'invalid' : 'queued',
        error: error ?? undefined,
      }
    })

    setItems((current) => [...current, ...added])
    if (uploadPath) {
      added
        .filter((item) => item.status === 'queued')
        .forEach((item) => void upload(item, uploadPath))
    }
  }

  // Returns the number of files that could not be uploaded
  const uploadAll = async (path: string) => {
    let failures = 0
    for (const item of items.filter((candidate) => candidate.status !== 'invalid')) {
      if (!(await upload(item, path))) failures += 1
    }
    return failures
  }

  return {
    items,
    notice,
    add,
    remove,
    retry: (item: UploadItem) => uploadPath && void upload(item, uploadPath),
    canRetry: Boolean(uploadPath),
    uploadAll,
    isUploading: items.some((item) => item.status === 'uploading'),
    isReady: policy.data !== undefined,
    isFull: maxFiles > 1 && existingCount + items.length >= maxFiles,
    maxFiles,
    types,
  }
}

export type FileUploaderState = ReturnType<typeof useFileUploader>
