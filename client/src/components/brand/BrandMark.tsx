import { cn } from '@/lib/cn'

interface BrandMarkProps {
  animation?: 'static' | 'intro' | 'loading'
  className?: string
}

export function BrandMark({ animation = 'static', className }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={cn('brand-mark shrink-0', `brand-mark--${animation}`, className)}
    >
      <path
        className="brand-mark__outer"
        pathLength={100}
        d="M48.97 15.03A24 24 0 1 0 48.97 48.97"
      />
      <path
        className="brand-mark__inner"
        pathLength={100}
        d="M40.49 23.51A12 12 0 1 0 40.49 40.49"
      />
      <circle className="brand-mark__node" cx={animation === 'loading' ? 32 : 50} cy="32" r="5" />
    </svg>
  )
}
