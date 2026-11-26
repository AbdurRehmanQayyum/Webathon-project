import type { MouseEvent } from 'react'
import { useNavigate } from 'react-router'
import { cn } from '@/lib/cn'

// Renders markup that the API has already sanitised
export function RichContent({ html, className }: { html: string; className?: string }) {
  const navigate = useNavigate()

  // Mentions and tags navigate inside the app
  const onClick = (event: MouseEvent) => {
    const href = (event.target as HTMLElement).closest('a')?.getAttribute('href')
    if (href?.startsWith('/') && !event.ctrlKey && !event.metaKey) {
      event.preventDefault()
      void navigate(href)
    }
  }

  return (
    <div
      className={cn('rich-content wrap-text', className)}
      onClick={onClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
