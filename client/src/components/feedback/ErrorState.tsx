import { CircleAlert, RotateCw, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ApiError } from '@/services/api-client'

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const isOffline = error instanceof ApiError && error.isNetworkError
  const Icon = isOffline ? WifiOff : CircleAlert
  const message = error instanceof Error ? error.message : 'Something went wrong.'

  return (
    <div
      role="alert"
      className="grid justify-items-center gap-2 rounded-panel border border-line bg-surface px-6 py-10 text-center"
    >
      <Icon className="size-7 text-muted" aria-hidden="true" />
      <h2 className="text-base font-semibold">
        {isOffline ? 'Connection lost' : 'This could not be loaded'}
      </h2>
      <p className="max-w-sm text-sm text-muted">{message}</p>
      {onRetry && (
        <Button className="mt-3" icon={<RotateCw className="size-4" />} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
