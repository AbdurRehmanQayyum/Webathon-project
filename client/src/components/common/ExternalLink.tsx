import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface ExternalLinkProps {
  href: string
  children: ReactNode
  className?: string
}

export function ExternalLink({ href, children, className }: ExternalLinkProps) {
  const isSafe = /^https?:\/\//i.test(href)
  if (!isSafe) return <span>{children}</span>

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={cn('rounded text-link underline-offset-2 hover:underline', className)}
    >
      {children}
    </a>
  )
}
