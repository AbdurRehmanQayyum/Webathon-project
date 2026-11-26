import { BrandMark } from '@/components/brand/BrandMark'
import { cn } from '@/lib/cn'

interface BrandLoaderProps {
  label?: string
  fullScreen?: boolean
}

export function BrandLoader({ label = 'Loading', fullScreen = false }: BrandLoaderProps) {
  return (
    <div
      role="status"
      className={cn('grid place-items-center gap-3', fullScreen ? 'fixed inset-0 bg-bg' : 'py-16')}
    >
      <BrandMark animation="loading" className={fullScreen ? 'size-18' : 'size-12'} />
      <span className="sr-only">{label}</span>
    </div>
  )
}
