import { cn } from '@/lib/cn'
import { ExternalLink } from './ExternalLink'

const urlPattern = /(https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)\]])/g

// User content renders as text; only web links become anchors
export function RichText({ text, className }: { text: string; className?: string }) {
  return (
    <p className={cn('wrap-text whitespace-pre-line', className)}>
      {text.split(urlPattern).map((part, index) =>
        index % 2 === 1 ? (
          <ExternalLink key={index} href={part}>
            {part}
          </ExternalLink>
        ) : (
          part
        ),
      )}
    </p>
  )
}
