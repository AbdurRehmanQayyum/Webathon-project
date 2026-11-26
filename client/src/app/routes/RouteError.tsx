import { ErrorState } from '@/components/feedback/ErrorState'

// Shown when a route fails to render or its code cannot be downloaded
export function RouteError() {
  return (
    <div className="mx-auto grid min-h-dvh max-w-md content-center px-4">
      <ErrorState
        error={new Error('Reload the page to continue.')}
        onRetry={() => window.location.reload()}
      />
    </div>
  )
}
