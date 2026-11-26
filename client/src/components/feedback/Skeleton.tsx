import { cn } from '@/lib/cn'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-shimmer rounded-md bg-surface-alt', className)} />
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading content" className="grid gap-3">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="grid gap-3 rounded-panel border border-line bg-surface p-4">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  )
}
