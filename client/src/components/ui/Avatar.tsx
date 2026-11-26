import { useState } from 'react'
import { cn } from '@/lib/cn'
import { fileUrl } from '@/services/api-client'

const sizes = {
  xs: 'size-6 text-[0.625rem]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-20 text-xl',
}

interface AvatarProps {
  name: string
  fileId?: number | null
  size?: keyof typeof sizes
}

function initials(name: string) {
  const words = name.replace(/^(Dr|Prof|Mr|Ms|Mrs)\.\s+/i, '').split(/\s+/)
  return [words[0], words.length > 1 ? words.at(-1) : undefined]
    .map((word) => word?.[0] ?? '')
    .join('')
    .toUpperCase()
}

export function Avatar({ name, fileId, size = 'sm' }: AvatarProps) {
  const [failedId, setFailedId] = useState<number | null>(null)
  const shape = cn('shrink-0 rounded-full', sizes[size])

  if (fileId && fileId !== failedId) {
    return (
      <img
        src={fileUrl(fileId)}
        alt=""
        className={cn(shape, 'object-cover')}
        onError={() => setFailedId(fileId)}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className={cn(shape, 'grid place-items-center bg-selected font-semibold text-selected-fg')}
    >
      {initials(name)}
    </span>
  )
}
