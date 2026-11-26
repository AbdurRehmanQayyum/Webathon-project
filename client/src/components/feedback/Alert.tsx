import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

const tones = {
  info: { style: 'bg-info-soft text-info', Icon: Info },
  success: { style: 'bg-success-soft text-success', Icon: CircleCheck },
  warning: { style: 'bg-warning-soft text-warning', Icon: TriangleAlert },
  danger: { style: 'bg-danger-soft text-danger-fg', Icon: CircleAlert },
}

interface AlertProps {
  tone?: keyof typeof tones
  children: ReactNode
  className?: string
}

export function Alert({ tone = 'info', children, className }: AlertProps) {
  const { style, Icon } = tones[tone]
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2.5 rounded-control px-3 py-2.5 text-sm',
        style,
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="wrap-text">{children}</div>
    </div>
  )
}
